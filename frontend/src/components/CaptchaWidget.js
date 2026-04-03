import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, Loader2, AlertTriangle } from "lucide-react";
import CryptoJS from "crypto-js";
import { securePost } from "@/utils/secureApi";

/**
 * DeezLink Custom CAPTCHA Widget
 * 
 * Security layers:
 * - Proof of Work: SHA256(prefix + nonce) with leading zeros (~1-2s CPU)
 * - Slider match: user must visually align handle to target (±6 tolerance)
 * - Timing: reject < 800ms (too fast = bot) or > 120s (expired)
 * - One-time use: each challenge can only be verified once
 * - Fingerprint-bound telemetry
 */

const STATES = {
  IDLE: "idle",
  LOADING: "loading",
  CHALLENGE: "challenge",
  SOLVING: "solving",
  SUCCESS: "success",
  ERROR: "error"
};

export default function CaptchaWidget({ onVerified, label }) {
  const [state, setState] = useState(STATES.IDLE);
  const [challenge, setChallenge] = useState(null);
  const [sliderValue, setSliderValue] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [powProgress, setPowProgress] = useState(0);
  const startTimeRef = useRef(0);
  const powResultRef = useRef(null);
  const trackRef = useRef(null);

  // Request challenge
  const requestChallenge = useCallback(async () => {
    setState(STATES.LOADING);
    setError("");
    setPowProgress(0);
    powResultRef.current = null;

    try {
      const data = await securePost("/captcha/generate", {});
      setChallenge(data);
      setSliderValue(10); // Start away from target
      setState(STATES.CHALLENGE);
      startTimeRef.current = Date.now();

      // Start PoW
      runPow(data.pow_prefix, data.pow_difficulty);
    } catch (err) {
      setError("Failed to load challenge");
      setState(STATES.ERROR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proof of Work
  const runPow = (prefix, difficulty) => {
    const target = "0".repeat(difficulty);
    let nonce = 0;
    const batch = 8000;

    const work = () => {
      for (let i = 0; i < batch; i++) {
        const h = CryptoJS.SHA256(prefix + nonce.toString()).toString();
        if (h.startsWith(target)) {
          powResultRef.current = nonce.toString();
          setPowProgress(100);
          return;
        }
        nonce++;
      }
      const est = Math.pow(16, difficulty);
      setPowProgress(Math.min(95, Math.round((nonce / est) * 100)));
      if (!powResultRef.current) {
        requestAnimationFrame(work);
      }
    };
    requestAnimationFrame(work);
  };

  // Slider interaction
  const updateSlider = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderValue(Math.round(pct));
  };

  const onDown = (e) => {
    if (state !== STATES.CHALLENGE) return;
    setIsDragging(true);
    updateSlider(e);
  };

  const onMove = useCallback((e) => {
    if (!isDragging) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderValue(Math.round(pct));
  }, [isDragging]);

  const onUp = useCallback(() => {
    if (isDragging) setIsDragging(false);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      const mv = (e) => onMove(e);
      const up = () => onUp();
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", up);
      window.addEventListener("touchmove", mv, { passive: false });
      window.addEventListener("touchend", up);
      return () => {
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("touchmove", mv);
        window.removeEventListener("touchend", up);
      };
    }
  }, [isDragging, onMove, onUp]);

  // Submit
  const submit = async () => {
    if (!challenge || !powResultRef.current) return;
    setState(STATES.SOLVING);
    const solveTime = Date.now() - startTimeRef.current;

    try {
      const result = await securePost("/captcha/verify", {
        challenge_id: challenge.challenge_id,
        slider_value: sliderValue,
        pow_nonce: powResultRef.current,
        solve_time_ms: solveTime
      });

      if (result.success && result.captcha_token) {
        setState(STATES.SUCCESS);
        onVerified(result.captcha_token);
      } else {
        setError("Verification failed");
        setState(STATES.ERROR);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || "Verification failed";
      setError(typeof detail === "string" ? detail : "Verification failed");
      setState(STATES.ERROR);
    }
  };

  // ═══════ RENDER ═══════

  if (state === STATES.SUCCESS) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <Check className="h-4 w-4 text-green-400" />
        <span className="text-green-400 text-[13px] font-medium">Verified</span>
      </motion.div>
    );
  }

  if (state === STATES.IDLE) {
    return (
      <button type="button" onClick={requestChallenge} data-testid="captcha-start"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/30 hover:bg-purple-500/[0.05] transition-all text-[13px] text-zinc-400 hover:text-zinc-300 cursor-pointer select-none">
        <Shield className="h-4 w-4 text-purple-400/60" />
        {label || "Click to verify you're human"}
      </button>
    );
  }

  if (state === STATES.LOADING) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[13px] text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        Loading...
      </div>
    );
  }

  if (state === STATES.ERROR) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-red-400 text-[13px]">{error}</span>
        </div>
        <button type="button" onClick={requestChallenge}
          className="w-full text-center text-purple-400 text-[12px] hover:text-purple-300 transition-colors py-1">
          Retry
        </button>
      </div>
    );
  }

  if (state === STATES.SOLVING) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[13px] text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        Verifying...
      </div>
    );
  }

  // ═══════ CHALLENGE STATE ═══════
  const target = challenge?.target || 50;
  const isClose = Math.abs(sliderValue - target) <= 6;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <Shield className="h-3.5 w-3.5 text-purple-400" />
        <span className="text-[12px] text-zinc-400 font-medium">
          Align the slider to the target marker
        </span>
      </div>

      {/* Slider */}
      <div className="px-4 py-4">
        <div ref={trackRef}
          className="relative h-11 rounded-lg bg-zinc-900/80 border border-white/[0.06] cursor-pointer select-none touch-none overflow-hidden"
          onPointerDown={onDown}
          onTouchStart={(e) => { e.preventDefault(); onDown(e.touches[0]); }}
        >
          {/* Background grid */}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(p => (
            <div key={p} className="absolute top-0 bottom-0 w-px bg-white/[0.04]" style={{ left: `${p}%` }} />
          ))}

          {/* Filled zone */}
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-600/20 to-purple-500/10"
            style={{ width: `${sliderValue}%`, transition: isDragging ? "none" : "width 0.15s" }} />

          {/* TARGET MARKER — the user needs to match this */}
          <div className="absolute top-0 bottom-0 flex flex-col items-center justify-center z-[5]"
            style={{ left: `${target}%`, transform: "translateX(-50%)" }}>
            {/* Top triangle */}
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-amber-400/80" />
            {/* Line */}
            <div className="w-[2px] flex-1 bg-amber-400/60" />
            {/* Bottom triangle */}
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-amber-400/80" />
          </div>

          {/* HANDLE — draggable */}
          <motion.div
            className={`absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-10 transition-colors ${
              isClose ? "bg-green-500 shadow-green-500/30" : "bg-purple-600 shadow-purple-500/30"
            }`}
            style={{ left: `calc(${sliderValue}% - 18px)`, transition: isDragging ? "none" : "left 0.15s" }}
          >
            <div className="flex gap-[2px]">
              <div className="w-[2px] h-3 rounded-full bg-white/50" />
              <div className="w-[2px] h-3 rounded-full bg-white/50" />
              <div className="w-[2px] h-3 rounded-full bg-white/50" />
            </div>
          </motion.div>
        </div>

        {/* Status bar */}
        <div className="flex justify-between items-center mt-2">
          <span className={`text-[11px] tabular-nums ${isClose ? "text-green-400 font-medium" : "text-zinc-600"}`}>
            {isClose ? "✓ Aligned" : `${sliderValue}%`}
          </span>
          <div className="flex items-center gap-1.5">
            {powProgress < 100 ? (
              <>
                <div className="w-14 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-purple-500/50 rounded-full transition-all" style={{ width: `${powProgress}%` }} />
                </div>
                <span className="text-[10px] text-zinc-600">securing...</span>
              </>
            ) : (
              <span className="text-[10px] text-green-500/70">✓ ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="px-4 pb-3">
        <button type="button" onClick={submit} disabled={powProgress < 100 || !isClose}
          data-testid="captcha-submit"
          className={`w-full py-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2
            ${powProgress >= 100 && isClose
              ? "bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}>
          <Check className="h-3.5 w-3.5" />
          Verify
        </button>
      </div>
    </motion.div>
  );
}
