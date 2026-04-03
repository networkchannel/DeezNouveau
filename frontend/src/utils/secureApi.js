import axios from 'axios';
import { generateBrowserFingerprint, getSecurityCookie } from './security';
import CryptoJS from 'crypto-js';

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

/**
 * Build telemetry object for anti-replay + fingerprinting
 * Sent with every sensitive POST request
 */
const buildTelemetry = () => {
  const fp = sessionStorage.getItem('_fp') || generateBrowserFingerprint().fingerprint;
  const ck = getSecurityCookie();
  
  return {
    fp,
    ts: Date.now(),
    nonce: CryptoJS.lib.WordArray.random(16).toString(),
    ck,
  };
};

/**
 * Secure POST — injects telemetry into request body
 * The backend extracts _t and validates it
 */
export const securePost = async (endpoint, data = {}) => {
  const telemetry = buildTelemetry();
  
  const payload = {
    ...data,
    _t: telemetry
  };
  
  try {
    const response = await axios.post(`${API}${endpoint}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.warn('[Security] Telemetry validation failed — refreshing security state');
      // Regenerate fingerprint and retry once
      const { fingerprint } = generateBrowserFingerprint();
      sessionStorage.setItem('_fp', fingerprint);
      sessionStorage.setItem('_seq', '0');
    }
    throw error;
  }
};

/**
 * Secure GET — adds security headers
 */
export const secureGet = async (endpoint, params = {}) => {
  const fp = sessionStorage.getItem('_fp') || generateBrowserFingerprint().fingerprint;
  const ck = getSecurityCookie();
  
  try {
    const response = await axios.get(`${API}${endpoint}`, {
      params,
      headers: {
        'X-Fingerprint': fp,
        'X-Security-Cookie': ck,
        'X-Timestamp': Date.now().toString()
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.warn('[Security] GET validation failed');
    }
    throw error;
  }
};

export default { post: securePost, get: secureGet };
