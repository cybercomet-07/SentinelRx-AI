import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Date, Time, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class AppointmentType(str, enum.Enum):
    IN_PERSON = "In Person"
    VIDEO = "Video"
    PHONE = "Phone"


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    appointment_date = Column(Date, nullable=False)
    time_slot = Column(String(20), nullable=False)
    appointment_type = Column(Enum(AppointmentType), default=AppointmentType.IN_PERSON)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.PENDING, nullable=False)
    symptoms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    prescription_issued = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    doctor = relationship("User", foreign_keys=[doctor_id])
    patient = relationship("User", foreign_keys=[patient_id])
