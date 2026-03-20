"""Send refill reminder phone calls via Twilio."""
import logging
import re
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

# Reminder times are stored as IST (India). Server may run in UTC.
IST_OFFSET = timedelta(hours=5, minutes=30)

from app.core.config import get_settings
from app.models.medicine import Medicine
from app.models.refill_alert import RefillAlert
from app.models.user import User

logger = logging.getLogger(__name__)


def _format_phone(phone: str | None) -> str | None:
    """Format Indian 10-digit to E.164, or return as-is if already +prefixed."""
    if not phone or not str(phone).strip():
        return None
    s = str(phone).strip().replace(" ", "")
    if re.fullmatch(r"\d{10}", s):
        return "+91" + s
    if s.startswith("+"):
        return s
    return None


def make_refill_call(phone: str, message: str) -> bool:
    """Place outbound Twilio call with TTS message. Returns True if initiated."""
    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_phone_number:
        logger.warning("Twilio not configured, skipping refill call")
        return False
    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        twiml = f"<Response><Say>{message}</Say></Response>"
        client.calls.create(
            twiml=twiml,
            to=phone,
            from_=settings.twilio_phone_number,
        )
        logger.info("Refill call initiated to %s", phone[:6] + "****")
        return True
    except Exception as e:
        logger.exception("Twilio call failed: %s", e)
        return False


def run_refill_call_reminders(db: Session) -> int:
    """
    Find refill alerts due TODAY at their reminder_time (within current minute window).
    reminder_time is interpreted as IST (India). Call user's phone, mark call_reminder_sent_at.
    Returns count of calls initiated.
    """
    now_utc = datetime.utcnow()
    now_ist = now_utc + IST_OFFSET
    current_time_str = now_ist.strftime("%H:%M")
    today = date.today()

    alerts = (
        db.query(RefillAlert)
        .filter(
            RefillAlert.suggested_refill_date == today,
            RefillAlert.is_completed.is_(False),
            RefillAlert.call_reminder_sent_at.is_(None),
            RefillAlert.reminder_time.isnot(None),
        )
        .all()
    )
    sent = 0
    for alert in alerts:
        rt = (alert.reminder_time or "").strip()
        if not rt or len(rt) < 4:
            continue
        # Normalize "9:00" -> "09:00" for comparison
        if ":" in rt:
            h, m = rt.split(":", 1)
            if len(h) == 1:
                rt = "0" + h + ":" + m
        if rt != current_time_str:
            continue
        user = db.query(User).filter(User.id == alert.user_id).first()
        if not user:
            continue
        phone = _format_phone(user.phone)
        if not phone:
            logger.warning("No phone for user %s, skipping call", user.id)
            continue
        medicine = db.query(Medicine).filter(Medicine.id == alert.medicine_id).first()
        medicine_name = medicine.name if medicine else "your medicine"
        message = f"Hello, this is SentinelRx. Reminder: Please take {medicine_name} on time. Thank you."
        if make_refill_call(phone, message):
            alert.call_reminder_sent_at = now_utc
            sent += 1
    if sent:
        db.commit()
    return sent
