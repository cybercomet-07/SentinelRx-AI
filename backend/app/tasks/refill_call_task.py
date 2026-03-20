"""Background task: make Twilio refill reminder calls at scheduled time."""
import logging
import threading
import time

from app.db.session import SessionLocal
from app.services.refill_alert_call_service import run_refill_call_reminders

logger = logging.getLogger(__name__)
INTERVAL_SECONDS = 60  # Run every minute to catch exact reminder times


def _run_once() -> None:
    db = SessionLocal()
    try:
        sent = run_refill_call_reminders(db)
        if sent:
            logger.info("Refill reminder calls initiated: %d", sent)
    except Exception:
        logger.exception("Refill call task failed")
    finally:
        db.close()


def start_refill_call_thread() -> threading.Thread:
    """Start background thread that checks for due refill calls every minute."""

    def loop() -> None:
        time.sleep(90)  # Let app start, after email reminder thread
        while True:
            try:
                _run_once()
            except Exception:
                logger.exception("Refill call loop error")
            time.sleep(INTERVAL_SECONDS)

    t = threading.Thread(target=loop, daemon=True, name="refill-call")
    t.start()
    logger.info("Refill call background thread started (runs every 1 min)")
    return t
