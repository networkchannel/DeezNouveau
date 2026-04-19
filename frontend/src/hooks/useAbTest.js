import { useEffect, useMemo, useRef } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

function getSessionId() {
  try {
    let id = localStorage.getItem("dz_session_id");
    if (!id) {
      id = (crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(36).slice(2, 10));
      localStorage.setItem("dz_session_id", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/**
 * Stable A/B variant per browser for a given experiment.
 * Variants: "a" (control) | "b" (test). 50/50 split.
 * Persists in localStorage so the user sees the same variant across sessions.
 */
export function useAbTest(experimentKey) {
  const variant = useMemo(() => {
    try {
      const storageKey = `dz_ab_${experimentKey}`;
      let v = localStorage.getItem(storageKey);
      if (v !== "a" && v !== "b") {
        v = Math.random() < 0.5 ? "a" : "b";
        localStorage.setItem(storageKey, v);
      }
      return v;
    } catch {
      return "a";
    }
  }, [experimentKey]);

  const sessionId = useMemo(() => getSessionId(), []);
  const viewedRef = useRef(false);

  // Track view once per mount
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    axios.post(`${API}/ab/track`, {
      experiment: experimentKey,
      variant,
      event: "view",
      session_id: sessionId,
    }).catch(() => {});
  }, [experimentKey, variant, sessionId]);

  const trackClick = (meta = {}) => {
    axios.post(`${API}/ab/track`, {
      experiment: experimentKey,
      variant,
      event: "click",
      session_id: sessionId,
      ...meta,
    }).catch(() => {});
  };

  return { variant, sessionId, trackClick };
}
