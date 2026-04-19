import axios from 'axios';
import CryptoJS from 'crypto-js';
import telemetryService from './telemetryService';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

/**
 * Build telemetry object for anti-replay + fingerprinting.
 * Uses TelemetryService v2 for rotating tokens + backward-compatible _t field.
 */
const buildTelemetry = () => {
  try {
    return telemetryService.buildTelemetry();
  } catch {
    // Fallback
    let fp = '';
    try {
      fp = sessionStorage.getItem('_fp') || '';
      if (!fp || fp.length !== 64) {
        const raw = navigator.userAgent + screen.width + screen.height + navigator.language + (new Date().getTimezoneOffset());
        fp = CryptoJS.SHA256(raw).toString();
      }
    } catch {
      fp = CryptoJS.SHA256(Math.random().toString() + Date.now().toString()).toString();
    }
    return {
      fp,
      ts: Date.now(),
      nonce: CryptoJS.lib.WordArray.random(16).toString(),
      ck: '',
    };
  }
};

/**
 * Get security headers from TelemetryService.
 */
const getSecurityHeaders = () => {
  try {
    return telemetryService.getHeaders();
  } catch {
    return {};
  }
};

/**
 * Secure POST — injects telemetry into body + security headers.
 */
export const securePost = async (endpoint, data = {}) => {
  let payload;
  
  try {
    const telemetry = buildTelemetry();
    payload = { ...data, _t: telemetry };
  } catch {
    payload = data;
  }
  
  const secHeaders = getSecurityHeaders();
  
  const response = await axios.post(`${API}${endpoint}`, payload, {
    headers: {
      'Content-Type': 'application/json',
      ...secHeaders,
    },
    withCredentials: true,
    timeout: 15000,
  });
  
  return response.data;
};

/**
 * Secure GET — adds security headers.
 */
export const secureGet = async (endpoint, params = {}) => {
  const secHeaders = getSecurityHeaders();
  
  const response = await axios.get(`${API}${endpoint}`, {
    params,
    headers: {
      ...secHeaders,
    },
    withCredentials: true,
    timeout: 15000,
  });
  
  return response.data;
};

export default { post: securePost, get: secureGet };
