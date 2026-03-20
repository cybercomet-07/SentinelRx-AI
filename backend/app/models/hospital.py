import enum
import uuid
from datetime import datetime, date

from sqlalchemy import Column, String, Text, Boolean, Integer, Float, Date, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class BedType(str, enum.Enum):
    GENERAL = "General"
    ICU = "ICU"
    PRIVATE = "Private"
    SEMI_PRIVATE = "Semi-Private"
    EMERGENCY = "Emergency"


class BedStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"
    RESERVED = "RESERVED"


class AdmissionStatus(str, enum.Enum):
    ADMITTED = "ADMITTED"
    DISCHARGED = "DISCHARGED"
    TRANSFERRED = "TRANSFERRED"


class HospitalBed(Base):
    __tablename__ = "hospital_beds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    bed_number = Column(String(20), nullable=False)
    ward = Column(String(100), nullable=False)
    bed_type = Column(Enum(BedType), default=BedType.GENERAL, nullable=False)
    status = Column(Enum(BedStatus), default=BedStatus.AVAILABLE, nullable=False)
    floor = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    hospital_admin = relationship("User", foreign_keys=[hospital_admin_id])
    admissions = relationship("HospitalAdmission", back_populates="bed")


class HospitalAdmission(Base):
    __tablename__ = "hospital_admissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    bed_id = Column(UUID(as_uuid=True), ForeignKey("hospital_beds.id"), nullable=True)
    patient_name = Column(String(200), nullable=False)
    patient_phone = Column(String(20), nullable=True)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String(20), nullable=True)
    diagnosis = Column(Text, nullable=True)
    admit_date = Column(Date, nullable=False)
    discharge_date = Column(Date, nullable=True)
    status = Column(Enum(AdmissionStatus), default=AdmissionStatus.ADMITTED, nullable=False)
    total_bill = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    hospital_admin = relationship("User", foreign_keys=[hospital_admin_id])
    bed = relationship("HospitalBed", back_populates="admissions")
