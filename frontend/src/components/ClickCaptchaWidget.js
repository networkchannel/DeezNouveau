import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, Loader2, AlertTriangle } from 'lucide-react';
import telemetryService from '@/utils/telemetryService';

/**
 * ClickCaptchaWidget v2 — Lightweight click captcha
 * 
 * Flow:
 * 1. User clicks "I'm not a robot" button
 * 2. Challenge starts on server (records timestamp)
 * 3. 5-second progress animation
 * 4. Auto-verifies after 5s (server checks timing)
 * 5. Returns bound captcha_token (one-time, IP+FP bound)
 * 
 * Conditional: only renders if requireCaptcha is true.
 */

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

const STATES = {
  IDLE: 'idle',
  WAITING: 'waiting',     // 5s countdown
  VERIFYING: 'verifying', // Server verification
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function ClickCaptchaWidget({ onVerified, label, forceShow = false }) {
  const [state, setState] = useState(STATES.IDLE);
  const [challengeId, setChallengeId] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef(null);
  const startRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startChallenge = useCallback(async () => {
    setState(STATES.WAITING);
    setError('');
    setProgress(0);

    try {
      const fp = telemetryService.fingerprint || sessionStorage.getItem('_fp') || '';
      const secToken = telemetryService.token || '';
      
      const resp = await fetch(`${API}/captcha/click/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprint: fp,
          security_token: secToken,
        }),
      });

      if (!resp.ok) {
        throw new Error('Failed to start challenge');
      }

      const data = await resp.json();
      setChallengeId(data.challenge_id);
      startRef.current = Date.now();

      // Start 5-second progress animation
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 100;
        const pct = Math.min(100, (elapsed / 5000) * 100);
        setProgress(pct);

        if (elapsed >= 5200) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Auto-verify
          verifyChallenge(data.challenge_id, fp);
        }
      }, 100);
    } catch (err) {
      setError('Failed to start verification');
      setState(STATES.ERROR);
    }
  }, []);

  const verifyChallenge = async (id, fp) => {
    setState(STATES.VERIFYING);

    try {
      const resp = await fetch(`${API}/captcha/click/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: id,
          fingerprint: fp || telemetryService.fingerprint || '',
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || 'Verification failed');
      }

      const data = await resp.json();
      if (data.success && data.captcha_token) {
        setState(STATES.SUCCESS);
        onVerified(data.captcha_token);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      const msg = typeof err.message === 'string' ? err.message : 'Verification failed';
      setError(msg);
      setState(STATES.ERROR);
    }
  };

  // ═══ RENDER ═══

  if (state === STATES.SUCCESS) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
        data-testid="captcha-success"
      >
        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="h-3 w-3 text-green-400" />
        </div>
        <span className="text-green-400 text-xs font-medium">Verified</span>
      </motion.div>
    );
  }

  if (state === STATES.IDLE) {
    return (
      <button
        type="button"
        onClick={startChallenge}
        data-testid="captcha-start"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/30 hover:bg-purple-500/[0.05] transition-all cursor-pointer select-none group"
      >
        <div className="w-5 h-5 rounded border-2 border-zinc-600 group-hover:border-purple-500/50 transition-colors flex-shrink-0" />
        <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
          {label || "I'm not a robot"}
        </span>
        <Shield className="h-3.5 w-3.5 text-purple-400/40 ml-auto flex-shrink-0" />
      </button>
    );
  }

  if (state === STATES.WAITING) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-purple-500/20"
        data-testid="captcha-waiting"
      >
        <div className="relative w-5 h-5 flex-shrink-0">
          <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
            <circle
              cx="10" cy="10" r="8" fill="none"
              stroke="#a855f7" strokeWidth="2"
              strokeDasharray={`${progress * 0.5} 100`}
              strokeLinecap="round"
              className="transition-all duration-100"
            />
          </svg>
        </div>
        <span className="text-xs text-zinc-400">Verifying...</span>
        <span className="text-[10px] text-zinc-600 ml-auto tabular-nums">
          {Math.ceil((5000 - (progress / 100) * 5000) / 1000)}s
        </span>
      </motion.div>
    );
  }

  if (state === STATES.VERIFYING) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
        <Loader2 className="h-4 w-4 animate-spin text-purple-400 flex-shrink-0" />
        <span className="text-xs text-zinc-500">Finalizing...</span>
      </div>
    );
  }

  if (state === STATES.ERROR) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-xs">{error}</span>
        </div>
        <button
          type="button"
          onClick={() => { setState(STATES.IDLE); setError(''); }}
          className="text-purple-400 text-[11px] hover:text-purple-300 transition-colors px-1"
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}
