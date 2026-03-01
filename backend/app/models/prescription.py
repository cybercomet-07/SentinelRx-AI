import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    patient_name: Mapped[str] = mapped_column(String(120), nullable=False)
    doctor_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    prescription_text: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Cloudinary URL
    admin_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    recommended_medicines: Mapped[list["PrescriptionMedicine"]] = relationship(
        "PrescriptionMedicine", back_populates="prescription", cascade="all, delete-orphan"
    )


class PrescriptionMedicine(Base):
    """Admin-recommended medicines for a prescription. User can buy these."""
    __tablename__ = "prescription_medicines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prescription_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    medicine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    prescription: Mapped["Prescription"] = relationship("Prescription", back_populates="recommended_medicines")
    medicine: Mapped["Medicine"] = relationship("Medicine", lazy="joined")
