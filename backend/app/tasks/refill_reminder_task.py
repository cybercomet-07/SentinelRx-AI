"""Background task: send refill reminder emails 5 days before due date."""
import logging
import threading
import time

from app.db.session import SessionLocal
from app.services.refill_alert_email_service import run_refill_reminders_5_days

logger = logging.getLogger(__name__)
INTERVAL_SECONDS = 86400  # 24 hours


def _run_once() -> None:
    db = SessionLocal()
    try:
        sent = run_refill_reminders_5_days(db)
        if sent:
            logger.info("Refill reminder emails sent: %d", sent)
    except Exception:
        logger.exception("Refill reminder task failed")
    finally:
        db.close()


def start_refill_reminder_thread() -> threading.Thread:
    """Start a background thread that runs refill reminders every 24 hours."""

    def loop() -> None:
        # Run once after 60 seconds (let app fully start)
        time.sleep(60)
        while True:
            try:
                _run_once()
            except Exception:
                logger.exception("Refill reminder loop error")
            time.sleep(INTERVAL_SECONDS)

    t = threading.Thread(target=loop, daemon=True, name="refill-reminder")
    t.start()
    logger.info("Refill reminder background thread started (runs every 24h)")
    return t
