import CryptoJS from 'crypto-js';
import { generateBrowserFingerprint, getSecurityCookie } from './security';

/**
 * TelemetryService v2
 * 
 * Manages rotating security session tokens:
 * - On app load: calls /api/security/token/init
 * - Every 30s: calls /api/security/token/renew with previous token
 * - Attaches security headers to all requests
 * - Anti-replay: unique nonces per request
 * - Impossible to replay: token chain is server-validated
 */

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

class TelemetryService {
  constructor() {
    this._token = null;
    this._sessionId = null;
    this._fingerprint = '';
    this._ipScore = 100;
    this._requireCaptcha = false;
    this._renewInterval = null;
    this._initialized = false;
    this._initPromise = null;
    this._renewalCount = 0;
    this._lastRenewal = 0;
    this._listeners = new Set();
  }

  /**
   * Initialize the telemetry session.
   * Call this once on app load.
   */
  async init() {
    if (this._initPromise) return this._initPromise;
    
    this._initPromise = this._doInit();
    return this._initPromise;
  }

  async _doInit() {
    try {
      // Get or generate fingerprint
      let fp = sessionStorage.getItem('_fp') || '';
      if (!fp || fp.length !== 64) {
        try {
          const result = generateBrowserFingerprint();
          fp = result?.fingerprint || '';
          if (fp) sessionStorage.setItem('_fp', fp);
        } catch {
          fp = CryptoJS.SHA256(
            navigator.userAgent + screen.width + screen.height + Date.now()
          ).toString();
        }
      }
      this._fingerprint = fp;

      // Initialize session with server
      const resp = await fetch(`${API}/security/token/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp }),
      });

      if (!resp.ok) {
        // 401 is an expected, recoverable state — silence to avoid console noise
        if (resp.status !== 401) {
          console.warn('[Telemetry] Init failed:', resp.status);
        }
        this._initialized = false;
        return false;
      }

      const data = await resp.json();
      this._token = data.token;
      this._sessionId = data.session_id;
      this._ipScore = data.ip_score;
      this._requireCaptcha = data.require_captcha;
      this._lastRenewal = Date.now();
      this._initialized = true;

      // Start renewal interval (every 28s - slightly before 30s to avoid expiry)
      this._startRenewalLoop();

      console.log(`[Telemetry] Session initialized: score=${data.ip_score} captcha=${data.require_captcha}`);
      this._notifyListeners();
      return true;
    } catch (err) {
      console.error('[Telemetry] Init error:', err);
      this._initialized = false;
      return false;
    }
  }

  _startRenewalLoop() {
    if (this._renewInterval) clearInterval(this._renewInterval);
    
    this._renewInterval = setInterval(() => {
      this._renew();
    }, 28000); // 28 seconds
  }

  async _renew() {
    if (!this._token) {
      // Re-initialize if token is missing
      this._initPromise = null;
      await this.init();
      return;
    }

    try {
      const resp = await fetch(`${API}/security/token/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this._token,
          fingerprint: this._fingerprint,
        }),
      });

      if (!resp.ok) {
        // 401 is an expected, recoverable state handled by re-init below
        if (resp.status !== 401) {
          console.warn('[Telemetry] Renewal failed:', resp.status);
        }
        // If 401, re-initialize
        if (resp.status === 401) {
          this._token = null;
          this._initPromise = null;
          await this.init();
        }
        return;
      }

      const data = await resp.json();
      this._token = data.token;
      this._ipScore = data.ip_score;
      this._requireCaptcha = data.require_captcha;
      this._renewalCount = data.renewal_count || this._renewalCount + 1;
      this._lastRenewal = Date.now();

      this._notifyListeners();
    } catch (err) {
      console.error('[Telemetry] Renewal error:', err);
      // Retry with backoff on next interval
    }
  }

  /**
   * Get security headers for attaching to requests.
   * Includes the rotating token + fingerprint + nonce.
   */
  getHeaders() {
    const nonce = CryptoJS.lib.WordArray.random(16).toString();
    
    return {
      'X-Security-Token': this._token || '',
      'X-Fingerprint': this._fingerprint || '',
      'X-Nonce': nonce,
      'X-Timestamp': Date.now().toString(),
    };
  }

  /**
   * Build telemetry object for POST body (_t field).
   * This is backward-compatible with existing telemetry.
   */
  buildTelemetry() {
    let ck = '';
    try {
      ck = getSecurityCookie() || '';
    } catch {}

    return {
      fp: this._fingerprint || '',
      ts: Date.now(),
      nonce: CryptoJS.lib.WordArray.random(16).toString(),
      ck,
    };
  }

  /** Current IP score */
  get ipScore() { return this._ipScore; }
  
  /** Whether captcha is required based on IP score */
  get requireCaptcha() { return this._requireCaptcha; }
  
  /** Whether the service is initialized */
  get isInitialized() { return this._initialized; }
  
  /** Current token (for debugging) */
  get token() { return this._token; }
  
  /** Current fingerprint */
  get fingerprint() { return this._fingerprint; }

  /** Subscribe to state changes (ip_score, require_captcha changes) */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notifyListeners() {
    const state = {
      ipScore: this._ipScore,
      requireCaptcha: this._requireCaptcha,
      initialized: this._initialized,
      renewalCount: this._renewalCount,
    };
    this._listeners.forEach(fn => {
      try { fn(state); } catch {}
    });
  }

  /** Cleanup on unmount */
  destroy() {
    if (this._renewInterval) {
      clearInterval(this._renewInterval);
      this._renewInterval = null;
    }
    this._listeners.clear();
  }
}

// Singleton instance
const telemetryService = new TelemetryService();
export default telemetryService;
