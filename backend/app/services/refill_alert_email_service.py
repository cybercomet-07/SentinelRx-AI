"""Send refill alert emails via Brevo (confirmation on create, reminder 5 days before)."""
import logging
from datetime import date, datetime, timedelta

import requests
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.medicine import Medicine
from app.models.refill_alert import RefillAlert
from app.models.user import User

logger = logging.getLogger(__name__)
BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    settings = get_settings()
    if not settings.brevo_api_key:
        logger.warning("BREVO_API_KEY not set, skipping refill email")
        return False
    headers = {
        "accept": "application/json",
        "api-key": settings.brevo_api_key,
        "content-type": "application/json",
    }
    payload = {
        "sender": {"name": "SentinelRx-AI", "email": "ainpharmacyofficial@gmail.com"},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_content,
    }
    try:
        r = requests.post(BREVO_URL, json=payload, headers=headers, timeout=10)
        if r.status_code != 201:
            logger.warning("Brevo refill email failed: %s %s", r.status_code, r.text)
            return False
        return True
    except Exception as e:
        logger.exception("Refill email send failed: %s", e)
        return False


def try_send_refill_confirmation(user_name: str, user_email: str, medicine_name: str, refill_date: str) -> bool:
    """Send email when user creates a refill alert."""
    html = f"""
    <body style="font-family:Arial;">
    <h2>Refill Alert Saved</h2>
    <p>Dear {user_name},</p>
    <p>Your refill alert has been saved successfully.</p>
    <p><strong>Medicine:</strong> {medicine_name}</p>
    <p><strong>Suggested refill date:</strong> {refill_date}</p>
    <p>We will remind you 5 days before this date.</p>
    <br>
    <p>Regards,<br>SentinelRx-AI Team</p>
    </body>
    """
    return _send_email(
        to_email=user_email,
        subject=f"Refill alert saved – {medicine_name} | SentinelRx-AI",
        html_content=html,
    )


def try_send_refill_reminder(user_name: str, user_email: str, medicine_name: str, refill_date: str) -> bool:
    """Send email 5 days before refill date."""
    html = f"""
    <body style="font-family:Arial;">
    <h2>Refill Reminder</h2>
    <p>Dear {user_name},</p>
    <p>This is a friendly reminder that your refill date for <strong>{medicine_name}</strong> is coming up in 5 days.</p>
    <p><strong>Suggested refill date:</strong> {refill_date}</p>
    <p>Don't forget to order your medicine in time!</p>
    <br>
    <p>Regards,<br>SentinelRx-AI Team</p>
    </body>
    """
    return _send_email(
        to_email=user_email,
        subject=f"Refill reminder – {medicine_name} in 5 days | SentinelRx-AI",
        html_content=html,
    )


def run_refill_reminders_5_days(db: Session) -> int:
    """
    Find refill alerts due in exactly 5 days, send reminder emails, mark reminder_sent_at.
    Returns count of emails sent.
    """
    target_date = date.today() + timedelta(days=5)
    alerts = (
        db.query(RefillAlert)
        .filter(
            RefillAlert.suggested_refill_date == target_date,
            RefillAlert.is_completed.is_(False),
            RefillAlert.reminder_sent_at.is_(None),
        )
        .all()
    )
    sent = 0
    for alert in alerts:
        user = db.query(User).filter(User.id == alert.user_id).first()
        if not user or not user.email:
            continue
        medicine = db.query(Medicine).filter(Medicine.id == alert.medicine_id).first()
        medicine_name = medicine.name if medicine else "Unknown"
        if try_send_refill_reminder(
            user_name=user.name or "User",
            user_email=user.email,
            medicine_name=medicine_name,
            refill_date=str(alert.suggested_refill_date),
        ):
            alert.reminder_sent_at = datetime.utcnow()
            sent += 1
    if sent:
        db.commit()
    return sent
