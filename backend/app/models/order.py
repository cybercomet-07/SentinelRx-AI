import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"), nullable=False, default=OrderStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    delivery_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    delivery_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    delivery_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    address_source: Mapped[str | None] = mapped_column(String(20), nullable=True)  # live_location | manual
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True, default="cod")  # cod | upi
    payment_receipt_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Cloudinary URL for UPI transaction screenshot
    user: Mapped["User"] = relationship("User", lazy="joined")
