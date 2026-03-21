"""Background task: Twilio calls at scheduled times (medicine reminders)."""
import logging
import re
import threading
import time
from datetime import date, datetime

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.call_schedule import CallSchedule

logger = logging.getLogger(__name__)
INTERVAL_SECONDS = 60
_jobs_lock = threading.Lock()
_jobs_loaded_at = 0


def _make_call(phone: str, message: str, audio_url: str | None) -> bool:
    """Place Twilio call with TTS or audio."""
    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_phone_number:
        logger.warning("Twilio not configured, skipping call")
        return False
    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        if audio_url:
            twiml = f"<Response><Play>{audio_url}</Play></Response>"
        else:
            twiml = f"<Response><Say>{message}</Say></Response>"
        client.calls.create(
            twiml=twiml,
            to=phone,
            from_=settings.twilio_phone_number,
        )
        logger.info("Call initiated to %s****", phone[:6] if len(phone) > 6 else phone)
        return True
    except Exception as e:
        logger.exception("Twilio call failed: %s", e)
        return False


def _run_due_calls() -> None:
    """Find schedules due now and make calls."""
    db = SessionLocal()
    try:
        today = date.today()
        now_str = datetime.now().strftime("%H:%M")

        schedules = (
            db.query(CallSchedule)
            .filter(
                CallSchedule.start_date <= str(today),
                CallSchedule.end_date >= str(today),
            )
            .all()
        )

        for s in schedules:
            try:
                start = datetime.strptime(s.start_date, "%Y-%m-%d").date()
                end = datetime.strptime(s.end_date, "%Y-%m-%d").date()
                if not (start <= today <= end):
                    continue

                for t in (s.times or "").split(","):
                    t = t.strip()
                    if not t or len(t) < 4:
                        continue
                    if ":" in t:
                        h, m = t.split(":", 1)
                        if len(h) == 1:
                            t = "0" + h + ":" + m
                    if t == now_str:
                        _make_call(s.phone, s.message or "Please take your medicine on time", s.audio_url)
            except Exception as e:
                logger.warning("Skipping invalid schedule %s: %s", s.id, e)
    finally:
        db.close()


def reload_jobs() -> None:
    """Signal to reload (no-op; we query DB each run)."""
    global _jobs_loaded_at
    with _jobs_lock:
        _jobs_loaded_at = time.time()


def _run_loop() -> None:
    time.sleep(90)  # Let app start
    while True:
        try:
            _run_due_calls()
        except Exception:
            logger.exception("Call schedule loop error")
        time.sleep(INTERVAL_SECONDS)


def start_call_schedule_thread() -> threading.Thread:
    """Start background thread for scheduled calls."""
    t = threading.Thread(target=_run_loop, daemon=True, name="call-schedule")
    t.start()
    logger.info("Call schedule thread started (runs every %ds)", INTERVAL_SECONDS)
    return t
