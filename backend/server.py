from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from collections import defaultdict
import asyncio
import os
import logging
import uuid
import bcrypt
import jwt
import httpx
import secrets
import smtplib
import hashlib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Import new security system v2
from security_system import session_store, ip_scorer, click_captcha
from stock_generator import stock_generator

# ═══════════════════════════════════════════════════════════
# SYSTÈME ANTI-FRAUDE ULTRA-SÉCURISÉ (merged from security_middleware.py)
# ═══════════════════════════════════════════════════════════

# Fingerprints valides avec leur timestamp
VALID_FINGERPRINTS: Dict[str, dict] = {}

# Tokens utilisés (pour anti-replay)
USED_TOKENS: Dict[str, float] = {}

# Séquences par fingerprint (pour détecter les replays)
FINGERPRINT_SEQUENCES: Dict[str, int] = defaultdict(int)

# Tentatives par IP (pour le système anti-fraude)
IP_ATTEMPTS: Dict[str, list] = defaultdict(list)

def cleanup_expired_data():
    """Nettoie les données expirées (appelé périodiquement)"""
    now = time.time()
    
    # Nettoyer tokens expirés (>5 minutes)
    expired_tokens = [tk for tk, ts in USED_TOKENS.items() if now - ts > 300]
    for tk in expired_tokens:
        del USED_TOKENS[tk]
    
    # Nettoyer fingerprints inactifs (>1h)
    expired_fps = [fp for fp, data in VALID_FINGERPRINTS.items() 
                   if now - data.get('last_seen', 0) > 3600]
    for fp in expired_fps:
        del VALID_FINGERPRINTS[fp]
        if fp in FINGERPRINT_SEQUENCES:
            del FINGERPRINT_SEQUENCES[fp]
    
    # Nettoyer tentatives IP (>1h)
    for ip in list(IP_ATTEMPTS.keys()):
        IP_ATTEMPTS[ip] = [ts for ts in IP_ATTEMPTS[ip] if now - ts < 3600]
        if not IP_ATTEMPTS[ip]:
            del IP_ATTEMPTS[ip]

def validate_fingerprint_security(fp: str, telemetry: dict) -> bool:
    """Valide et enregistre un fingerprint"""
    if not fp or len(fp) != 64:  # SHA256 hash
        return False
    
    now = time.time()
    
    if fp not in VALID_FINGERPRINTS:
        VALID_FINGERPRINTS[fp] = {
            'first_seen': now,
            'last_seen': now,
            'request_count': 0,
            'cookie': telemetry.get('ck', '')
        }
    else:
        VALID_FINGERPRINTS[fp]['last_seen'] = now
    
    VALID_FINGERPRINTS[fp]['request_count'] += 1
    return True

def check_ip_rate_limit_security(ip: str, max_requests: int = 30, window: int = 60) -> bool:
    """Vérifie le rate limiting par IP"""
    now = time.time()
    IP_ATTEMPTS[ip].append(now)
    recent = [ts for ts in IP_ATTEMPTS[ip] if now - ts < window]
    IP_ATTEMPTS[ip] = recent
    return len(recent) <= max_requests

# ═══════════════════════════════════════════════════════════
# TELEMETRY VALIDATION — lightweight anti-replay + fingerprinting
# Applied to all sensitive POST routes
# ═══════════════════════════════════════════════════════════

# Store used nonces to prevent replay (auto-cleanup)
USED_NONCES: Dict[str, float] = {}

def _cleanup_nonces():
    """Remove nonces older than 5 minutes"""
    now = time.time()
    expired = [n for n, ts in USED_NONCES.items() if now - ts > 300]
    for n in expired:
        del USED_NONCES[n]

# ═══════════════════════════════════════════════════════════
# CUSTOM CAPTCHA SYSTEM — Slider + Proof-of-Work + Timing
# Zero external dependencies, fully self-contained
# ═══════════════════════════════════════════════════════════

# In-memory challenge store (auto-cleanup on access)
CAPTCHA_CHALLENGES: Dict[str, dict] = {}
CAPTCHA_SOLVED: Dict[str, float] = {}  # solved challenge_id -> timestamp (for token reuse in session)

def _cleanup_captcha():
    """Remove expired challenges and solved tokens"""
    now = time.time()
    expired = [k for k, v in CAPTCHA_CHALLENGES.items() if now - v["created_at"] > 180]
    for k in expired:
        del CAPTCHA_CHALLENGES[k]
    expired_solved = [k for k, v in CAPTCHA_SOLVED.items() if now - v > 600]
    for k in expired_solved:
        del CAPTCHA_SOLVED[k]

def generate_captcha_challenge(fingerprint: str = "") -> dict:
    """Generate a new captcha challenge"""
    if len(CAPTCHA_CHALLENGES) % 20 == 0:
        _cleanup_captcha()
    
    challenge_id = secrets.token_urlsafe(24)
    target_position = random.randint(15, 85)  # 15-85% range (avoid edges)
    pow_prefix = secrets.token_hex(8)
    pow_difficulty = 4  # 4 leading hex zeros = ~65536 iterations average, ~1-2s on browser
    
    # Store server-side (NEVER send target to client)
    CAPTCHA_CHALLENGES[challenge_id] = {
        "target": target_position,
        "pow_prefix": pow_prefix,
        "pow_difficulty": pow_difficulty,
        "fingerprint": fingerprint,
        "created_at": time.time(),
        "used": False
    }
    
    # Return to client (includes target for visual rendering — security comes from PoW + timing + one-time-use)
    return {
        "challenge_id": challenge_id,
        "pow_prefix": pow_prefix,
        "pow_difficulty": pow_difficulty,
        "target": target_position,
        "visual_seed": secrets.token_hex(4),
        "expires_in": 120
    }

def verify_captcha_solution(challenge_id: str, slider_value: int, pow_nonce: str, solve_time_ms: int) -> tuple:
    """
    Verify a captcha solution. Returns (valid: bool, reason: str)
    
    Checks:
    1. Challenge exists and not expired (< 2 min)
    2. Challenge not already used (one-time)
    3. PoW valid: SHA256(prefix + nonce) starts with N zero hex chars
    4. Slider position within ±6 of target
    5. Timing: 800ms < solve_time < 120000ms
    """
    if not challenge_id or challenge_id not in CAPTCHA_CHALLENGES:
        return False, "invalid_challenge"
    
    challenge = CAPTCHA_CHALLENGES[challenge_id]
    
    # Check expiry
    if time.time() - challenge["created_at"] > 180:
        del CAPTCHA_CHALLENGES[challenge_id]
        return False, "expired"
    
    # Check one-time use
    if challenge["used"]:
        return False, "already_used"
    
    # Mark as used immediately (prevent race conditions)
    challenge["used"] = True
    
    # Verify PoW: SHA256(prefix + nonce) must start with N zero hex chars
    pow_hash = hashlib.sha256(f"{challenge['pow_prefix']}{pow_nonce}".encode()).hexdigest()
    required_prefix = "0" * challenge["pow_difficulty"]
    if not pow_hash.startswith(required_prefix):
        del CAPTCHA_CHALLENGES[challenge_id]
        return False, "invalid_pow"
    
    # Verify slider position (±6 tolerance)
    target = challenge["target"]
    if abs(slider_value - target) > 6:
        del CAPTCHA_CHALLENGES[challenge_id]
        return False, "wrong_position"
    
    # Verify timing (800ms to 120s)
    if solve_time_ms < 800:
        del CAPTCHA_CHALLENGES[challenge_id]
        return False, "too_fast"
    if solve_time_ms > 120000:
        del CAPTCHA_CHALLENGES[challenge_id]
        return False, "too_slow"
    
    # Generate a signed captcha token (valid for 10 min, reusable within session)
    captcha_token = secrets.token_urlsafe(32)
    CAPTCHA_SOLVED[captcha_token] = time.time()
    
    # Cleanup challenge
    del CAPTCHA_CHALLENGES[challenge_id]
    
    return True, captcha_token

def verify_captcha_token(token: str) -> bool:
    """Verify a previously solved captcha token (for form submissions)"""
    if not token or token not in CAPTCHA_SOLVED:
        return False
    # Check if still valid (10 min window)
    if time.time() - CAPTCHA_SOLVED[token] > 600:
        del CAPTCHA_SOLVED[token]
        return False
    return True



async def extract_telemetry_and_data(request: Request) -> dict:
    """
    Extract and validate telemetry from a request body.
    Also validates security session token (v2) from headers.
    Returns the clean data payload (without _t) + telemetry metadata.
    Non-blocking: logs suspicious requests but doesn't reject normal users.
    """
    # Periodic cleanup
    if len(USED_NONCES) % 50 == 0:
        _cleanup_nonces()
        cleanup_expired_data()
    
    client_ip = get_client_ip(request)
    
    # IP rate limit
    if not check_ip_rate_limit_security(client_ip, max_requests=30, window=60):
        raise HTTPException(status_code=429, detail="Too many requests")
    
    # Parse body — use stored body from middleware if available
    body = None
    try:
        stored = getattr(request.state, '_body', None)
        if stored and len(stored) > 0:
            body = json_module.loads(stored)
        else:
            raw = await request.body()
            if raw:
                body = json_module.loads(raw)
    except Exception:
        pass
    
    if not body or not isinstance(body, dict):
        return {"data": {}, "telemetry": {}, "telemetry_valid": False, "telemetry_score": 0, "client_ip": client_ip, "fingerprint": "", "security_session_valid": False}
    
    telemetry = body.pop("_t", None)
    data = body  # Everything except _t is the actual data
    
    telemetry_valid = False
    telemetry_score = 0  # 0-100 trust score
    rejection_reason = None
    fingerprint = ""
    
    # ── V2: Validate security session token from headers ──
    security_token = request.headers.get("x-security-token", "")
    header_fingerprint = request.headers.get("x-fingerprint", "")
    header_nonce = request.headers.get("x-nonce", "")
    user_agent = request.headers.get("user-agent", "")
    security_session_valid = False
    
    if security_token:
        valid, reason, session_data = session_store.validate_token(
            security_token, header_fingerprint, client_ip, user_agent
        )
        security_session_valid = valid
        if valid:
            telemetry_score += 40  # Strong signal
            fingerprint = header_fingerprint or (session_data or {}).get("fingerprint", "")
        else:
            ip_scorer.penalize(client_ip, f"session_token_{reason}", 5)
    
    # Validate header nonce (anti-replay)
    if header_nonce and len(header_nonce) >= 16:
        if session_store.check_nonce(header_nonce):
            telemetry_score += 10
        else:
            ip_scorer.penalize(client_ip, "header_nonce_replay", 15)
    
    if telemetry and isinstance(telemetry, dict):
        fp = telemetry.get("fp", "")
        ts = telemetry.get("ts", 0)
        nonce = telemetry.get("nonce", "")
        ck = telemetry.get("ck", "")
        
        if fp and not fingerprint:
            fingerprint = fp
        
        now_ms = time.time() * 1000
        
        # 1. Fingerprint validation (required, +20 points)
        if fp and len(fp) == 64:
            validate_fingerprint_security(fp, telemetry)
            telemetry_score += 20
        else:
            rejection_reason = "invalid_fingerprint"
        
        # 2. Timestamp freshness — allow 120s drift (+15 points)
        if ts and abs(now_ms - ts) < 120000:
            telemetry_score += 15
        else:
            rejection_reason = rejection_reason or "stale_timestamp"
        
        # 3. Nonce uniqueness — anti-replay (+10 points, reduced since header nonce is primary)
        if nonce and len(nonce) >= 16:
            if nonce not in USED_NONCES:
                USED_NONCES[nonce] = time.time()
                telemetry_score += 10
            else:
                rejection_reason = "replayed_nonce"
        else:
            rejection_reason = rejection_reason or "missing_nonce"
        
        # 4. Cookie presence (+5 points)
        if ck and len(ck) == 64:
            telemetry_score += 5
        
        telemetry_valid = telemetry_score >= 55 or security_session_valid
        
        # Log suspicious requests
        if not telemetry_valid:
            logger.warning(
                f"[SECURITY] Low telemetry score {telemetry_score}/100 from {client_ip} "
                f"| reason={rejection_reason} | fp={fp[:16] if fp else 'none'}..."
            )
            ip_scorer.penalize(client_ip, "low_telemetry_score", 5)
            await db.security_logs.insert_one({
                "event": "telemetry_failure",
                "ip": client_ip,
                "score": telemetry_score,
                "reason": rejection_reason,
                "fingerprint": fp[:16] if fp else "",
                "security_session_valid": security_session_valid,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    else:
        # No telemetry — check if security session is valid (v2 clients may not send _t)
        telemetry_valid = security_session_valid
        if not security_session_valid:
            logger.warning(f"[SECURITY] No telemetry and no valid session from {client_ip}")
            ip_scorer.penalize(client_ip, "no_telemetry", 10)
            await db.security_logs.insert_one({
                "event": "no_telemetry",
                "ip": client_ip,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
    
    return {
        "data": data,
        "telemetry": telemetry or {},
        "telemetry_valid": telemetry_valid,
        "telemetry_score": telemetry_score,
        "client_ip": client_ip,
        "fingerprint": fingerprint,
        "security_session_valid": security_session_valid,
    }

def require_telemetry(strict: bool = True):
    """
    Decorator for routes that require telemetry validation.
    strict=True: reject requests with invalid telemetry (403)
    strict=False: log but allow (for gradual rollout)
    """
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            ctx = await extract_telemetry_and_data(request)
            if strict and not ctx["telemetry_valid"]:
                raise HTTPException(
                    status_code=403,
                    detail="Security validation failed. Please refresh and try again."
                )
            # Inject context into request state
            request.state.security = ctx
            request.state.clean_data = ctx["data"]
            return await func(request, *args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator

# ═══════════════════════════════════════════════════════════
# GIFT CARD SYSTEM (merged from gift_cards.py)
# ═══════════════════════════════════════════════════════════

def generate_gift_card_code() -> str:
    """Generate a secure random gift card code"""
    # Format: DEEZ-XXXX-XXXX-XXXX
    parts = []
    for _ in range(3):
        part = secrets.token_hex(2).upper()
        parts.append(part)
    return f"DEEZ-{'-'.join(parts)}"

def hash_gift_card_code(code: str) -> str:
    """Hash gift card code for storage (prevent rainbow table attacks)"""
    return hashlib.sha256(code.encode()).hexdigest()

async def create_gift_card(
    amount: float,
    purchaser_email: str,
    recipient_email: Optional[str] = None,
    recipient_name: Optional[str] = None,
    message: Optional[str] = None,
    validity_days: int = 365
) -> dict:
    """Create a new gift card"""
    code = generate_gift_card_code()
    code_hash = hash_gift_card_code(code)
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=validity_days)
    
    gift_card = {
        "code_hash": code_hash,
        "amount": amount,
        "balance": amount,
        "purchaser_email": purchaser_email,
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
        "message": message,
        "created_at": now,
        "expires_at": expires_at,
        "used": False,
        "used_at": None,
        "used_by": None,
        "validation_attempts": 0,
    }
    
    await db.gift_cards.insert_one(gift_card)
    
    return {
        "code": code,
        "amount": amount,
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
        "expires_at": expires_at,
    }

async def validate_gift_card(code: str, user_email: str) -> dict:
    """Validate and apply gift card (with rate limiting protection)"""
    code_hash = hash_gift_card_code(code)
    
    gift_card = await db.gift_cards.find_one({"code_hash": code_hash}, {"_id": 0})
    
    if not gift_card:
        return {"valid": False, "error": "Code invalide"}
    
    # Increment validation attempts
    await db.gift_cards.update_one(
        {"code_hash": code_hash},
        {"$inc": {"validation_attempts": 1}}
    )
    
    # Check if card is already fully used
    if gift_card["used"] or gift_card["balance"] <= 0:
        return {"valid": False, "error": "Cette carte cadeau a déjà été utilisée"}
    
    # Check expiration
    if gift_card["expires_at"] < datetime.now(timezone.utc):
        return {"valid": False, "error": "Cette carte cadeau a expiré"}
    
    return {
        "valid": True,
        "balance": gift_card["balance"],
        "code_hash": code_hash,
    }

async def apply_gift_card_to_order(code_hash: str, amount_to_use: float, user_email: str, order_id: str) -> dict:
    """Apply gift card balance to an order"""
    gift_card = await db.gift_cards.find_one({"code_hash": code_hash}, {"_id": 0})
    
    if not gift_card or gift_card["balance"] < amount_to_use:
        return {"success": False, "error": "Solde insuffisant"}
    
    new_balance = gift_card["balance"] - amount_to_use
    
    update_data = {
        "balance": new_balance,
    }
    
    # If fully used, mark as used
    if new_balance == 0:
        update_data["used"] = True
        update_data["used_at"] = datetime.now(timezone.utc)
        update_data["used_by"] = user_email
    
    await db.gift_cards.update_one(
        {"code_hash": code_hash},
        {"$set": update_data}
    )
    
    # Log transaction
    await db.gift_card_transactions.insert_one({
        "code_hash": code_hash,
        "order_id": order_id,
        "user_email": user_email,
        "amount_used": amount_to_use,
        "timestamp": datetime.now(timezone.utc),
    })
    
    return {
        "success": True,
        "amount_applied": amount_to_use,
        "remaining_balance": new_balance,
    }

# ═══════════════════════════════════════════════════════════

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'deezlink')]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback_secret_change_me')
JWT_ALGORITHM = "HS256"

# OxaPay Config
OXAPAY_API_KEY = os.environ.get('OXAPAY_MERCHANT_API_KEY', '')
OXAPAY_SANDBOX = os.environ.get('OXAPAY_SANDBOX', 'true').lower() == 'true'
OXAPAY_BASE_URL = "https://api.oxapay.com"

# SMTP Config
SMTP_SERVER = os.environ.get('SMTP_SERVER', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', '')
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'DeezLink')

# ==================== RATE LIMITING & ANTI-ABUSE SYSTEM ====================
class RateLimiter:
    """In-memory rate limiter with sliding window"""
    def __init__(self):
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.blocked_ips: Dict[str, float] = {}  # IP -> block_until timestamp
        self.blocked_emails: Dict[str, float] = {}  # Email -> block_until timestamp
        self.failed_logins: Dict[str, int] = defaultdict(int)  # IP -> failed count
    
    def _clean_old_requests(self, key: str, window_seconds: int):
        """Remove requests outside the time window"""
        now = time.time()
        self.requests[key] = [t for t in self.requests[key] if now - t < window_seconds]
    
    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if key has exceeded rate limit"""
        self._clean_old_requests(key, window_seconds)
        return len(self.requests[key]) >= max_requests
    
    def record_request(self, key: str):
        """Record a new request"""
        self.requests[key].append(time.time())
    
    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is temporarily blocked"""
        if ip in self.blocked_ips:
            if time.time() < self.blocked_ips[ip]:
                return True
            del self.blocked_ips[ip]
        return False
    
    def block_ip(self, ip: str, duration_seconds: int = 3600):
        """Block an IP for a duration"""
        self.blocked_ips[ip] = time.time() + duration_seconds
        logger.warning(f"IP {ip} blocked for {duration_seconds}s")
    
    def is_email_blocked(self, email: str) -> bool:
        """Check if email is temporarily blocked"""
        if email in self.blocked_emails:
            if time.time() < self.blocked_emails[email]:
                return True
            del self.blocked_emails[email]
        return False
    
    def block_email(self, email: str, duration_seconds: int = 300):
        """Block an email for a duration"""
        self.blocked_emails[email] = time.time() + duration_seconds
    
    def record_failed_login(self, ip: str) -> int:
        """Record failed login attempt, return total count"""
        self.failed_logins[ip] += 1
        count = self.failed_logins[ip]
        # Block IP after 5 failed attempts
        if count >= 5:
            self.block_ip(ip, 900)  # 15 minutes
            self.failed_logins[ip] = 0
        return count
    
    def clear_failed_logins(self, ip: str):
        """Clear failed login count on successful login"""
        self.failed_logins[ip] = 0
    
    def get_stats(self) -> dict:
        """Get rate limiter stats for admin"""
        return {
            "blocked_ips": len(self.blocked_ips),
            "blocked_emails": len(self.blocked_emails),
            "active_rate_limits": len(self.requests),
            "blocked_ip_list": list(self.blocked_ips.keys())[:10],
        }

rate_limiter = RateLimiter()

RATE_LIMITS = {
    "magic_link_ip": {"max": 20, "window": 300},      # 20 per 5 min per IP (generous — shared IPs, NAT, testing)
    "magic_link_email": {"max": 10, "window": 300},    # 10 per 5 min per email
    "login_ip": {"max": 15, "window": 300},            # 15 per 5 min per IP
    "gift_card_validate": {"max": 10, "window": 600},  # 10 per 10 min (brute force protection)
    "gift_card_purchase": {"max": 5, "window": 3600},  # 5 per hour
    "order_email": {"max": 10, "window": 3600},        # 10 per hour per email
    "geo_ip": {"max": 60, "window": 60},               # 60 per min per IP
}

# Country names mapping
COUNTRY_NAMES = {
    "FR": "France", "US": "United States", "GB": "United Kingdom", "DE": "Germany",
    "ES": "Spain", "IT": "Italy", "BE": "Belgium", "CH": "Switzerland", "CA": "Canada",
    "MA": "Morocco", "DZ": "Algeria", "TN": "Tunisia", "AE": "UAE", "SA": "Saudi Arabia",
    "EG": "Egypt", "NL": "Netherlands", "PT": "Portugal", "PL": "Poland", "BR": "Brazil",
    "MX": "Mexico", "AR": "Argentina", "CO": "Colombia", "JP": "Japan", "KR": "South Korea",
    "CN": "China", "IN": "India", "RU": "Russia", "AU": "Australia", "NZ": "New Zealand",
}

# Pricing Packs - 2 packs fixes + custom
PACKS = [
    {"id": "solo", "name_key": "pack_solo", "quantity": 1, "price": 5.00, "unit_price": 5.00, "discount": 0, "icon": "user"},
    {"id": "duo", "name_key": "pack_duo", "quantity": 2, "price": 9.00, "unit_price": 4.50, "discount": 10, "icon": "users"},
    {"id": "family", "name_key": "pack_family", "quantity": 5, "price": 20.00, "unit_price": 4.00, "discount": 20, "icon": "users", "highlighted": True},
]

ADMIN_IPS = ["5.49.128.70", "82.64.128.239"]  # Multiple admin IPs supported

# Auto-check stock state
AUTO_CHECK_ENABLED = False

# Loyalty tiers - Points based on spending
LOYALTY_TIERS = {
    "bronze": {"min_points": 0, "discount": 0, "name": "Bronze"},
    "silver": {"min_points": 50, "discount": 5, "name": "Silver"},
    "gold": {"min_points": 150, "discount": 10, "name": "Gold"},
    "platinum": {"min_points": 500, "discount": 15, "name": "Platinum"},
    "diamond": {"min_points": 1000, "discount": 20, "name": "Diamond"},
}

# Currency rates (approximate, for display)
CURRENCY_MAP = {
    "FR": {"currency": "EUR", "symbol": "€", "rate": 1.0},
    "US": {"currency": "USD", "symbol": "$", "rate": 1.08},
    "GB": {"currency": "GBP", "symbol": "£", "rate": 0.86},
    "AE": {"currency": "AED", "symbol": "AED", "rate": 3.97},
    "SA": {"currency": "SAR", "symbol": "SAR", "rate": 4.05},
    "MA": {"currency": "MAD", "symbol": "MAD", "rate": 10.80},
    "DZ": {"currency": "DZD", "symbol": "DZD", "rate": 146.0},
    "TN": {"currency": "TND", "symbol": "TND", "rate": 3.37},
}

# Language map by country
LANG_MAP = {
    "FR": "fr", "BE": "fr", "CH": "fr", "CA": "fr", "MA": "fr", "DZ": "fr", "TN": "fr",
    "AE": "ar", "SA": "ar", "EG": "ar", "IQ": "ar", "JO": "ar", "KW": "ar", "LB": "ar",
}

app = FastAPI(title="DeezLink API")
api_router = APIRouter(prefix="/api")

# ==================== ROBUST BODY PARSER (Apache/o2switch proxy compatibility) ====================
import json as json_module
import random
import math

async def parse_body(request: Request) -> dict:
    """
    Parse POST body robustly - handles Apache reverse proxy stripping body.
    Tries: raw body JSON → stored body → form data → query params
    """
    data = {}
    
    # Method 1: Raw body as JSON
    try:
        raw = await request.body()
        if raw and len(raw) > 0:
            data = json_module.loads(raw)
            if isinstance(data, dict) and data:
                return data
    except Exception:
        pass
    
    # Method 2: Stored body from middleware
    try:
        stored = getattr(request.state, '_body', None)
        if stored and len(stored) > 0:
            data = json_module.loads(stored)
            if isinstance(data, dict) and data:
                return data
    except Exception:
        pass
    
    # Method 3: Form data
    try:
        form = await request.form()
        if form:
            data = dict(form)
            if data:
                return data
    except Exception:
        pass
    
    # Method 4: Query params
    if request.query_params:
        data = dict(request.query_params)
    
    return data

# ==================== MIDDLEWARE: Pre-read body for proxy compatibility ====================
@app.middleware("http")
async def fix_proxy_body(request: Request, call_next):
    """Pre-read body so it's available for manual parsing after Apache proxy."""
    if request.method in ("POST", "PUT", "PATCH"):
        body = await request.body()
        request.state._body = body
        if "/auth/" in request.url.path:
            logger.info(f"[BODY-DEBUG] {request.method} {request.url.path} | CT: {request.headers.get('content-type', 'NONE')} | Len: {len(body)} | Body: {body[:200]}")
    response = await call_next(request)
    return response

# ==================== SAFETY NET: Redirect /undefined/api/* → /api/* ====================
# Root cause fixed in frontend (|| ""), but keep this as backup for cached old builds
from starlette.responses import RedirectResponse as StarletteRedirect

async def _proxy_to_api(request: Request, path: str):
    """Internal: proxy any malformed /undefined/api/* or /*/undefined/api/* to /api/*"""
    query = str(request.url.query)
    target = f"/api/{path}"
    if query:
        target += f"?{query}"
    
    logger.warning(f"⚠️ Proxying malformed URL: {request.url.path} → {target}")
    
    # For GET/OPTIONS → simple redirect
    if request.method in ("GET", "OPTIONS"):
        return StarletteRedirect(url=target, status_code=307)
    
    # For POST/PUT/PATCH/DELETE → forward with body intact via httpx
    body = await request.body()
    headers = dict(request.headers)
    
    import httpx
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8001") as client:
        resp = await client.request(
            method=request.method,
            url=target,
            content=body,
            headers={k: v for k, v in headers.items() if k.lower() not in ("host", "transfer-encoding", "content-length")},
        )
    
    from fastapi.responses import Response
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=dict(resp.headers),
    )

@app.api_route("/undefined/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], include_in_schema=False)
async def redirect_undefined_api(request: Request, path: str):
    return await _proxy_to_api(request, path)

# Also catch /checkout/undefined/api/*, /offers/undefined/api/*, etc.
@app.api_route("/{prefix:path}/undefined/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], include_in_schema=False)
async def redirect_nested_undefined_api(request: Request, prefix: str, path: str):
    return await _proxy_to_api(request, path)

# --- Email Helper ---
def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via SMTP SSL"""
    if not SMTP_SERVER or not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.warning("SMTP not configured, skipping email send")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(message)
            logger.info(f"Email sent to {to_email}")
            return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def _email_base_template(content: str, direction: str = "ltr") -> str:
    """Professional email template — dark minimal design, maximum compatibility"""
    return f"""<!DOCTYPE html>
<html dir="{direction}" lang="{direction}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>DeezLink</title>
<!--[if mso]>
<style>table,td,div,p,a,span{{font-family:Arial,Helvetica,sans-serif !important;}}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;word-spacing:normal;">

<!-- Wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0a;">
<tr><td align="center" style="padding:32px 16px;">

<!-- Container 540px -->
<table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;">

<!-- Logo Header -->
<tr><td align="center" style="padding:0 0 28px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:10px 20px;background-color:#1a1a2e;border:1px solid #2a2a3e;border-radius:12px;">
      <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;text-decoration:none;">Deez<span style="color:#a855f7;">Link</span></span>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Main Card -->
<tr><td style="background-color:#141418;border:1px solid #1e1e28;border-radius:20px;overflow:hidden;">
  <!-- Purple accent bar -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="height:3px;background:linear-gradient(90deg,#7c3aed,#a855f7,#c084fc);font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>
  <!-- Content -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:36px 32px;">
    {content}
  </td></tr>
  </table>
</td></tr>

<!-- Footer -->
<tr><td align="center" style="padding:24px 0 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="font-size:11px;color:#555555;text-align:center;line-height:1.6;">
    DeezLink &mdash; Premium Music Access<br>
    <span style="color:#444444;">Secure &bull; Instant &bull; Trusted</span>
  </td></tr>
  </table>
</td></tr>

</table>
<!-- /Container -->

</td></tr>
</table>
<!-- /Wrapper -->

</body>
</html>"""


def send_magic_link_email(email: str, token: str, lang: str = "fr"):
    """Send magic link authentication email — professional dark design with bulletproof button"""
    base_url = os.environ.get('SITE_URL', 'https://deezlink.com')
    magic_link = f"{base_url}/login?token={token}"
    
    logger.info(f"[EMAIL] Magic link URL: {magic_link}")

    texts = {
        "fr": {
            "subject": "🔐 Votre lien de connexion DeezLink",
            "greeting": "Bonjour,",
            "body": "Vous avez demandé un lien de connexion pour votre compte DeezLink. Cliquez sur le bouton ci-dessous pour accéder à votre espace.",
            "btn": "Se connecter à DeezLink",
            "or_copy": "Ou copiez ce lien dans votre navigateur :",
            "expire": "Ce lien expire dans 30 minutes.",
            "security": "Pour votre sécurité, ne partagez jamais ce lien.",
            "ignore": "Si vous n'avez pas demandé ce lien, ignorez simplement cet email. Votre compte reste sécurisé.",
        },
        "ar": {
            "subject": "🔐 رابط تسجيل الدخول إلى DeezLink",
            "greeting": "مرحبا،",
            "body": "لقد طلبت رابط تسجيل دخول لحسابك في DeezLink. انقر على الزر أدناه للوصول إلى حسابك.",
            "btn": "تسجيل الدخول إلى DeezLink",
            "or_copy": "أو انسخ هذا الرابط في متصفحك:",
            "expire": "تنتهي صلاحية هذا الرابط خلال 30 دقيقة.",
            "security": "لأمانك، لا تشارك هذا الرابط مع أي شخص.",
            "ignore": "إذا لم تطلب هذا الرابط، يرجى تجاهل هذا البريد. حسابك آمن.",
        },
        "en": {
            "subject": "🔐 Your DeezLink Login Link",
            "greeting": "Hello,",
            "body": "You requested a login link for your DeezLink account. Click the button below to access your account.",
            "btn": "Sign In to DeezLink",
            "or_copy": "Or copy this link into your browser:",
            "expire": "This link expires in 30 minutes.",
            "security": "For your security, never share this link.",
            "ignore": "If you didn't request this link, simply ignore this email. Your account remains secure.",
        },
        "es": {
            "subject": "🔐 Tu enlace de inicio de sesión DeezLink",
            "greeting": "Hola,",
            "body": "Has solicitado un enlace de inicio de sesión para tu cuenta DeezLink. Haz clic en el botón de abajo para acceder.",
            "btn": "Iniciar sesión en DeezLink",
            "or_copy": "O copia este enlace en tu navegador:",
            "expire": "Este enlace expira en 30 minutos.",
            "security": "Por tu seguridad, nunca compartas este enlace.",
            "ignore": "Si no solicitaste este enlace, ignora este email. Tu cuenta permanece segura.",
        },
    }
    t = texts.get(lang, texts.get("en"))
    direction = "rtl" if lang == "ar" else "ltr"

    content = f"""
    <!-- Greeting -->
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#ffffff;">{t['greeting']}</p>
    <p style="margin:0 0 28px;font-size:14px;color:#a0a0a0;line-height:1.7;">{t['body']}</p>
    
    <!-- CTA Button — Bulletproof (works in Outlook, Gmail, Apple Mail) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
    <tr><td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{magic_link}" style="height:52px;v-text-anchor:middle;width:320px;" arcsize="15%" fillcolor="#7c3aed">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">{t['btn']}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="{magic_link}" target="_blank" style="display:inline-block;padding:16px 48px;background-color:#7c3aed;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;text-align:center;letter-spacing:0.2px;mso-hide:all;">
        {t['btn']} &rarr;
      </a>
      <!--<![endif]-->
    </td></tr>
    </table>
    
    <!-- Fallback link -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
    <tr><td style="padding:14px 16px;background-color:#1a1a24;border:1px solid #2a2a36;border-radius:10px;">
      <p style="margin:0 0 6px;font-size:11px;color:#666666;text-transform:uppercase;letter-spacing:1px;">{t['or_copy']}</p>
      <a href="{magic_link}" style="font-size:12px;color:#a855f7;text-decoration:none;word-break:break-all;line-height:1.5;">{magic_link}</a>
    </td></tr>
    </table>
    
    <!-- Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td width="24" style="vertical-align:top;padding-top:2px;"><span style="font-size:13px;">&#9200;</span></td>
      <td style="padding-left:8px;font-size:13px;color:#888888;line-height:1.5;">{t['expire']}</td>
    </tr>
    <tr><td colspan="2" style="height:8px;"></td></tr>
    <tr>
      <td width="24" style="vertical-align:top;padding-top:2px;"><span style="font-size:13px;">&#128274;</span></td>
      <td style="padding-left:8px;font-size:13px;color:#888888;line-height:1.5;">{t['security']}</td>
    </tr>
    </table>
    
    <!-- Separator -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="height:1px;background-color:#1e1e28;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>
    
    <!-- Ignore notice -->
    <p style="margin:16px 0 0;font-size:12px;color:#555555;line-height:1.6;">{t['ignore']}</p>
    """

    html = _email_base_template(content, direction)
    return send_email(email, t["subject"], html)

def send_order_confirmation_email(email: str, order_id: str, links: List[str], lang: str = "fr"):
    """Send order confirmation with links — professional dark design"""
    links_rows = ""
    for i, link in enumerate(links):
        links_rows += f"""
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #1e1e28;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="32" style="vertical-align:middle;">
                <div style="width:28px;height:28px;border-radius:8px;background-color:#1a2a1a;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:#22d3ee;">{i+1}</div>
              </td>
              <td style="vertical-align:middle;padding-left:12px;">
                <a href="{link}" style="color:#a855f7;font-size:13px;font-family:'Courier New',monospace;text-decoration:none;word-break:break-all;">{link}</a>
              </td>
            </tr>
            </table>
          </td>
        </tr>"""

    texts = {
        "fr": {
            "subject": f"Votre commande DeezLink #{order_id}",
            "title": "Merci pour votre achat !",
            "order_label": "Commande",
            "links_title": "Vos liens d'activation",
            "guarantee": "Chaque lien est garanti minimum 1 mois.",
            "keep": "Conservez precieusement ces liens.",
        },
        "en": {
            "subject": f"Your DeezLink Order #{order_id}",
            "title": "Thank you for your purchase!",
            "order_label": "Order",
            "links_title": "Your activation links",
            "guarantee": "Each link is guaranteed for a minimum of 1 month.",
            "keep": "Keep these links safe.",
        },
    }
    t = texts.get(lang, texts["en"])

    content = f"""
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:16px;background-color:#0a2a0a;border:1px solid #1a3a1a;line-height:56px;text-align:center;">
        <span style="font-size:24px;">&#10004;</span>
      </div>
    </div>
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#ffffff;text-align:center;">{t['title']}</h1>
    <p style="margin:0 0 28px;font-size:13px;color:#666666;text-align:center;font-family:'Courier New',monospace;">{t['order_label']} #{order_id}</p>
    <!-- Links Card -->
    <div style="background-color:#1a1a24;border:1px solid #2a2a36;border-radius:14px;overflow:hidden;margin-bottom:24px;">
      <div style="padding:14px 16px;border-bottom:1px solid #2a2a36;">
        <span style="font-size:14px;font-weight:600;color:#22d3ee;">&#127925; {t['links_title']}</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        {links_rows}
      </table>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:12px 16px;background-color:#0a1a0a;border:1px solid #1a2a1a;border-radius:10px;">
      <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
        &#128737; {t['guarantee']}<br>&#128274; {t['keep']}
      </p>
    </td></tr>
    </table>
    """

    html = _email_base_template(content)
    return send_email(email, t["subject"], html)

# --- Auth Helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# --- Loyalty Helpers ---
def get_loyalty_tier(points: int) -> dict:
    """Get loyalty tier based on points"""
    tier = "bronze"
    for tier_name, tier_data in LOYALTY_TIERS.items():
        if points >= tier_data["min_points"]:
            tier = tier_name
    return {"tier": tier, **LOYALTY_TIERS[tier]}

def calculate_loyalty_points(amount: float) -> int:
    """1 point per 1€ spent"""
    return int(amount)

# --- Pydantic Models ---
class LoginRequest(BaseModel):
    email: str
    password: str

class MagicLinkRequest(BaseModel):
    email: str
    language: str = "en"

class MagicLinkVerifyRequest(BaseModel):
    token: str

class OrderCreateRequest(BaseModel):
    pack_id: str
    email: str
    language: str = "en"

class CustomOrderRequest(BaseModel):
    quantity: int
    email: str

class LinkImportRequest(BaseModel):
    links: List[str]

class LinkManualAdd(BaseModel):
    link: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None

# --- Custom Pricing Logic ---
def calculate_custom_price(quantity: int, loyalty_discount: int = 0) -> dict:
    """Calculate price for any quantity using degressive tiers."""
    if quantity < 1:
        return {"quantity": 0, "total": 0, "unit_price": 0, "discount": 0, "savings": 0}
    if quantity >= 500:
        unit = 1.50
    elif quantity >= 250:
        unit = 1.80
    elif quantity >= 100:
        unit = 2.00
    elif quantity >= 50:
        unit = 2.50
    elif quantity >= 25:
        unit = 3.00
    elif quantity >= 10:
        unit = 3.50
    elif quantity >= 5:
        unit = 4.00
    elif quantity >= 3:
        unit = 4.33
    else:
        unit = 5.00
    
    total = round(unit * quantity, 2)
    
    # Apply loyalty discount
    if loyalty_discount > 0:
        total = round(total * (1 - loyalty_discount / 100), 2)
    
    base = 5.00 * quantity
    discount = round((1 - total / base) * 100) if base > 0 else 0
    savings = round(base - total, 2)
    return {"quantity": quantity, "total": total, "unit_price": unit, "discount": discount, "savings": savings, "loyalty_discount": loyalty_discount}

# --- Helper to get client IP ---
def get_client_ip(request: Request) -> str:
    """Extract real client IP from request headers"""
    # Check various headers used by proxies
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    
    cf_connecting_ip = request.headers.get("cf-connecting-ip")
    if cf_connecting_ip:
        return cf_connecting_ip.strip()
    
    # Fallback to direct connection
    return request.client.host if request.client else "127.0.0.1"


# ═══════════════════════════════════════════════════════════
# SECURITY SESSION TOKEN ENDPOINTS (v2)
# ═══════════════════════════════════════════════════════════

@api_router.post("/security/token/init")
async def security_token_init(request: Request):
    """Initialize a security session. Called on app load."""
    client_ip = get_client_ip(request)
    body = {}
    try:
        raw = await request.body()
        if raw:
            body = json_module.loads(raw)
    except Exception:
        pass
    
    fingerprint = body.get("fingerprint", "")
    user_agent = request.headers.get("user-agent", "")
    
    if not fingerprint or len(fingerprint) < 32:
        # Generate server-side fingerprint from headers
        fp_source = f"{user_agent}:{client_ip}:{request.headers.get('accept-language', '')}"
        fingerprint = hashlib.sha256(fp_source.encode()).hexdigest()
    
    result = session_store.init_session(fingerprint, client_ip, user_agent)
    ip_scorer.record_request(client_ip, user_agent)
    
    return result

@api_router.post("/security/token/renew")
async def security_token_renew(request: Request):
    """Renew security session token. Must provide previous valid token."""
    client_ip = get_client_ip(request)
    body = {}
    try:
        raw = await request.body()
        if raw:
            body = json_module.loads(raw)
    except Exception:
        pass
    
    old_token = body.get("token", "")
    fingerprint = body.get("fingerprint", "")
    user_agent = request.headers.get("user-agent", "")
    
    if not old_token:
        ip_scorer.penalize(client_ip, "missing_token_renew", 5)
        raise HTTPException(status_code=400, detail="Previous token required")
    
    result = session_store.renew_token(old_token, fingerprint, client_ip, user_agent)
    
    if not result:
        ip_scorer.penalize(client_ip, "invalid_renewal", 10)
        await db.security_logs.insert_one({
            "event": "token_renewal_failed",
            "ip": client_ip,
            "fingerprint": fingerprint[:16] if fingerprint else "",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(
            status_code=401,
            detail={"code": "TOKEN_INVALID", "message": "Token renewal failed. Re-initialize session."}
        )
    
    ip_scorer.record_request(client_ip, request.headers.get("user-agent", ""))
    return result

@api_router.get("/security/score")
async def security_score(request: Request):
    """Get current IP security score (for conditional captcha display)"""
    client_ip = get_client_ip(request)
    score = ip_scorer.get_score(client_ip)
    return {
        "ip_score": score,
        "require_captcha": score < 70,
    }

# ═══════════════════════════════════════════════════════════
# CLICK CAPTCHA ENDPOINTS (v2 - lighter, 5s verification)
# ═══════════════════════════════════════════════════════════

@api_router.post("/captcha/click/start")
async def captcha_click_start(request: Request):
    """Start a click captcha challenge"""
    client_ip = get_client_ip(request)
    body = {}
    try:
        raw = await request.body()
        if raw:
            body = json_module.loads(raw)
    except Exception:
        pass
    
    fingerprint = body.get("fingerprint", "")
    security_token = body.get("security_token", "") or request.headers.get("x-security-token", "")
    
    # Validate security session token
    user_agent = request.headers.get("user-agent", "")
    if security_token:
        valid, reason, _ = session_store.validate_token(security_token, fingerprint, client_ip, user_agent)
        if not valid:
            logger.warning(f"[CAPTCHA] Invalid security token: reason={reason} ip={client_ip}")
    
    challenge = click_captcha.start_challenge(fingerprint, client_ip)
    return challenge

@api_router.post("/captcha/click/verify")
async def captcha_click_verify(request: Request):
    """Verify a click captcha challenge. Returns bound captcha_token."""
    client_ip = get_client_ip(request)
    body = {}
    try:
        raw = await request.body()
        if raw:
            body = json_module.loads(raw)
    except Exception:
        pass
    
    challenge_id = body.get("challenge_id", "")
    fingerprint = body.get("fingerprint", "")
    
    valid, result = click_captcha.verify_challenge(challenge_id, fingerprint, client_ip)
    
    if not valid:
        logger.warning(f"[CAPTCHA-CLICK] Failed: reason={result} ip={client_ip}")
        ip_scorer.penalize(client_ip, f"captcha_fail_{result}", 10)
        await db.security_logs.insert_one({
            "event": "captcha_click_failed",
            "reason": result,
            "ip": client_ip,
            "fingerprint": fingerprint[:16] if fingerprint else "",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=403, detail=f"Captcha verification failed: {result}")
    
    logger.info(f"[CAPTCHA-CLICK] Solved: ip={client_ip}")
    # Boost IP score on successful captcha
    ip_scorer.scores.setdefault(client_ip, {"score": 100, "penalties": [], "last_update": time.time(), "request_count": 0})
    ip_scorer.scores[client_ip]["score"] = min(100, ip_scorer.scores[client_ip]["score"] + 30)
    
    return {"success": True, "captcha_token": result}

# Legacy captcha endpoints (backward compatibility)
@api_router.post("/captcha/generate")
async def captcha_generate(request: Request):
    """Generate a new captcha challenge (legacy - redirects to click)"""
    return await captcha_click_start(request)

@api_router.post("/captcha/verify")
async def captcha_verify(request: Request):
    """Verify captcha (legacy - redirects to click verify)"""
    return await captcha_click_verify(request)


# ==================== DEEZER API PROXY ====================

@api_router.get("/stats/public")
async def public_stats():
    """Public-facing stats for landing page social proof"""
    orders_count = await db.orders.count_documents({"status": "completed"})
    links_count = await db.links.count_documents({"status": "sold"})
    return {
        "orders": orders_count,
        "links": links_count,
    }

# In-memory cache for Deezer data (5 min TTL)
_deezer_cache: dict = {}

@api_router.get("/deezer/trending")
async def deezer_trending():
    """Fetch trending tracks and artists from Deezer public API"""
    import time as _time
    cache_key = "trending_global"
    cached = _deezer_cache.get(cache_key)
    if cached and _time.time() - cached["ts"] < 300:
        return cached["data"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            # Fetch chart tracks
            tracks_resp = await http_client.get("https://api.deezer.com/chart/0/tracks?limit=10")
            artists_resp = await http_client.get("https://api.deezer.com/chart/0/artists?limit=12")
            albums_resp = await http_client.get("https://api.deezer.com/chart/0/albums?limit=8")

            tracks_data = tracks_resp.json().get("data", []) if tracks_resp.status_code == 200 else []
            artists_data = artists_resp.json().get("data", []) if artists_resp.status_code == 200 else []
            albums_data = albums_resp.json().get("data", []) if albums_resp.status_code == 200 else []

            result = {
                "tracks": [{
                    "id": t.get("id"),
                    "title": t.get("title"),
                    "duration": t.get("duration"),
                    "preview": t.get("preview"),
                    "position": t.get("position"),
                    "artist_name": t.get("artist", {}).get("name"),
                    "artist_picture": t.get("artist", {}).get("picture_medium"),
                    "album_title": t.get("album", {}).get("title"),
                    "album_cover": t.get("album", {}).get("cover_medium"),
                    "album_cover_big": t.get("album", {}).get("cover_big"),
                } for t in tracks_data],
                "artists": [{
                    "id": a.get("id"),
                    "name": a.get("name"),
                    "picture": a.get("picture_medium"),
                    "picture_big": a.get("picture_big"),
                    "picture_xl": a.get("picture_xl"),
                    "nb_fan": a.get("nb_fan", 0),
                    "position": a.get("position"),
                } for a in artists_data],
                "albums": [{
                    "id": al.get("id"),
                    "title": al.get("title"),
                    "cover": al.get("cover_medium"),
                    "cover_big": al.get("cover_big"),
                    "artist_name": al.get("artist", {}).get("name"),
                } for al in albums_data],
            }
            _deezer_cache[cache_key] = {"data": result, "ts": _time.time()}
            return result
    except Exception as e:
        logger.error(f"Deezer API error: {e}")
        return {"tracks": [], "artists": [], "albums": []}


# ==================== ROUTES WITH ANTI-ABUSE PROTECTION ====================

# --- Auth Routes ---
@api_router.post("/auth/login")
async def login(request: Request):
    """Admin login with telemetry validation"""
    ctx = await extract_telemetry_and_data(request)
    data = ctx["data"]
    if not data:
        data = await parse_body(request)
    
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    client_ip = ctx["client_ip"]
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    # Check if IP is blocked
    if rate_limiter.is_ip_blocked(client_ip):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    # Rate limit check
    rate_key = f"login:{client_ip}"
    if rate_limiter.is_rate_limited(rate_key, RATE_LIMITS["login_ip"]["max"], RATE_LIMITS["login_ip"]["window"]):
        raise HTTPException(status_code=429, detail="Too many login attempts. Please wait.")
    
    rate_limiter.record_request(rate_key)
    
    email = email
    user = await db.users.find_one({"email": email})
    
    if not user or not verify_password(password, user.get("password_hash", "")):
        # Record failed attempt
        failed_count = rate_limiter.record_failed_login(client_ip)
        
        # Log security event
        await db.security_logs.insert_one({
            "event": "failed_login",
            "email": email,
            "ip": client_ip,
            "failed_count": failed_count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Clear failed login count on success
    rate_limiter.clear_failed_logins(client_ip)
    
    # Log successful login
    await db.security_logs.insert_one({
        "event": "successful_login",
        "email": email,
        "ip": client_ip,
        "user_id": str(user["_id"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Update user's last login and IP
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat(), "last_ip": client_ip}}
    )
    
    token = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    response = JSONResponse(content={
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "loyalty_points": user.get("loyalty_points", 0),
        "loyalty_tier": get_loyalty_tier(user.get("loyalty_points", 0))
    })
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    return response

@api_router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path="/")
    return response

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    user["loyalty_tier"] = get_loyalty_tier(user.get("loyalty_points", 0))
    return user

# --- Profile Routes ---
@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get full user profile with order stats"""
    email = user["email"]
    # Count orders
    total_orders = await db.orders.count_documents({"email": email})
    completed_orders = await db.orders.count_documents({"email": email, "status": "completed"})
    # Total spent
    pipeline = [
        {"$match": {"email": email, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]
    result = await db.orders.aggregate(pipeline).to_list(1)
    total_spent = result[0]["total"] if result else 0

    loyalty_tier = get_loyalty_tier(user.get("loyalty_points", 0))
    # Next tier
    points = user.get("loyalty_points", 0)
    next_tier = None
    for tier_name, tier_data in LOYALTY_TIERS.items():
        if tier_data["min_points"] > points:
            next_tier = {"name": tier_name, **tier_data}
            break

    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "loyalty_points": points,
        "loyalty_tier": loyalty_tier,
        "next_tier": next_tier,
        "points_to_next": next_tier["min_points"] - points if next_tier else 0,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_spent": round(total_spent, 2),
        "country": user.get("country", "Unknown"),
        "created_at": user.get("created_at", ""),
    }

@api_router.put("/user/profile")
async def update_profile(req: ProfileUpdateRequest, user: dict = Depends(get_current_user)):
    """Update user profile"""
    update_fields = {}
    if req.name is not None:
        update_fields["name"] = req.name.strip()
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one(
        {"email": user["email"]},
        {"$set": update_fields}
    )
    updated = await db.users.find_one({"email": user["email"]})
    updated["_id"] = str(updated["_id"])
    updated.pop("password_hash", None)
    updated["loyalty_tier"] = get_loyalty_tier(updated.get("loyalty_points", 0))
    return updated

# --- Magic Link Auth with Anti-Abuse ---
@api_router.post("/auth/magic")
async def magic_link_request(request: Request):
    """Magic link login — with telemetry validation and email delivery feedback"""
    # Extract telemetry + clean data
    ctx = await extract_telemetry_and_data(request)
    data = ctx["data"]
    client_ip = ctx["client_ip"]
    
    # If no telemetry data extracted, fall back to parse_body
    if not data:
        data = await parse_body(request)
    
    email = data.get("email", "").strip().lower() if data else ""
    language = data.get("language", "en") if data else "en"
    captcha_token = data.get("captcha_token", "") if data else ""
    
    if not email or "@" not in email:
        logger.error(f"[MAGIC] No valid email. Data parsed: {data}")
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Verify captcha token (required only if IP score is low)
    requires_captcha = ip_scorer.requires_captcha(client_ip)
    if requires_captcha:
        if not captcha_token or not click_captcha.verify_token(captcha_token, fingerprint=ctx.get("fingerprint", ""), ip=client_ip):
            logger.warning(f"[MAGIC] Invalid captcha from {client_ip} for {email}")
            raise HTTPException(status_code=403, detail={"code": "CAPTCHA_REQUIRED", "message": "Captcha verification required. Please complete the captcha."})
    
    # Rate limit by IP — just reject, NO IP blocking
    ip_key = f"magic_ip:{client_ip}"
    if rate_limiter.is_rate_limited(ip_key, RATE_LIMITS["magic_link_ip"]["max"], RATE_LIMITS["magic_link_ip"]["window"]):
        await db.security_logs.insert_one({
            "event": "magic_link_rate_limit_ip",
            "ip": client_ip, "email": email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a few minutes.")
    
    # Rate limit by email — just reject, NO email blocking
    email_key = f"magic_email:{email}"
    if rate_limiter.is_rate_limited(email_key, RATE_LIMITS["magic_link_email"]["max"], RATE_LIMITS["magic_link_email"]["window"]):
        await db.security_logs.insert_one({
            "event": "magic_link_rate_limit_email",
            "ip": client_ip, "email": email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=429, detail="Too many requests for this email. Please wait a few minutes.")
    
    rate_limiter.record_request(ip_key)
    rate_limiter.record_request(email_key)
    
    # Generate magic token + session_id for polling
    magic_token = secrets.token_urlsafe(32)
    session_id = secrets.token_urlsafe(16)
    expiry = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    await db.magic_tokens.delete_many({"email": email})
    await db.magic_tokens.insert_one({
        "email": email,
        "token": magic_token,
        "session_id": session_id,
        "verified": False,
        "expiry": expiry.isoformat(),
        "request_ip": client_ip,
        "fingerprint": ctx.get("fingerprint", ""),
        "telemetry_score": ctx["telemetry_score"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send email and capture delivery status
    email_sent = send_magic_link_email(email, magic_token, language)
    
    await db.security_logs.insert_one({
        "event": "magic_link_requested",
        "email": email,
        "ip": client_ip,
        "email_sent": email_sent,
        "telemetry_score": ctx["telemetry_score"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": "Magic link sent" if email_sent else "Email delivery failed",
        "email": email,
        "session_id": session_id,
        "email_sent": email_sent,
        "telemetry_verified": ctx["telemetry_valid"]
    }

@api_router.post("/auth/magic/resend")
async def magic_link_resend(request: Request):
    """Resend magic link — requires telemetry, has separate rate limiting"""
    ctx = await extract_telemetry_and_data(request)
    data = ctx["data"]
    client_ip = ctx["client_ip"]
    
    if not data:
        data = await parse_body(request)
    
    email = data.get("email", "").strip().lower() if data else ""
    session_id = data.get("session_id", "") if data else ""
    language = data.get("language", "en") if data else "en"
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Strict telemetry for resend (prevent automated abuse)
    if not ctx["telemetry_valid"]:
        logger.warning(f"[RESEND] Blocked — invalid telemetry from {client_ip}")
        await db.security_logs.insert_one({
            "event": "resend_blocked_telemetry",
            "ip": client_ip, "email": email,
            "score": ctx["telemetry_score"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=403, detail="Security validation failed. Please refresh the page.")
    
    # Rate limit: max 2 resends per email per 5 min
    resend_key = f"resend:{email}"
    if rate_limiter.is_rate_limited(resend_key, 2, 300):
        raise HTTPException(status_code=429, detail="Too many resend attempts. Please wait.")
    rate_limiter.record_request(resend_key)
    
    # Check existing session
    existing = await db.magic_tokens.find_one({"email": email})
    if not existing:
        raise HTTPException(status_code=404, detail="No pending login session found")
    
    expiry = datetime.fromisoformat(existing["expiry"])
    if datetime.now(timezone.utc) > expiry:
        await db.magic_tokens.delete_one({"email": email})
        raise HTTPException(status_code=410, detail="Session expired. Please start a new login.")
    
    # Generate new token (invalidate old one), keep same session_id
    new_token = secrets.token_urlsafe(32)
    new_expiry = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    await db.magic_tokens.update_one(
        {"email": email},
        {"$set": {
            "token": new_token,
            "expiry": new_expiry.isoformat(),
            "request_ip": client_ip,
            "fingerprint": ctx.get("fingerprint", ""),
            "resent_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    email_sent = send_magic_link_email(email, new_token, language)
    
    await db.security_logs.insert_one({
        "event": "magic_link_resent",
        "email": email,
        "ip": client_ip,
        "email_sent": email_sent,
        "telemetry_score": ctx["telemetry_score"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "message": "Magic link resent" if email_sent else "Email delivery failed",
        "email_sent": email_sent,
        "session_id": existing["session_id"]
    }

@api_router.post("/auth/magic/verify")
async def magic_link_verify(request: Request):
    """Verify magic link token — accepts telemetry"""
    ctx = await extract_telemetry_and_data(request)
    data = ctx["data"]
    
    token = data.get("token", "") if data else ""
    
    if not token:
        # Fallback: try raw body parse
        try:
            raw_body = await request.body()
            if raw_body:
                import json as json_mod
                parsed = json_mod.loads(raw_body)
                token = parsed.get("token", "")
        except:
            pass
    
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    token_doc = await db.magic_tokens.find_one({"token": token})
    if not token_doc:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    expiry = datetime.fromisoformat(token_doc["expiry"])
    if datetime.now(timezone.utc) > expiry:
        await db.magic_tokens.delete_one({"token": token})
        raise HTTPException(status_code=401, detail="Token expired")
    
    email = token_doc["email"]
    client_ip = get_client_ip(request)
    
    # Detect country from IP
    country = "Unknown"
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(f"http://ip-api.com/json/{client_ip}?fields=status,countryCode")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    country = data.get("countryCode", "Unknown")
    except Exception:
        pass

    # Get or create user
    user = await db.users.find_one({"email": email})
    if not user:
        result = await db.users.insert_one({
            "email": email,
            "password_hash": "",
            "name": email.split("@")[0],
            "role": "user",
            "loyalty_points": 0,
            "country": country,
            "signup_ip": client_ip,
            "last_ip": client_ip,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        user = await db.users.find_one({"_id": result.inserted_id})
    else:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_ip": client_ip, "last_login": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Mark session as verified (for polling) and store JWT
    access_token = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    await db.magic_tokens.update_one(
        {"token": token},
        {"$set": {"verified": True, "access_token": access_token, "user_id": str(user["_id"])}}
    )
    
    # Log security event
    await db.security_logs.insert_one({
        "event": "magic_link_verified",
        "email": email,
        "ip": client_ip,
        "country": country,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Return page with auto-close or redirect
    user_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "loyalty_points": user.get("loyalty_points", 0),
        "loyalty_tier": get_loyalty_tier(user.get("loyalty_points", 0))
    }
    response = JSONResponse(content=user_data)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400 * 30, path="/")
    return response


@api_router.get("/auth/magic/check/{session_id}")
async def magic_link_check(session_id: str):
    """Polling endpoint: check if magic link was clicked and verified"""
    token_doc = await db.magic_tokens.find_one({"session_id": session_id})
    if not token_doc:
        return {"status": "expired", "verified": False}
    
    expiry = datetime.fromisoformat(token_doc["expiry"])
    if datetime.now(timezone.utc) > expiry:
        await db.magic_tokens.delete_one({"session_id": session_id})
        return {"status": "expired", "verified": False}
    
    if token_doc.get("verified"):
        access_token = token_doc.get("access_token", "")
        # Get user data
        user = await db.users.find_one({"email": token_doc["email"]})
        user_data = None
        if user:
            user_data = {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "role": user.get("role", "user"),
                "loyalty_points": user.get("loyalty_points", 0),
                "loyalty_tier": get_loyalty_tier(user.get("loyalty_points", 0))
            }
        # Clean up the token
        await db.magic_tokens.delete_one({"session_id": session_id})
        
        response = JSONResponse(content={"status": "verified", "verified": True, "user": user_data})
        if access_token:
            response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=86400 * 30, path="/")
        return response
    
    return {"status": "pending", "verified": False}

def _is_admin_ip(ip: str) -> bool:
    """Check if an IP is in the admin IPs list — supports partial match for dynamic IPs"""
    for admin_ip in ADMIN_IPS:
        if ip == admin_ip:
            return True
        # Also check if IP starts with same prefix (e.g., 5.49.128.x)
        if admin_ip.count('.') == 3 and ip.count('.') == 3:
            admin_prefix = '.'.join(admin_ip.split('.')[:3])
            ip_prefix = '.'.join(ip.split('.')[:3])
            if admin_prefix == ip_prefix:
                return True
    return False

# --- Admin IP Check & Auto-Login ---
@api_router.get("/admin/check-ip")
async def check_admin_ip(request: Request):
    client_ip = get_client_ip(request)
    # Also check all forwarded IPs in the chain
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    
    is_admin = any(_is_admin_ip(ip) for ip in all_ips)
    logger.info(f"Admin IP check: ips={all_ips} admin_ips={ADMIN_IPS} result={is_admin}")
    return {"is_admin": is_admin, "ip": client_ip, "all_ips": all_ips}

@api_router.post("/admin/auto-login")
async def admin_auto_login(request: Request):
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    
    is_admin = any(_is_admin_ip(ip) for ip in all_ips)
    logger.info(f"Admin auto-login attempt: ips={all_ips} admin={is_admin}")
    
    if not is_admin:
        raise HTTPException(status_code=403, detail=f"Not authorized. Your IPs: {all_ips}")
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@deezlink.com").strip().lower()
    user = await db.users.find_one({"email": admin_email})
    if not user:
        # Auto-create admin user if doesn't exist
        admin_doc = {
            "email": admin_email,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "loyalty_points": 0,
            "loyalty_tier": LOYALTY_TIERS["diamond"],
        }
        result = await db.users.insert_one(admin_doc)
        admin_doc["_id"] = result.inserted_id
        user = admin_doc
    
    token = create_access_token(str(user["_id"]), admin_email, "admin")
    response = JSONResponse(content={
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": "admin"
    })
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    return response

# --- Pack Routes ---
@api_router.get("/packs")
async def get_packs():
    return {"packs": PACKS}

# --- Custom Pricing Route ---
@api_router.get("/pricing/calculate")
async def pricing_calculate(quantity: int = 1, email: Optional[str] = None):
    if quantity < 1 or quantity > 1000:
        raise HTTPException(status_code=400, detail="Quantity must be between 1 and 1000")
    
    loyalty_discount = 0
    if email:
        user = await db.users.find_one({"email": email.strip().lower()})
        if user:
            tier = get_loyalty_tier(user.get("loyalty_points", 0))
            loyalty_discount = tier["discount"]
    
    return calculate_custom_price(quantity, loyalty_discount)

# --- Loyalty Routes ---
@api_router.get("/loyalty/status")
async def get_loyalty_status(email: str):
    user = await db.users.find_one({"email": email.strip().lower()})
    if not user:
        return {"points": 0, "tier": get_loyalty_tier(0), "next_tier": LOYALTY_TIERS["silver"]}
    
    points = user.get("loyalty_points", 0)
    current_tier = get_loyalty_tier(points)
    
    # Find next tier
    next_tier = None
    for tier_name, tier_data in LOYALTY_TIERS.items():
        if tier_data["min_points"] > points:
            next_tier = {"name": tier_name, **tier_data}
            break
    
    return {
        "points": points,
        "tier": current_tier,
        "next_tier": next_tier,
        "points_to_next": next_tier["min_points"] - points if next_tier else 0
    }

@api_router.get("/loyalty/tiers")
async def get_loyalty_tiers():
    return {"tiers": LOYALTY_TIERS}

# --- Geo IP Route ---
@api_router.get("/geo")
async def get_geo(request: Request):
    client_ip = get_client_ip(request)
    logger.info(f"Geo detection for IP: {client_ip}")
    
    # Default values
    result = {"country": "FR", "language": "fr", "currency": "EUR", "symbol": "€", "rate": 1.0, "ip": client_ip}
    
    # Skip for private/local IPs
    if client_ip.startswith("127.") or client_ip.startswith("10.") or client_ip.startswith("192.168.") or client_ip == "localhost":
        logger.info("Local IP detected, using defaults")
        return result
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(f"http://ip-api.com/json/{client_ip}?fields=status,countryCode,country")
            if resp.status_code == 200:
                data = resp.json()
                logger.info(f"IP API response: {data}")
                if data.get("status") == "success":
                    cc = data.get("countryCode", "FR")
                    result["country"] = cc
                    result["language"] = LANG_MAP.get(cc, "en")
                    currency_info = CURRENCY_MAP.get(cc, CURRENCY_MAP["FR"])
                    result["currency"] = currency_info["currency"]
                    result["symbol"] = currency_info["symbol"]
                    result["rate"] = currency_info["rate"]
    except Exception as e:
        logger.warning(f"Geo IP detection failed: {e}")
    
    return result

# --- Order Routes ---
@api_router.post("/orders/create")
async def create_order(request: Request):
    ctx = await extract_telemetry_and_data(request)
    data = ctx["data"]
    if not data:
        data = await parse_body(request)
    
    pack_id = data.get("pack_id", "")
    email = data.get("email", "").strip().lower()
    language = data.get("language", "en")
    captcha_token = data.get("captcha_token", "")
    
    if not pack_id or not email:
        raise HTTPException(status_code=400, detail="pack_id and email are required")
    
    # Verify captcha (conditional - only if IP score is low)
    requires_captcha = ip_scorer.requires_captcha(ctx["client_ip"])
    if requires_captcha:
        if not captcha_token or not click_captcha.verify_token(captcha_token, fingerprint=ctx.get("fingerprint", ""), ip=ctx["client_ip"]):
            raise HTTPException(status_code=403, detail={"code": "CAPTCHA_REQUIRED", "message": "Captcha verification required."})
    
    # Block orders without telemetry (strict for money operations)
    if not ctx["telemetry_valid"]:
        await db.security_logs.insert_one({
            "event": "order_blocked_telemetry",
            "ip": ctx["client_ip"], "email": email,
            "score": ctx["telemetry_score"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=403, detail="Security validation failed. Please refresh and try again.")
    
    pack = next((p for p in PACKS if p["id"] == pack_id), None)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    
    # Check loyalty discount
    user = await db.users.find_one({"email": email})
    loyalty_discount = 0
    if user:
        tier = get_loyalty_tier(user.get("loyalty_points", 0))
        loyalty_discount = tier["discount"]
    
    final_price = pack["price"]
    if loyalty_discount > 0:
        final_price = round(pack["price"] * (1 - loyalty_discount / 100), 2)
    
    order_id = str(uuid.uuid4())[:8].upper()
    order = {
        "order_id": order_id,
        "pack_id": pack_id,
        "quantity": pack["quantity"],
        "original_price": pack["price"],
        "price": final_price,
        "loyalty_discount": loyalty_discount,
        "currency": "EUR",
        "email": email,
        "language": language,
        "status": "pending",
        "payment_url": None,
        "track_id": None,
        "links": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # OxaPay integration
    if OXAPAY_API_KEY:
        try:
            site_url = os.environ.get('SITE_URL', 'https://clone-learn-secure.preview.emergentagent.com')
            backend_url = os.environ.get('REACT_APP_BACKEND_URL', site_url)
            payload = {
                "merchant": OXAPAY_API_KEY,
                "amount": final_price,
                "currency": "EUR",
                "orderId": order_id,
                "description": f"DeezLink - Deezer Premium x{pack['quantity']}",
                "callbackUrl": f"{backend_url}/api/webhooks/oxapay",
                "returnUrl": f"{site_url}/order/{order_id}",
            }
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.post(f"{OXAPAY_BASE_URL}/merchants/request", json=payload)
                data = resp.json()
                logger.info(f"OxaPay response: {data}")
                if data.get("result") == 100:
                    order["payment_url"] = data.get("payLink", "")
                    order["track_id"] = data.get("trackId", "")
                else:
                    logger.error(f"OxaPay error: {data}")
                    order["status"] = "payment_error"
                    order["payment_url"] = f"/order/{order_id}?error=payment"
        except Exception as e:
            logger.error(f"OxaPay request failed: {e}")
            order["status"] = "payment_error"
            order["payment_url"] = f"/order/{order_id}?error=payment"
    else:
        order["status"] = "payment_error"
        order["payment_url"] = f"/order/{order_id}?error=no_payment_configured"
    
    await db.orders.insert_one(order)
    
    return {
        "order_id": order_id,
        "payment_url": order["payment_url"],
        "price": final_price,
        "original_price": pack["price"],
        "loyalty_discount": loyalty_discount,
        "quantity": pack["quantity"],
        "status": order["status"],
    }

@api_router.post("/orders/create-custom")
async def create_custom_order(request: Request):
    ctx = await extract_telemetry_and_data(request)
    data = ctx["data"]
    if not data:
        data = await parse_body(request)
    
    quantity = int(data.get("quantity", 0))
    email = data.get("email", "").strip().lower()
    captcha_token = data.get("captcha_token", "")
    
    if not email or quantity < 1:
        raise HTTPException(status_code=400, detail="email and quantity are required")
    
    if quantity < 1 or quantity > 1000:
        raise HTTPException(status_code=400, detail="Quantity must be between 1 and 1000")
    
    # Verify captcha (conditional - only if IP score is low)
    requires_captcha = ip_scorer.requires_captcha(ctx["client_ip"])
    if requires_captcha:
        if not captcha_token or not click_captcha.verify_token(captcha_token, fingerprint=ctx.get("fingerprint", ""), ip=ctx["client_ip"]):
            raise HTTPException(status_code=403, detail={"code": "CAPTCHA_REQUIRED", "message": "Captcha verification required."})
    
    # Block without telemetry
    if not ctx["telemetry_valid"]:
        await db.security_logs.insert_one({
            "event": "custom_order_blocked_telemetry",
            "ip": ctx["client_ip"], "email": email,
            "score": ctx["telemetry_score"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        raise HTTPException(status_code=403, detail="Security validation failed. Please refresh and try again.")
    
    # Check loyalty discount
    user = await db.users.find_one({"email": email})
    loyalty_discount = 0
    if user:
        tier = get_loyalty_tier(user.get("loyalty_points", 0))
        loyalty_discount = tier["discount"]
    
    pricing = calculate_custom_price(quantity, loyalty_discount)
    order_id = str(uuid.uuid4())[:8].upper()
    order = {
        "order_id": order_id,
        "pack_id": "custom",
        "quantity": quantity,
        "price": pricing["total"],
        "unit_price": pricing["unit_price"],
        "loyalty_discount": loyalty_discount,
        "currency": "EUR",
        "email": email,
        "status": "pending",
        "payment_url": None,
        "track_id": None,
        "links": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    if OXAPAY_API_KEY:
        try:
            site_url = os.environ.get('SITE_URL', 'https://clone-learn-secure.preview.emergentagent.com')
            backend_url = os.environ.get('REACT_APP_BACKEND_URL', site_url)
            payload = {
                "merchant": OXAPAY_API_KEY,
                "amount": pricing["total"],
                "currency": "EUR",
                "orderId": order_id,
                "description": f"DeezLink - Deezer Premium x{quantity}",
                "callbackUrl": f"{backend_url}/api/webhooks/oxapay",
                "returnUrl": f"{site_url}/order/{order_id}",
            }
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.post(f"{OXAPAY_BASE_URL}/merchants/request", json=payload)
                data = resp.json()
                if data.get("result") == 100:
                    order["payment_url"] = data.get("payLink", "")
                    order["track_id"] = data.get("trackId", "")
                else:
                    order["status"] = "payment_error"
                    order["payment_url"] = f"/order/{order_id}?error=payment"
        except Exception:
            order["status"] = "payment_error"
            order["payment_url"] = f"/order/{order_id}?error=payment"
    else:
        order["status"] = "payment_error"
        order["payment_url"] = f"/order/{order_id}?error=no_payment_configured"
    
    await db.orders.insert_one(order)
    
    return {
        "order_id": order_id,
        "payment_url": order["payment_url"],
        "price": pricing["total"],
        "quantity": quantity,
        "unit_price": pricing["unit_price"],
        "loyalty_discount": loyalty_discount,
        "status": order["status"],
    }

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.post("/orders/{order_id}/confirm-mock")
async def confirm_mock_order(order_id: str):
    """Mock payment confirmation for testing"""
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] not in ["pending", "payment_mock"]:
        return {"message": "Order already processed", "status": order["status"]}
    
    quantity = order["quantity"]
    available_links = await db.links.find({"status": "available"}).to_list(quantity)
    
    assigned_links = []
    for link_doc in available_links:
        await db.links.update_one(
            {"_id": link_doc["_id"]},
            {"$set": {"status": "sold", "order_id": order_id, "sold_at": datetime.now(timezone.utc).isoformat()}}
        )
        assigned_links.append(link_doc["url"])
    
    new_status = "completed" if len(assigned_links) >= quantity else "partial"
    
    # Add loyalty points
    points_earned = calculate_loyalty_points(order["price"])
    await db.users.update_one(
        {"email": order["email"]},
        {"$inc": {"loyalty_points": points_earned}}
    )
    
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": new_status,
            "links": assigned_links,
            "loyalty_points_earned": points_earned,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send confirmation email
    if assigned_links:
        send_order_confirmation_email(order["email"], order_id, assigned_links, order.get("language", "en"))
    
    return {"status": new_status, "links_assigned": len(assigned_links), "loyalty_points_earned": points_earned}

@api_router.get("/orders/history/{email}")
async def get_order_history(email: str, request: Request, user: dict = Depends(get_current_user)):
    """Order history — REQUIRES authentication, users can only see their own orders"""
    email = email.strip().lower()
    
    # Users can only see their own orders (admins can see all)
    if user.get("role") != "admin" and user.get("email", "").lower() != email:
        raise HTTPException(status_code=403, detail="You can only view your own orders.")
    
    orders = await db.orders.find({"email": email}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

# --- Webhook Routes ---
@api_router.post("/webhooks/oxapay")
async def oxapay_webhook(request: Request):
    try:
        body = await request.json()
        logger.info(f"OxaPay webhook received: {body}")
        
        order_id = body.get("orderId", "")
        status = body.get("status", "")
        track_id = body.get("trackId", "")
        
        if not order_id:
            return {"status": "ok"}
        
        order = await db.orders.find_one({"order_id": order_id})
        if not order:
            logger.warning(f"Webhook for unknown order: {order_id}")
            return {"status": "ok"}
        
        if status in ["Paid", "Confirmed"]:
            quantity = order["quantity"]
            available_links = await db.links.find({"status": "available"}).to_list(quantity)
            
            assigned_links = []
            for link_doc in available_links:
                await db.links.update_one(
                    {"_id": link_doc["_id"]},
                    {"$set": {"status": "sold", "order_id": order_id, "sold_at": datetime.now(timezone.utc).isoformat()}}
                )
                assigned_links.append(link_doc["url"])
            
            new_status = "completed" if len(assigned_links) >= quantity else "partial"
            
            # Add loyalty points
            points_earned = calculate_loyalty_points(order["price"])
            await db.users.update_one(
                {"email": order["email"]},
                {"$inc": {"loyalty_points": points_earned}},
                upsert=True
            )
            
            await db.orders.update_one(
                {"order_id": order_id},
                {"$set": {
                    "status": new_status,
                    "links": assigned_links,
                    "track_id": track_id,
                    "loyalty_points_earned": points_earned,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Send confirmation email
            if assigned_links:
                send_order_confirmation_email(order["email"], order_id, assigned_links, order.get("language", "en"))
                
        elif status in ["Expired", "Failed"]:
            await db.orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "ok"}

# --- Admin Routes ---
@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    total_orders = await db.orders.count_documents({})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "payment_mock"]}})
    failed_orders = await db.orders.count_documents({"status": "failed"})
    total_links = await db.links.count_documents({})
    available_links = await db.links.count_documents({"status": "available"})
    sold_links = await db.links.count_documents({"status": "sold"})
    total_users = await db.users.count_documents({})
    
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$price"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Security stats
    security_stats = rate_limiter.get_stats()
    
    # Get recent security events count (last 24h)
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    recent_security_events = await db.security_logs.count_documents({"timestamp": {"$gte": yesterday}})
    failed_logins_24h = await db.security_logs.count_documents({
        "event": "failed_login",
        "timestamp": {"$gte": yesterday}
    })
    
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "failed_orders": failed_orders,
        "total_links": total_links,
        "available_links": available_links,
        "sold_links": sold_links,
        "total_revenue": total_revenue,
        "total_users": total_users,
        "security": {
            **security_stats,
            "recent_events_24h": recent_security_events,
            "failed_logins_24h": failed_logins_24h,
        }
    }

@api_router.get("/admin/security/logs")
async def admin_security_logs(user: dict = Depends(require_admin), skip: int = 0, limit: int = 100, event_type: str = "all"):
    """Get security logs"""
    query = {}
    if event_type != "all":
        query["event"] = event_type
    
    logs = await db.security_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).to_list(limit)
    total = await db.security_logs.count_documents(query)
    
    # Get unique event types for filtering
    event_types = await db.security_logs.distinct("event")
    
    return {"logs": logs, "total": total, "event_types": event_types}

@api_router.get("/admin/security/blocked")
async def admin_blocked_list(user: dict = Depends(require_admin)):
    """Get currently blocked IPs and emails"""
    return {
        "blocked_ips": [
            {"ip": ip, "until": datetime.fromtimestamp(until).isoformat()}
            for ip, until in rate_limiter.blocked_ips.items()
        ],
        "blocked_emails": [
            {"email": email, "until": datetime.fromtimestamp(until).isoformat()}
            for email, until in rate_limiter.blocked_emails.items()
        ],
    }

@api_router.post("/admin/security/unblock-ip")
async def admin_unblock_ip(request: Request, user: dict = Depends(require_admin)):
    """Unblock an IP address"""
    body = await request.json()
    ip = body.get("ip")
    if ip and ip in rate_limiter.blocked_ips:
        del rate_limiter.blocked_ips[ip]
        await db.security_logs.insert_one({
            "event": "admin_unblock_ip",
            "ip": ip,
            "admin": user["email"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return {"message": f"IP {ip} unblocked"}
    return {"message": "IP not found in block list"}

@api_router.post("/admin/security/block-ip")
async def admin_block_ip(request: Request, user: dict = Depends(require_admin)):
    """Manually block an IP address"""
    body = await request.json()
    ip = body.get("ip")
    duration = body.get("duration", 3600)  # Default 1 hour
    if ip:
        rate_limiter.block_ip(ip, duration)
        await db.security_logs.insert_one({
            "event": "admin_block_ip",
            "ip": ip,
            "duration": duration,
            "admin": user["email"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return {"message": f"IP {ip} blocked for {duration}s"}
    raise HTTPException(status_code=400, detail="IP required")

@api_router.get("/admin/users")
async def admin_users(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    for u in users:
        u["_id"] = str(u["_id"])
        u["loyalty_tier"] = get_loyalty_tier(u.get("loyalty_points", 0))
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

@api_router.get("/admin/users/by-country")
async def admin_users_by_country(user: dict = Depends(require_admin)):
    """Get users grouped by country with IP-based geo detection"""
    users = await db.users.find({}, {"password_hash": 0}).to_list(1000)
    
    country_stats = defaultdict(lambda: {"count": 0, "revenue": 0, "users": []})
    
    for u in users:
        country = u.get("country", "Unknown")
        country_stats[country]["count"] += 1
        country_stats[country]["users"].append({
            "email": u["email"],
            "name": u.get("name", ""),
            "loyalty_points": u.get("loyalty_points", 0),
            "last_ip": u.get("last_ip", ""),
            "created_at": u.get("created_at", "")
        })
    
    # Calculate revenue per country from orders
    for country in country_stats:
        # Get emails for users in this country
        emails = [user_data["email"] for user_data in country_stats[country]["users"]]
        pipeline = [
            {"$match": {"email": {"$in": emails}, "status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$price"}}}
        ]
        result = await db.orders.aggregate(pipeline).to_list(1)
        country_stats[country]["revenue"] = result[0]["total"] if result else 0
        country_stats[country]["country_name"] = COUNTRY_NAMES.get(country, country)
    
    return {"countries": dict(country_stats)}

@api_router.get("/admin/analytics")
async def admin_analytics(user: dict = Depends(require_admin)):
    """Get advanced analytics for dashboard"""
    now = datetime.now(timezone.utc)
    
    # Orders by day (last 30 days)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    orders_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$substr": ["$created_at", 0, 10]},
            "count": {"$sum": 1},
            "revenue": {"$sum": "$price"}
        }},
        {"$sort": {"_id": 1}}
    ]
    orders_by_day = await db.orders.aggregate(orders_pipeline).to_list(30)
    
    # Top customers
    top_customers_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": "$email", "total_spent": {"$sum": "$price"}, "order_count": {"$sum": 1}}},
        {"$sort": {"total_spent": -1}},
        {"$limit": 10}
    ]
    top_customers = await db.orders.aggregate(top_customers_pipeline).to_list(10)
    
    # Pack popularity
    pack_popularity_pipeline = [
        {"$group": {"_id": "$pack_id", "count": {"$sum": 1}, "revenue": {"$sum": "$price"}}},
        {"$sort": {"count": -1}}
    ]
    pack_popularity = await db.orders.aggregate(pack_popularity_pipeline).to_list(10)
    
    # Conversion rate (completed / total)
    total_orders = await db.orders.count_documents({})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    conversion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
    
    return {
        "orders_by_day": orders_by_day,
        "top_customers": top_customers,
        "pack_popularity": pack_popularity,
        "conversion_rate": round(conversion_rate, 2),
    }

@api_router.get("/admin/orders")
async def admin_orders(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, status: str = "all"):
    query = {}
    if status != "all":
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    total = await db.orders.count_documents(query)
    return {"orders": orders, "total": total}

@api_router.get("/admin/links")
async def admin_links(user: dict = Depends(require_admin), status_filter: str = "all", skip: int = 0, limit: int = 50):
    query = {}
    if status_filter != "all":
        query["status"] = status_filter
    links = await db.links.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    total = await db.links.count_documents(query)
    return {"links": links, "total": total}

@api_router.post("/admin/links/import")
async def admin_import_links(req: LinkImportRequest, user: dict = Depends(require_admin)):
    imported = 0
    for url in req.links:
        url = url.strip()
        if url:
            existing = await db.links.find_one({"url": url})
            if not existing:
                await db.links.insert_one({
                    "url": url,
                    "status": "available",
                    "order_id": None,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "sold_at": None,
                })
                imported += 1
    
    return {"imported": imported, "total_available": await db.links.count_documents({"status": "available"})}

@api_router.post("/admin/links/add")
async def admin_add_link(req: LinkManualAdd, user: dict = Depends(require_admin)):
    url = req.link.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Link cannot be empty")
    existing = await db.links.find_one({"url": url})
    if existing:
        raise HTTPException(status_code=400, detail="Link already exists")
    await db.links.insert_one({
        "url": url,
        "status": "available",
        "order_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sold_at": None,
    })
    return {"message": "Link added", "total_available": await db.links.count_documents({"status": "available"})}

@api_router.delete("/admin/orders/{order_id}")
async def admin_delete_order(order_id: str, user: dict = Depends(require_admin)):
    result = await db.orders.delete_one({"order_id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

@api_router.get("/admin/users")
async def admin_users(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).skip(skip).to_list(limit)
    for u in users:
        u["_id"] = str(u["_id"])
        u["loyalty_tier"] = get_loyalty_tier(u.get("loyalty_points", 0))
    total = await db.users.count_documents({})
    return {"users": users, "total": total}

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════
# STOCK GENERATOR ENDPOINTS (Admin only)
# ═══════════════════════════════════════════════════════════

@api_router.post("/admin/generator/start")
async def generator_start(request: Request):
    """Start the stock generator with N workers"""
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    if not any(_is_admin_ip(ip) for ip in all_ips):
        raise HTTPException(status_code=403, detail="Admin only")
    
    body = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    workers = body.get("workers", 5)
    result = await stock_generator.start(workers)
    return result

@api_router.post("/admin/generator/stop")
async def generator_stop(request: Request):
    """Stop the stock generator"""
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    if not any(_is_admin_ip(ip) for ip in all_ips):
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await stock_generator.stop()
    return result

@api_router.get("/admin/generator/status")
async def generator_status(request: Request):
    """Get current generator status and stats"""
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    if not any(_is_admin_ip(ip) for ip in all_ips):
        raise HTTPException(status_code=403, detail="Admin only")
    
    status = stock_generator.get_status()
    # Add stock count
    available = await db.links.count_documents({"status": "available"})
    total = await db.links.count_documents({})
    sold = await db.links.count_documents({"status": "sold"})
    status["stock"] = {"available": available, "total": total, "sold": sold}
    return status

@api_router.post("/admin/generator/auto-restock")
async def generator_auto_restock(request: Request):
    """Configure auto-restock"""
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    if not any(_is_admin_ip(ip) for ip in all_ips):
        raise HTTPException(status_code=403, detail="Admin only")
    
    body = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    enabled = body.get("enabled", False)
    threshold = body.get("threshold", 0)
    target = body.get("target", 20)
    
    result = await stock_generator.set_auto_restock(enabled, threshold, target)
    return result

# ==================== STOCK MANAGEMENT ====================

@api_router.post("/admin/stock/nuke")
async def nuke_database(request: Request):
    """Delete ALL links from database"""
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    if not any(_is_admin_ip(ip) for ip in all_ips):
        raise HTTPException(status_code=403, detail="Admin only")
    
    deleted = await db.links.delete_many({})
    logger.warning(f"[ADMIN] Nuked database: {deleted.deleted_count} links deleted")
    return {"success": True, "message": f"{deleted.deleted_count} liens supprimés", "deleted": deleted.deleted_count}

@api_router.post("/admin/stock/recheck")
async def recheck_stock(request: Request):
    """Recheck all links and remove invalid ones"""
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    if not any(_is_admin_ip(ip) for ip in all_ips):
        raise HTTPException(status_code=403, detail="Admin only")
    
    import aiohttp
    
    async def verify_link(url: str) -> bool:
        """Verify if a Deezer link is still valid"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, allow_redirects=False, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    location = resp.headers.get("Location", "")
                    return "validate?token=" in location
        except:
            return False
    
    # Get all available links
    links_cursor = db.links.find({"status": "available"})
    links = await links_cursor.to_list(length=None)
    total_links = len(links)
    
    logger.info(f"[ADMIN] Recheck started on {total_links} links")
    
    # Process in batches to avoid timeout
    invalid_count = 0
    checked_count = 0
    batch_size = 50
    
    for i in range(0, len(links), batch_size):
        batch = links[i:i+batch_size]
        tasks = []
        
        for link_doc in batch:
            tasks.append(verify_link(link_doc["url"]))
        
        # Check batch in parallel
        results = await asyncio.gather(*tasks)
        
        # Update invalid ones
        for link_doc, is_valid in zip(batch, results):
            checked_count += 1
            if not is_valid:
                await db.links.update_one(
                    {"_id": link_doc["_id"]},
                    {"$set": {"status": "invalid"}}
                )
                invalid_count += 1
        
        logger.info(f"[ADMIN] Recheck progress: {checked_count}/{total_links} ({invalid_count} invalid)")
        
        # Stop after 100 links max to avoid long requests (can run multiple times)
        if checked_count >= 100:
            logger.info(f"[ADMIN] Recheck stopped at 100 links (run again for more)")
            break
    
    message = f"{invalid_count}/{checked_count} liens invalides retirés"
    if checked_count < total_links:
        message += f" ({total_links - checked_count} restants)"
    
    logger.info(f"[ADMIN] Recheck complete: {message}")
    return {"success": True, "message": message, "invalid": invalid_count, "checked": checked_count, "remaining": max(0, total_links - checked_count)}

@api_router.post("/admin/stock/auto-check/toggle")
async def toggle_auto_check(request: Request):
    """Toggle auto-check stock feature"""
    global AUTO_CHECK_ENABLED
    
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    if not any(_is_admin_ip(ip) for ip in all_ips):
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Toggle state
    AUTO_CHECK_ENABLED = not AUTO_CHECK_ENABLED
    status = "ON" if AUTO_CHECK_ENABLED else "OFF"
    
    logger.info(f"[ADMIN] Auto-check toggled: {status}")
    return {"success": True, "message": f"Auto-check {status}", "enabled": AUTO_CHECK_ENABLED}

@api_router.get("/admin/stock/auto-check/status")
async def get_auto_check_status(request: Request):
    """Get auto-check stock status"""
    client_ip = get_client_ip(request)
    forwarded_for = request.headers.get("x-forwarded-for", "")
    all_ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()] if forwarded_for else []
    if client_ip not in all_ips:
        all_ips.insert(0, client_ip)
    if not any(_is_admin_ip(ip) for ip in all_ips):
        raise HTTPException(status_code=403, detail="Admin only")
    
    return {"enabled": AUTO_CHECK_ENABLED}

# ==================== ADMIN PRESENCE WEBSOCKET ====================

# Store connected admin clients
admin_presence_connections = {}

@app.websocket("/ws/admin-presence")
async def admin_presence_websocket(websocket: WebSocket):
    """WebSocket for real-time admin presence (cursor, tab, etc.)"""
    await websocket.accept()
    
    # Get admin ID from query params
    admin_id = websocket.query_params.get("admin_id", f"admin_{secrets.token_hex(4)}")
    admin_ip = websocket.client.host if websocket.client else "unknown"
    
    # Verify admin IP
    if not _is_admin_ip(admin_ip):
        await websocket.close(code=1008, reason="Not admin")
        return
    
    # Store connection
    admin_presence_connections[admin_id] = {
        "websocket": websocket,
        "ip": admin_ip,
        "connected_at": datetime.now(timezone.utc).isoformat()
    }
    
    logger.info(f"[PRESENCE] Admin {admin_id} ({admin_ip}) connected. Total: {len(admin_presence_connections)}")
    
    # Send current presence to new user
    await websocket.send_json({
        "type": "init",
        "your_id": admin_id,
        "connected_admins": [
            {"id": aid, "ip": ainfo["ip"]} 
            for aid, ainfo in admin_presence_connections.items() 
            if aid != admin_id
        ]
    })
    
    try:
        while True:
            # Receive position/tab data
            data = await websocket.receive_json()
            
            # Broadcast to other admins
            for aid, ainfo in admin_presence_connections.items():
                if aid != admin_id:
                    try:
                        await ainfo["websocket"].send_json({
                            "type": "update",
                            "admin_id": admin_id,
                            "data": data
                        })
                    except:
                        pass
    
    except WebSocketDisconnect:
        logger.info(f"[PRESENCE] Admin {admin_id} disconnected")
    except Exception as e:
        logger.error(f"[PRESENCE] Error for {admin_id}: {e}")
    finally:
        # Remove from connections
        if admin_id in admin_presence_connections:
            del admin_presence_connections[admin_id]
        
        # Notify others
        for aid, ainfo in admin_presence_connections.items():
            try:
                await ainfo["websocket"].send_json({
                    "type": "disconnect",
                    "admin_id": admin_id
                })
            except:
                pass

# ==================== STARTUP ====================

# Startup
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.links.create_index("status")
    await db.links.create_index("url", unique=True)
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("email")
    await db.magic_tokens.create_index("token", unique=True)
    await db.magic_tokens.create_index("expiry", expireAfterSeconds=0)
    
    # Init stock generator with DB reference
    stock_generator.set_db(db)
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@deezlink.com").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "DeezLink2024!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "loyalty_points": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    
    # Remove any remaining demo/example links on startup
    demo_deleted = await db.links.delete_many({
        "url": {"$regex": "^https://deezer\\.com/premium/activate/"}
    })
    if demo_deleted.deleted_count > 0:
        logger.info(f"Cleaned {demo_deleted.deleted_count} demo links from database")

# ==================== GIFT CARD SYSTEM ====================
# Note: Gift card functions are now integrated at the top of this file (lines 344-447)

class GiftCardPurchase(BaseModel):
    amount: float = Field(..., gt=0, le=500)
    purchaser_email: EmailStr
    recipient_email: Optional[EmailStr] = None
    recipient_name: Optional[str] = None
    message: Optional[str] = Field(None, max_length=500)

class GiftCardValidation(BaseModel):
    code: str = Field(..., min_length=14, max_length=20)

class GiftCardApplication(BaseModel):
    code: str
    amount_to_use: float = Field(..., gt=0)
    order_id: str

@api_router.post("/gift-cards/purchase")
async def purchase_gift_card(data: GiftCardPurchase, request: Request):
    """Purchase a gift card"""
    client_ip = get_client_ip(request)
    
    # Rate limiting
    key = f"gift_card_purchase_{client_ip}"
    if rate_limiter.is_rate_limited(key, RATE_LIMITS["gift_card_purchase"]["max"], RATE_LIMITS["gift_card_purchase"]["window"]):
        raise HTTPException(status_code=429, detail="Too many purchase attempts. Please try again later.")
    rate_limiter.record_request(key)
    
    # Validate amount
    if data.amount < 5 or data.amount > 500:
        raise HTTPException(status_code=400, detail="Amount must be between 5€ and 500€")
    
    try:
        gift_card = await create_gift_card(
            amount=data.amount,
            purchaser_email=data.purchaser_email,
            recipient_email=data.recipient_email,
            recipient_name=data.recipient_name,
            message=data.message,
        )
        
        return {
            "success": True,
            "gift_card": gift_card
        }
    except Exception as e:
        logger.error(f"Gift card purchase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create gift card")

@api_router.post("/gift-cards/validate")
async def validate_gift_card_route(data: GiftCardValidation, request: Request):
    """Validate a gift card code (with brute force protection)"""
    client_ip = get_client_ip(request)
    
    # Strict rate limiting for validation to prevent brute force
    key = f"gift_card_validate_{client_ip}"
    if rate_limiter.is_rate_limited(key, RATE_LIMITS["gift_card_validate"]["max"], RATE_LIMITS["gift_card_validate"]["window"]):
        raise HTTPException(status_code=429, detail="Too many validation attempts. Please wait 10 minutes.")
    rate_limiter.record_request(key)
    
    # Validate code format
    code = data.code.strip().upper()
    if not code.startswith("DEEZ-"):
        raise HTTPException(status_code=400, detail="Invalid gift card format")
    
    try:
        result = await validate_gift_card(code, "anonymous")
        
        if not result["valid"]:
            return {"valid": False, "error": result.get("error", "Invalid code")}
        
        return {
            "valid": True,
            "balance": result["balance"]
        }
    except Exception as e:
        logger.error(f"Gift card validation error: {e}")
        return {"valid": False, "error": "Validation failed"}

@api_router.post("/gift-cards/apply")
async def apply_gift_card_route(data: GiftCardApplication, request: Request):
    """Apply gift card to order"""
    client_ip = get_client_ip(request)
    
    # Rate limiting
    key = f"gift_card_apply_{client_ip}"
    if rate_limiter.is_rate_limited(key, RATE_LIMITS["gift_card_validate"]["max"], RATE_LIMITS["gift_card_validate"]["window"]):
        raise HTTPException(status_code=429, detail="Too many attempts")
    rate_limiter.record_request(key)
    
    code_hash = hash_gift_card_code(data.code)
    
    try:
        result = await apply_gift_card_to_order(
            code_hash=code_hash,
            amount_to_use=data.amount_to_use,
            user_email="order_email",  # Should be from authenticated user
            order_id=data.order_id
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to apply gift card"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gift card application error: {e}")
        raise HTTPException(status_code=500, detail="Failed to apply gift card")

# Include API router (after all routes are defined)
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
