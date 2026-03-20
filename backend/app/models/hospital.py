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


class HospitalMedicine(Base):
    __tablename__ = "hospital_medicines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    unit = Column(String(20), default="tablets", nullable=False)
    price = Column(Float, default=0.0)
    expiry_date = Column(Date, nullable=True)
    manufacturer = Column(String(200), nullable=True)
    reorder_level = Column(Integer, default=10)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    hospital_admin = relationship("User", foreign_keys=[hospital_admin_id])


class PatientVisit(Base):
    __tablename__ = "hospital_patient_visits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    patient_name = Column(String(200), nullable=False)
    patient_phone = Column(String(20), nullable=True)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String(20), nullable=True)
    visit_date = Column(Date, nullable=False, default=date.today)
    diagnosis = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    prescription_notes = Column(Text, nullable=True)
    next_visit_date = Column(Date, nullable=True)
    next_visit_notes = Column(String(500), nullable=True)
    govt_scheme = Column(String(300), nullable=True)
    status = Column(String(50), default="VISITED", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    hospital_admin = relationship("User", foreign_keys=[hospital_admin_id])


class HospitalBill(Base):
    __tablename__ = "hospital_bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    patient_name = Column(String(200), nullable=False)
    patient_phone = Column(String(20), nullable=True)
    services_description = Column(Text, nullable=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    amount_paid = Column(Float, default=0.0, nullable=False)
    payment_method = Column(String(20), default="COD", nullable=False)
    payment_status = Column(String(20), default="PENDING", nullable=False)
    qr_image_url = Column(Text, nullable=True)
    govt_scheme = Column(String(300), nullable=True)
    bill_date = Column(Date, nullable=False, default=date.today)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    hospital_admin = relationship("User", foreign_keys=[hospital_admin_id])
