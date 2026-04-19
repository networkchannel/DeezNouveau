"""
DeezLink Stock Generator — Backend Module
Reproduces the dzr.fm link checker logic as an admin-controlled service.
- Generates random 6-char codes, checks https://dzr.fm/al/{code}
- If Location header contains "validate?token=" → HIT → save link to DB
- Configurable thread count, start/stop, live stats
- Auto-restock when available stock hits 0
"""

import asyncio
import random
import string
import time
import logging
import aiohttp
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36",
]


def random_string(length=6):
    return ''.join(random.choice(string.ascii_lowercase) for _ in range(length))


def get_random_ua():
    return random.choice(USER_AGENTS)


class StockGenerator:
    """
    Async stock generator that runs dzr.fm link checking workers.
    Stores valid links directly in MongoDB.
    """

    def __init__(self):
        self.running = False
        self.workers_count = 5
        self.stats = {
            "hits": 0,
            "fails": 0,
            "retries": 0,
            "checks": 0,
        }
        self.start_time = 0
        self.session: Optional[aiohttp.ClientSession] = None
        self.tasks = []
        self._stop_event = asyncio.Event()
        self._db = None
        # Auto-restock settings
        self.auto_restock = False
        self.auto_restock_threshold = 0  # Start when stock <= this
        self.auto_restock_target = 20    # Stop when stock >= this
        self._auto_restock_task = None
        # Recent hits (for display)
        self.recent_hits = []  # Last 20 hits [{url, timestamp}]

    def set_db(self, db):
        """Set the MongoDB database reference"""
        self._db = db

    async def _check(self):
        """Check a single random dzr.fm code"""
        code = random_string()
        url = f"https://dzr.fm/al/{code}"
        headers = {"user-agent": get_random_ua()}

        try:
            async with self.session.get(url, headers=headers, allow_redirects=False, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                location = resp.headers.get("Location", "")
                text = await resp.text()
                self.stats["checks"] += 1

                # FAIL conditions
                if ("SHORLINK_NOT_FOUND" in location or
                    "error" in location or
                    "SUBSCRIPTION_ALREADY_LINKED" in location or
                    "SUBSCRIPTION_EXPIRED" in location):
                    self.stats["fails"] += 1

                # SUCCESS — found a valid activation link
                elif "validate?token=" in location:
                    self.stats["hits"] += 1
                    await self._save_hit(location)

                # RETRY — rate limited
                elif "Oops. Please try again in a few seconds." in text:
                    self.stats["retries"] += 1
                    await asyncio.sleep(2)  # Back off on rate limit

                else:
                    self.stats["fails"] += 1

        except asyncio.CancelledError:
            raise
        except Exception:
            self.stats["retries"] += 1

    async def _save_hit(self, url: str):
        """Save a valid link to the database"""
        logger.info(f"[GENERATOR] _save_hit called with URL: {url[:80]}...")
        logger.info(f"[GENERATOR] DB reference status: {self._db is not None}")
        
        if self._db is None:
            logger.error("[GENERATOR] No DB reference, cannot save hit!")
            return

        logger.info(f"[GENERATOR] About to enter try block...")
        try:
            # Check for duplicate
            logger.info(f"[GENERATOR] Checking for duplicate...")
            existing = await self._db.links.find_one({"url": url})
            logger.info(f"[GENERATOR] Duplicate check result: {existing is not None}")
            if existing:
                logger.info(f"[GENERATOR] Duplicate link skipped: {url[:50]}...")
                return

            logger.info(f"[GENERATOR] Inserting into DB...")
            result = await self._db.links.insert_one({
                "url": url,
                "status": "available",
                "order_id": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "sold_at": None,
                "source": "generator",
            })
            logger.info(f"[GENERATOR] Insert result: {result.inserted_id}")

            # Add to recent hits
            self.recent_hits.append({
                "url": url[:80] + "..." if len(url) > 80 else url,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            if len(self.recent_hits) > 20:
                self.recent_hits = self.recent_hits[-20:]

            logger.info(f"[GENERATOR] HIT saved successfully: {url[:60]}...")

        except Exception as e:
            logger.error(f"[GENERATOR] Error saving hit: {e}", exc_info=True)

    async def _worker(self):
        """Single worker that continuously checks codes"""
        while not self._stop_event.is_set():
            try:
                await self._check()
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(0.5)

    async def _auto_restock_monitor(self):
        """Monitor stock levels and auto-start/stop generator"""
        while self.auto_restock:
            try:
                if self._db:
                    available = await self._db.links.count_documents({"status": "available"})

                    if available <= self.auto_restock_threshold and not self.running:
                        logger.info(f"[AUTO-RESTOCK] Stock at {available}, starting generator...")
                        await self.start(self.workers_count)

                    elif available >= self.auto_restock_target and self.running:
                        logger.info(f"[AUTO-RESTOCK] Stock at {available}, stopping generator...")
                        await self.stop()

            except Exception as e:
                logger.error(f"[AUTO-RESTOCK] Error: {e}")

            await asyncio.sleep(30)  # Check every 30s

    async def start(self, workers: int = 5):
        """Start the generator with N workers"""
        if self.running:
            return {"status": "already_running"}

        self.workers_count = max(1, min(50, workers))  # Clamp 1-50
        self.running = True
        self.start_time = time.time()
        self.stats = {"hits": 0, "fails": 0, "retries": 0, "checks": 0}
        self._stop_event.clear()

        connector = aiohttp.TCPConnector(limit=0)
        self.session = aiohttp.ClientSession(connector=connector)

        self.tasks = [
            asyncio.create_task(self._worker())
            for _ in range(self.workers_count)
        ]

        logger.info(f"[GENERATOR] Started with {self.workers_count} workers")
        return {"status": "started", "workers": self.workers_count}

    async def stop(self):
        """Stop all workers gracefully"""
        if not self.running:
            return {"status": "already_stopped"}

        self.running = False
        self._stop_event.set()

        # Cancel tasks
        for task in self.tasks:
            task.cancel()

        # Wait for tasks to finish
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
        self.tasks = []

        # Close session
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None

        logger.info(f"[GENERATOR] Stopped. Stats: {self.stats}")
        return {"status": "stopped", "stats": self.stats.copy()}

    async def set_auto_restock(self, enabled: bool, threshold: int = 0, target: int = 20):
        """Enable/disable auto-restock"""
        self.auto_restock = enabled
        self.auto_restock_threshold = max(0, threshold)
        self.auto_restock_target = max(1, target)

        if enabled and self._auto_restock_task is None:
            self._auto_restock_task = asyncio.create_task(self._auto_restock_monitor())
            logger.info(f"[AUTO-RESTOCK] Enabled: threshold={threshold}, target={target}")
        elif not enabled and self._auto_restock_task:
            self._auto_restock_task.cancel()
            self._auto_restock_task = None
            logger.info("[AUTO-RESTOCK] Disabled")

        return {
            "auto_restock": enabled,
            "threshold": self.auto_restock_threshold,
            "target": self.auto_restock_target,
        }

    def get_status(self) -> dict:
        """Get current generator status and stats"""
        elapsed = time.time() - self.start_time if self.start_time and self.running else 0
        cpm = int(self.stats["checks"] / elapsed * 60) if elapsed > 0 else 0

        return {
            "running": self.running,
            "workers": self.workers_count,
            "stats": self.stats.copy(),
            "cpm": cpm,
            "elapsed_seconds": int(elapsed),
            "recent_hits": self.recent_hits[-10:],
            "auto_restock": {
                "enabled": self.auto_restock,
                "threshold": self.auto_restock_threshold,
                "target": self.auto_restock_target,
            },
        }


# Singleton
stock_generator = StockGenerator()
