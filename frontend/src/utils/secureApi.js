import axios from 'axios';
import CryptoJS from 'crypto-js';

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

/**
 * Build telemetry object for anti-replay + fingerprinting.
 * Fully resilient — never throws, always returns valid telemetry.
 */
const buildTelemetry = () => {
  let fp = '';
  let ck = '';
  
  try {
    // Try to get stored fingerprint first
    fp = sessionStorage.getItem('_fp') || '';
    
    // Generate if missing
    if (!fp || fp.length !== 64) {
      const { generateBrowserFingerprint } = require('./security');
      const result = generateBrowserFingerprint();
      fp = result?.fingerprint || '';
      if (fp) sessionStorage.setItem('_fp', fp);
    }
  } catch (e) {
    // Fallback fingerprint from basic browser data
    try {
      const raw = navigator.userAgent + screen.width + screen.height + navigator.language + (new Date().getTimezoneOffset());
      fp = CryptoJS.SHA256(raw).toString();
    } catch {
      fp = CryptoJS.SHA256(Math.random().toString() + Date.now().toString()).toString();
    }
  }
  
  try {
    const { getSecurityCookie } = require('./security');
    ck = getSecurityCookie() || '';
  } catch {
    ck = '';
  }
  
  // Generate nonce — always works
  let nonce = '';
  try {
    nonce = CryptoJS.lib.WordArray.random(16).toString();
  } catch {
    nonce = Date.now().toString(16) + Math.random().toString(16).slice(2);
  }
  
  return {
    fp: fp || CryptoJS.SHA256(Date.now().toString()).toString(),
    ts: Date.now(),
    nonce,
    ck,
  };
};

/**
 * Secure POST — injects telemetry into request body.
 * Resilient: if telemetry building fails, sends plain request.
 */
export const securePost = async (endpoint, data = {}) => {
  let payload;
  
  try {
    const telemetry = buildTelemetry();
    payload = { ...data, _t: telemetry };
  } catch {
    // Telemetry failed entirely — send plain request
    payload = data;
  }
  
  const response = await axios.post(`${API}${endpoint}`, payload, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 15000
  });
  
  return response.data;
};

/**
 * Secure GET — adds security headers (best-effort).
 */
export const secureGet = async (endpoint, params = {}) => {
  let headers = {};
  
  try {
    const fp = sessionStorage.getItem('_fp') || '';
    headers = {
      'X-Fingerprint': fp,
      'X-Timestamp': Date.now().toString()
    };
  } catch {}
  
  const response = await axios.get(`${API}${endpoint}`, {
    params,
    headers,
    withCredentials: true,
    timeout: 15000
  });
  
  return response.data;
};

export default { post: securePost, get: secureGet };
