import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RefillAlert(Base):
    __tablename__ = "refill_alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    medicine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    last_purchase_date: Mapped[date] = mapped_column(Date, nullable=False)
    suggested_refill_date: Mapped[date] = mapped_column(Date, nullable=False)
    reminder_time: Mapped[str | None] = mapped_column(String(5), nullable=True)  # "09:00" for 9 AM call
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    call_reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
