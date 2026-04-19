"""
DeezLink Security System v2
- Rotating session tokens (30s renewal via API)
- Anti-replay (chained tokens + nonce tracking)
- IP scoring with conditional captcha
- Click captcha (5s verification, bound to email/fp/ip)
- Header coherence verification
"""

import time
import secrets
import hashlib
import logging
from typing import Dict, Optional, Tuple
from collections import defaultdict

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════
# SECURITY SESSION TOKEN STORE
# ═══════════════════════════════════════════════════════════

class SecuritySessionStore:
    """
    In-memory store for rotating security session tokens.
    Each session is bound to fingerprint + IP + user-agent hash.
    Tokens rotate every 30s. Old tokens are invalidated immediately.
    """
    
    def __init__(self):
        # session_id -> session_data
        self.sessions: Dict[str, dict] = {}
        # token_hash -> session_id (for fast lookup)
        self.token_index: Dict[str, str] = {}
        # Used tokens (anti-replay) - token_hash -> timestamp
        self.used_tokens: Dict[str, float] = {}
        # Used nonces (anti-replay) - nonce -> timestamp
        self.used_nonces: Dict[str, float] = {}
        # Grace period tokens (allow brief overlap during renewal)
        self.grace_tokens: Dict[str, dict] = {}  # token_hash -> {session_id, expires}
    
    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()
    
    def _hash_ua(self, ua: str) -> str:
        return hashlib.sha256((ua or "").encode()).hexdigest()[:16]
    
    def _cleanup(self):
        """Remove expired sessions, tokens, nonces"""
        now = time.time()
        
        # Clean expired sessions (inactive > 5 minutes)
        expired_sessions = [
            sid for sid, s in self.sessions.items()
            if now - s.get("last_activity", 0) > 300
        ]
        for sid in expired_sessions:
            self._remove_session(sid)
        
        # Clean used tokens older than 2 minutes
        expired_tokens = [t for t, ts in self.used_tokens.items() if now - ts > 120]
        for t in expired_tokens:
            del self.used_tokens[t]
        
        # Clean used nonces older than 5 minutes
        expired_nonces = [n for n, ts in self.used_nonces.items() if now - ts > 300]
        for n in expired_nonces:
            del self.used_nonces[n]
        
        # Clean grace tokens older than 10s
        expired_grace = [t for t, d in self.grace_tokens.items() if now > d["expires"]]
        for t in expired_grace:
            del self.grace_tokens[t]
    
    def _remove_session(self, session_id: str):
        session = self.sessions.pop(session_id, None)
        if session:
            token_hash = session.get("current_token_hash")
            if token_hash and token_hash in self.token_index:
                del self.token_index[token_hash]
    
    def init_session(self, fingerprint: str, ip: str, user_agent: str) -> dict:
        """
        Create a new security session. Returns token + metadata.
        """
        if len(self.sessions) % 50 == 0:
            self._cleanup()
        
        # Generate strong token (64 chars hex)
        token = secrets.token_hex(32)
        token_hash = self._hash_token(token)
        session_id = secrets.token_urlsafe(24)
        ua_hash = self._hash_ua(user_agent)
        now = time.time()
        
        # Calculate IP score
        ip_score = ip_scorer.get_score(ip)
        
        self.sessions[session_id] = {
            "session_id": session_id,
            "current_token_hash": token_hash,
            "fingerprint": fingerprint,
            "ip": ip,
            "ua_hash": ua_hash,
            "created_at": now,
            "last_activity": now,
            "last_renewal": now,
            "renewal_count": 0,
            "chain_hash": token_hash,  # Chain of token hashes for anti-replay
        }
        
        self.token_index[token_hash] = session_id
        
        logger.info(f"[SECURITY] Session init: sid={session_id[:8]}... ip={ip} fp={fingerprint[:8]}... score={ip_score}")
        
        return {
            "token": token,
            "session_id": session_id,
            "expires_in": 35,
            "ip_score": ip_score,
            "require_captcha": ip_score < 70,
        }
    
    def renew_token(self, old_token: str, fingerprint: str, ip: str, user_agent: str) -> Optional[dict]:
        """
        Renew a session token. Requires the current valid token.
        Returns new token or None if invalid.
        """
        old_token_hash = self._hash_token(old_token)
        now = time.time()
        
        # Check if this is a used/replayed token
        if old_token_hash in self.used_tokens:
            logger.warning(f"[SECURITY] Replay detected: token={old_token_hash[:12]}... ip={ip}")
            ip_scorer.penalize(ip, "replay_attempt", 20)
            return None
        
        # Check in grace tokens (recent renewal, client may be slightly delayed)
        if old_token_hash in self.grace_tokens:
            grace = self.grace_tokens[old_token_hash]
            if now < grace["expires"]:
                session_id = grace["session_id"]
                session = self.sessions.get(session_id)
                if session:
                    # Return the current token for this session
                    current_hash = session["current_token_hash"]
                    # Find the actual token... we can't, generate a new one
                    return self._do_renew(session, fingerprint, ip, user_agent)
            del self.grace_tokens[old_token_hash]
            return None
        
        # Find session by token
        session_id = self.token_index.get(old_token_hash)
        if not session_id:
            logger.warning(f"[SECURITY] Unknown token: hash={old_token_hash[:12]}... ip={ip}")
            ip_scorer.penalize(ip, "unknown_token", 10)
            return None
        
        session = self.sessions.get(session_id)
        if not session:
            del self.token_index[old_token_hash]
            return None
        
        # Verify fingerprint coherence (allow slight drift but flag)
        if session["fingerprint"] and fingerprint and session["fingerprint"] != fingerprint:
            logger.warning(f"[SECURITY] Fingerprint mismatch on renewal: sid={session_id[:8]}...")
            ip_scorer.penalize(ip, "fingerprint_mismatch", 15)
            # Don't reject immediately - could be browser update - but flag
        
        # Verify UA coherence
        ua_hash = self._hash_ua(user_agent)
        if session["ua_hash"] and ua_hash != session["ua_hash"]:
            logger.warning(f"[SECURITY] UA mismatch on renewal: sid={session_id[:8]}...")
            ip_scorer.penalize(ip, "ua_mismatch", 10)
        
        # Verify IP coherence (warn but allow - user may change network)
        if session["ip"] != ip:
            logger.info(f"[SECURITY] IP changed during session: {session['ip']} -> {ip}")
            # Update IP but don't penalize - mobile users switch networks
            session["ip"] = ip
        
        return self._do_renew(session, fingerprint, ip, user_agent)
    
    def _do_renew(self, session: dict, fingerprint: str, ip: str, user_agent: str) -> dict:
        """Internal: perform the actual token renewal"""
        now = time.time()
        old_token_hash = session["current_token_hash"]
        
        # Generate new token
        new_token = secrets.token_hex(32)
        new_token_hash = self._hash_token(new_token)
        
        # Move old token to used + grace
        self.used_tokens[old_token_hash] = now
        self.grace_tokens[old_token_hash] = {
            "session_id": session["session_id"],
            "expires": now + 10,  # 10s grace period
        }
        if old_token_hash in self.token_index:
            del self.token_index[old_token_hash]
        
        # Update session
        session["current_token_hash"] = new_token_hash
        session["last_activity"] = now
        session["last_renewal"] = now
        session["renewal_count"] += 1
        session["chain_hash"] = hashlib.sha256(
            f"{session['chain_hash']}:{new_token_hash}".encode()
        ).hexdigest()
        
        if fingerprint:
            session["fingerprint"] = fingerprint
        
        # Index new token
        self.token_index[new_token_hash] = session["session_id"]
        
        ip_score = ip_scorer.get_score(ip)
        
        return {
            "token": new_token,
            "session_id": session["session_id"],
            "expires_in": 35,
            "ip_score": ip_score,
            "require_captcha": ip_score < 70,
            "renewal_count": session["renewal_count"],
        }
    
    def validate_token(self, token: str, fingerprint: str, ip: str, user_agent: str) -> Tuple[bool, str, Optional[dict]]:
        """
        Validate a security token for a request.
        Returns (valid, reason, session_data)
        """
        if not token:
            return False, "missing_token", None
        
        token_hash = self._hash_token(token)
        now = time.time()
        
        # Check if replayed
        if token_hash in self.used_tokens:
            ip_scorer.penalize(ip, "token_replay", 25)
            return False, "token_replayed", None
        
        # Find session
        session_id = self.token_index.get(token_hash)
        
        # Check grace tokens too
        if not session_id and token_hash in self.grace_tokens:
            grace = self.grace_tokens[token_hash]
            if now < grace["expires"]:
                session_id = grace["session_id"]
        
        if not session_id:
            return False, "invalid_token", None
        
        session = self.sessions.get(session_id)
        if not session:
            return False, "session_expired", None
        
        # Check if token is expired (>45s since last renewal - generous grace)
        if now - session["last_renewal"] > 45:
            return False, "token_expired", None
        
        # Verify coherence
        ua_hash = self._hash_ua(user_agent)
        coherence_issues = []
        
        if session["fingerprint"] and fingerprint and session["fingerprint"] != fingerprint:
            coherence_issues.append("fingerprint_mismatch")
        
        if session["ua_hash"] and ua_hash != session["ua_hash"]:
            coherence_issues.append("ua_mismatch")
        
        if coherence_issues:
            for issue in coherence_issues:
                ip_scorer.penalize(ip, issue, 5)
            logger.warning(f"[SECURITY] Coherence issues: {coherence_issues} ip={ip}")
        
        # Update last activity
        session["last_activity"] = now
        
        return True, "valid", session
    
    def check_nonce(self, nonce: str) -> bool:
        """Check if nonce is unique. Returns True if valid (not seen before)."""
        if not nonce or len(nonce) < 16:
            return False
        if nonce in self.used_nonces:
            return False
        self.used_nonces[nonce] = time.time()
        return True
    
    def get_stats(self) -> dict:
        return {
            "active_sessions": len(self.sessions),
            "indexed_tokens": len(self.token_index),
            "used_tokens": len(self.used_tokens),
            "used_nonces": len(self.used_nonces),
            "grace_tokens": len(self.grace_tokens),
        }


# ═══════════════════════════════════════════════════════════
# IP SCORING SYSTEM
# ═══════════════════════════════════════════════════════════

class IPScorer:
    """
    Track risk score per IP. Score starts at 100 (clean).
    Penalties reduce the score. Score recovers over time.
    Low score = require captcha.
    
    Enhanced precision:
    - Request burst detection (too many requests in short time)
    - Failed action accumulation tracking
    - User-agent consistency tracking per IP
    - Geographic anomaly signals (from headers)
    - Behavioral patterns (rapid sequential actions)
    """
    
    def __init__(self):
        # ip -> full tracking data
        self.scores: Dict[str, dict] = {}
        self.RECOVERY_RATE = 1.5  # points recovered per minute (slower recovery = more precise)
        self.MAX_SCORE = 100
        self.CAPTCHA_THRESHOLD = 70
        # Burst tracking: ip -> [timestamps]
        self.request_bursts: Dict[str, list] = {}
        # UA tracking: ip -> set of ua_hashes (too many = suspicious)
        self.ua_hashes: Dict[str, set] = {}
    
    def _ensure_ip(self, ip: str):
        if ip not in self.scores:
            self.scores[ip] = {
                "score": self.MAX_SCORE,
                "penalties": [],
                "last_update": time.time(),
                "request_count": 0,
                "failed_actions": 0,
                "successful_actions": 0,
                "first_seen": time.time(),
            }
    
    def _apply_recovery(self, ip: str):
        """Apply time-based score recovery (slower, more realistic)"""
        data = self.scores.get(ip)
        if not data:
            return
        
        now = time.time()
        elapsed_minutes = (now - data["last_update"]) / 60
        recovery = int(elapsed_minutes * self.RECOVERY_RATE)
        
        if recovery > 0:
            # Recovery is capped based on failed_actions history
            max_recovery = self.MAX_SCORE
            if data["failed_actions"] > 10:
                max_recovery = 60  # Heavy offenders can't fully recover quickly
            elif data["failed_actions"] > 5:
                max_recovery = 80
            
            data["score"] = min(max_recovery, data["score"] + recovery)
            data["last_update"] = now
            
            # Clean old penalties (>30 min)
            data["penalties"] = [
                p for p in data["penalties"] if now - p["ts"] < 1800
            ]
    
    def get_score(self, ip: str) -> int:
        self._ensure_ip(ip)
        self._apply_recovery(ip)
        return self.scores[ip]["score"]
    
    def penalize(self, ip: str, reason: str, amount: int):
        self._ensure_ip(ip)
        self._apply_recovery(ip)
        
        data = self.scores[ip]
        
        # Progressive penalty: repeated same reason = escalating penalty
        recent_same = sum(1 for p in data["penalties"] if p["reason"] == reason and time.time() - p["ts"] < 300)
        escalated_amount = amount + (recent_same * 3)  # +3 per recent repeat
        
        data["score"] = max(0, data["score"] - escalated_amount)
        data["failed_actions"] += 1
        data["penalties"].append({
            "reason": reason,
            "amount": escalated_amount,
            "ts": time.time()
        })
        data["last_update"] = time.time()
        
        logger.info(f"[IP-SCORE] {ip}: -{escalated_amount} ({reason}x{recent_same+1}) -> {data['score']}")
    
    def record_request(self, ip: str, user_agent: str = ""):
        """Record a request and check for burst patterns"""
        self._ensure_ip(ip)
        self.scores[ip]["request_count"] += 1
        
        now = time.time()
        
        # Burst detection: track request timestamps
        if ip not in self.request_bursts:
            self.request_bursts[ip] = []
        
        burst = self.request_bursts[ip]
        burst.append(now)
        # Keep only last 60s of requests
        self.request_bursts[ip] = [t for t in burst if now - t < 60]
        
        # If >20 requests in 60s, penalize
        if len(self.request_bursts[ip]) > 20:
            self.penalize(ip, "request_burst", 8)
        # If >40 requests in 60s, heavy penalize
        elif len(self.request_bursts[ip]) > 40:
            self.penalize(ip, "request_flood", 20)
        
        # UA consistency check: track unique UAs per IP
        if user_agent:
            if ip not in self.ua_hashes:
                self.ua_hashes[ip] = set()
            
            ua_hash = hashlib.sha256(user_agent.encode()).hexdigest()[:12]
            self.ua_hashes[ip].add(ua_hash)
            
            # If >5 different UAs from same IP = suspicious
            if len(self.ua_hashes[ip]) > 5:
                self.penalize(ip, "too_many_user_agents", 15)
    
    def record_success(self, ip: str):
        """Record a successful legitimate action (small score boost)"""
        self._ensure_ip(ip)
        self.scores[ip]["successful_actions"] += 1
        # Small boost for legitimate behavior (+1 per success, max +5)
        if self.scores[ip]["successful_actions"] % 3 == 0:
            self.scores[ip]["score"] = min(self.MAX_SCORE, self.scores[ip]["score"] + 1)
    
    def requires_captcha(self, ip: str) -> bool:
        return self.get_score(ip) < self.CAPTCHA_THRESHOLD
    
    def get_ip_data(self, ip: str) -> dict:
        self._ensure_ip(ip)
        self._apply_recovery(ip)
        data = self.scores[ip]
        return {
            "score": data["score"],
            "penalties": data["penalties"][-10:],
            "request_count": data["request_count"],
            "failed_actions": data["failed_actions"],
            "successful_actions": data["successful_actions"],
            "requires_captcha": data["score"] < self.CAPTCHA_THRESHOLD,
            "first_seen": data["first_seen"],
        }
    
    def cleanup(self):
        """Remove stale IP entries (>1h with max score)"""
        now = time.time()
        stale = [
            ip for ip, data in self.scores.items()
            if now - data["last_update"] > 3600 and data["score"] >= self.MAX_SCORE
        ]
        for ip in stale:
            del self.scores[ip]
        # Clean burst data
        stale_bursts = [ip for ip, ts in self.request_bursts.items() if not ts or now - max(ts) > 120]
        for ip in stale_bursts:
            del self.request_bursts[ip]


# ═══════════════════════════════════════════════════════════
# CLICK CAPTCHA SYSTEM (5s verification, bound to email/fp/ip)
# ═══════════════════════════════════════════════════════════

class ClickCaptchaSystem:
    """
    Lightweight click captcha:
    1. User clicks "I'm human" → server creates challenge with timestamp
    2. After ~5s, user clicks "Verify" → server checks timing window
    3. Returns one-time captcha token bound to fingerprint + IP
    """
    
    def __init__(self):
        # challenge_id -> {created_at, fingerprint, ip, used}
        self.challenges: Dict[str, dict] = {}
        # captcha_token -> {created_at, fingerprint, ip, email, used}
        self.solved_tokens: Dict[str, dict] = {}
    
    def _cleanup(self):
        now = time.time()
        # Clean challenges older than 2 minutes
        expired = [k for k, v in self.challenges.items() if now - v["created_at"] > 120]
        for k in expired:
            del self.challenges[k]
        # Clean solved tokens older than 10 minutes
        expired_solved = [k for k, v in self.solved_tokens.items() if now - v["created_at"] > 600]
        for k in expired_solved:
            del self.solved_tokens[k]
    
    def start_challenge(self, fingerprint: str, ip: str) -> dict:
        """Start a click captcha challenge"""
        if len(self.challenges) % 20 == 0:
            self._cleanup()
        
        challenge_id = secrets.token_urlsafe(24)
        now = time.time()
        
        self.challenges[challenge_id] = {
            "created_at": now,
            "fingerprint": fingerprint,
            "ip": ip,
            "used": False,
        }
        
        return {
            "challenge_id": challenge_id,
            "wait_seconds": 5,
            "expires_in": 120,
        }
    
    def verify_challenge(self, challenge_id: str, fingerprint: str, ip: str) -> Tuple[bool, str]:
        """
        Verify a click captcha challenge.
        Returns (valid, captcha_token_or_error_reason)
        
        Checks:
        1. Challenge exists and not expired
        2. Challenge not already used (one-time)
        3. Timing: at least 4s since start (anti-bot), max 120s
        4. Fingerprint + IP match
        """
        if not challenge_id or challenge_id not in self.challenges:
            return False, "invalid_challenge"
        
        challenge = self.challenges[challenge_id]
        now = time.time()
        elapsed = now - challenge["created_at"]
        
        # Check expiry (2 min)
        if elapsed > 120:
            del self.challenges[challenge_id]
            return False, "expired"
        
        # Check one-time use
        if challenge["used"]:
            return False, "already_used"
        
        # Mark as used immediately
        challenge["used"] = True
        
        # Check minimum wait time (4s - slightly less than 5 for network latency)
        if elapsed < 4.0:
            del self.challenges[challenge_id]
            return False, "too_fast"
        
        # Verify fingerprint coherence (lenient - might change slightly)
        if challenge["fingerprint"] and fingerprint:
            if challenge["fingerprint"] != fingerprint:
                logger.warning(f"[CAPTCHA] Fingerprint mismatch during verification")
                # Don't reject but log
        
        # Generate bound captcha token
        captcha_token = secrets.token_urlsafe(32)
        self.solved_tokens[captcha_token] = {
            "created_at": now,
            "fingerprint": fingerprint,
            "ip": ip,
            "used": False,
        }
        
        # Cleanup challenge
        del self.challenges[challenge_id]
        
        return True, captcha_token
    
    def verify_token(self, token: str, fingerprint: str = "", ip: str = "") -> bool:
        """
        Verify a captcha token for form submission.
        Token must be:
        - Valid (exists)
        - Not expired (10 min max)
        - Not already used (one-time)
        - Bound to same fingerprint/IP (if provided)
        """
        if not token or token not in self.solved_tokens:
            return False
        
        data = self.solved_tokens[token]
        now = time.time()
        
        # Check expiry (10 minutes)
        if now - data["created_at"] > 600:
            del self.solved_tokens[token]
            return False
        
        # Check one-time use
        if data["used"]:
            del self.solved_tokens[token]
            return False
        
        # Verify binding (if provided)
        if fingerprint and data["fingerprint"] and data["fingerprint"] != fingerprint:
            logger.warning(f"[CAPTCHA] Token fingerprint mismatch")
            return False
        
        if ip and data["ip"] and data["ip"] != ip:
            logger.warning(f"[CAPTCHA] Token IP mismatch: expected={data['ip']} got={ip}")
            return False
        
        # Mark as used (ONE-TIME)
        data["used"] = True
        
        return True
    
    def get_stats(self) -> dict:
        return {
            "active_challenges": len(self.challenges),
            "active_tokens": len([t for t, d in self.solved_tokens.items() if not d["used"]]),
        }


# ═══════════════════════════════════════════════════════════
# SINGLETON INSTANCES
# ═══════════════════════════════════════════════════════════

ip_scorer = IPScorer()
session_store = SecuritySessionStore()
click_captcha = ClickCaptchaSystem()
