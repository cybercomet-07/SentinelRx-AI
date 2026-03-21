"""Call schedule model for Twilio medicine reminder calls."""
import uuid

from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class CallSchedule(Base):
    __tablename__ = "call_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # Optional: link to SentinelRx user
    phone = Column(String(20), nullable=False)
    times = Column(String(100), nullable=False)  # Comma-separated: "09:00,14:00,20:00"
    message = Column(Text, nullable=True, default="Please take your medicine on time")
    audio_url = Column(String(500), nullable=True)
    start_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(10), nullable=False)   # YYYY-MM-DD
