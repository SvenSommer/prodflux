"""
Background scheduler for WooCommerce orders cache refresh.
Automatically refreshes the orders cache every 5 minutes.
"""
import threading
import time
import logging
import os

logger = logging.getLogger(__name__)

# Scheduler settings
CACHE_REFRESH_INTERVAL = 60 * 5  # 5 minutes in seconds

# Global scheduler instance
_scheduler_instance = None
_scheduler_lock = threading.Lock()

# Track last refresh time and status
_last_refresh_time = None
_refresh_in_progress = False
_refresh_lock = threading.Lock()


class WooCommerceCacheScheduler:
    """
    Background scheduler that periodically refreshes WooCommerce orders cache.
    Uses a daemon thread to run in the background.
    """

    def __init__(self, interval: int = CACHE_REFRESH_INTERVAL):
        self.interval = interval
        self._stop_event = threading.Event()
        self._thread = None
        self._running = False
        self._refresh_requested = threading.Event()

    def start(self):
        """Start the background cache refresh scheduler."""
        if self._running:
            logger.warning("WooCommerce cache scheduler already running")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        self._running = True
        logger.info(
            f"WooCommerce cache scheduler started (interval: {self.interval}s)"
        )

    def stop(self):
        """Stop the background cache refresh scheduler."""
        if not self._running:
            return

        self._stop_event.set()
        self._refresh_requested.set()  # Wake up if waiting
        if self._thread:
            self._thread.join(timeout=5)
        self._running = False
        logger.info("WooCommerce cache scheduler stopped")

    def trigger_refresh(self):
        """Trigger an immediate cache refresh (non-blocking)."""
        self._refresh_requested.set()
        logger.info("WooCommerce cache refresh triggered")

    def _run(self):
        """Main loop for the background scheduler."""
        # Immediately refresh cache on startup
        logger.info("Starting initial WooCommerce cache load...")
        try:
            self._refresh_cache()
        except Exception as e:
            logger.error(f"Error during initial cache load: {e}")

        while not self._stop_event.is_set():
            # Wait for interval or manual trigger
            triggered = self._refresh_requested.wait(timeout=self.interval)

            if self._stop_event.is_set():
                break

            # Clear the trigger flag
            if triggered:
                self._refresh_requested.clear()

            try:
                self._refresh_cache()
            except Exception as e:
                logger.error(f"Error refreshing WooCommerce cache: {e}")

    def _refresh_cache(self):
        """Refresh all WooCommerce orders caches."""
        from django.core.cache import cache
        from .views import (
            get_wcapi,
            get_cache_key,
            get_cache_version,
            CACHE_TIMEOUT_ORDERS,
            CACHE_KEY_PREFIX
        )
        
        logger.info("Starting WooCommerce cache refresh...")
        start_time = time.time()
        
        try:
            wcapi = get_wcapi()
            cache_version = get_cache_version()
            
            # Refresh orders for different status groups
            status_groups = {
                "active": ["processing", "pending", "on-hold"],
                "completed": ["completed"],
                "other": ["cancelled", "refunded", "failed", "checkout-draft", "trash"]
            }
            
            total_orders = 0
            
            for group_name, statuses in status_groups.items():
                all_orders = []
                
                for status in statuses:
                    page = 1
                    per_page = 100
                    
                    while True:
                        params = {"status": status, "per_page": per_page, "page": page}
                        response = wcapi.get("orders", params=params)
                        
                        if response.status_code != 200:
                            logger.warning(
                                f"Failed to fetch orders for status '{status}' "
                                f"(page {page}): {response.status_code}"
                            )
                            break
                        
                        orders_page = response.json()
                        all_orders.extend(orders_page)
                        
                        total_pages = int(response.headers.get('X-WP-TotalPages', 1))
                        
                        if page >= total_pages:
                            break
                        
                        page += 1
                
                # Cache the orders for this status group
                cache_key = get_cache_key(f"orders_v{cache_version}", statuses)
                cache.set(cache_key, all_orders, CACHE_TIMEOUT_ORDERS)
                total_orders += len(all_orders)
                
                logger.debug(f"Cached {len(all_orders)} orders for group '{group_name}'")
            
            # Also refresh order stats
            self._refresh_order_stats(wcapi, cache_version)
            
            elapsed = time.time() - start_time
            logger.info(
                f"WooCommerce cache refresh completed: {total_orders} orders "
                f"in {elapsed:.2f}s"
            )
            
        except Exception as e:
            logger.error(f"Error during cache refresh: {e}")
            raise
    
    def _refresh_order_stats(self, wcapi, cache_version):
        """Refresh order statistics cache."""
        from django.core.cache import cache
        from .views import CACHE_TIMEOUT_ORDERS, CACHE_KEY_PREFIX
        
        statuses = [
            "processing", "pending", "on-hold",
            "completed", "cancelled", "refunded", "failed",
            "checkout-draft", "trash"
        ]
        
        stats = {
            "total": 0,
            "by_status": {},
            "active": 0,
            "completed": 0,
            "other": 0
        }
        
        for status in statuses:
            try:
                response = wcapi.get("orders", params={"status": status, "per_page": 1})
                if response.status_code == 200:
                    count = int(response.headers.get('X-WP-Total', 0))
                    stats["by_status"][status] = count
                    stats["total"] += count
                    
                    if status in ["processing", "pending", "on-hold"]:
                        stats["active"] += count
                    elif status == "completed":
                        stats["completed"] += count
                    else:
                        stats["other"] += count
            except Exception as e:
                logger.warning(f"Failed to get count for status '{status}': {e}")
        
        cache_key = f"{CACHE_KEY_PREFIX}order_stats_v{cache_version}"
        cache.set(cache_key, stats, CACHE_TIMEOUT_ORDERS)
        
        logger.debug(f"Cached order stats: {stats['total']} total orders")


def get_scheduler() -> WooCommerceCacheScheduler:
    """Get the global scheduler instance (singleton)."""
    global _scheduler_instance
    
    with _scheduler_lock:
        if _scheduler_instance is None:
            _scheduler_instance = WooCommerceCacheScheduler()
        return _scheduler_instance


def trigger_cache_refresh():
    """
    Trigger an immediate background cache refresh.
    Non-blocking - returns immediately while refresh happens in background.
    """
    scheduler = get_scheduler()
    if scheduler._running:
        scheduler.trigger_refresh()
        return True
    return False


def start_cache_scheduler():
    """
    Start the WooCommerce cache scheduler.
    Should be called once at application startup.
    """
    # Don't start scheduler in management commands
    # Check if we're in a web server context
    run_main = os.environ.get('RUN_MAIN') == 'true'
    gunicorn_child = os.environ.get('GUNICORN_CHILD')
    server_sw = os.environ.get('SERVER_SOFTWARE', '')

    if run_main or gunicorn_child or 'gunicorn' in server_sw:
        scheduler = get_scheduler()
        scheduler.start()
        return scheduler

    return None


def stop_cache_scheduler():
    """Stop the WooCommerce cache scheduler if running."""
    global _scheduler_instance
    
    with _scheduler_lock:
        if _scheduler_instance is not None:
            _scheduler_instance.stop()
            _scheduler_instance = None
