import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MedicineIndication(Base):
    """Keyword-based uses and dosage for each medicine. Used for symptom-to-medicine AI recommendations."""

    __tablename__ = "medicine_indications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medicine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True, unique=True
    )
    keywords: Mapped[str] = mapped_column(Text, nullable=False)  # comma-separated for search
    dosage_instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    safe_limit: Mapped[str | None] = mapped_column(Text, nullable=True)
    requires_prescription: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
