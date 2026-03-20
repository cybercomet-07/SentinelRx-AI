import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Specialization(str, enum.Enum):
    GENERAL = "General Medicine"
    CARDIOLOGY = "Cardiology"
    DERMATOLOGY = "Dermatology"
    ORTHOPEDICS = "Orthopedics"
    PEDIATRICS = "Pediatrics"
    GYNECOLOGY = "Gynecology"
    NEUROLOGY = "Neurology"
    PSYCHIATRY = "Psychiatry"
    ENT = "ENT"
    OPHTHALMOLOGY = "Ophthalmology"
    DENTAL = "Dental"
    ONCOLOGY = "Oncology"


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    specialization = Column(String(120), nullable=False, default="General Medicine")
    license_no = Column(String(60), nullable=True)
    hospital_name = Column(String(200), nullable=True)
    hospital_address = Column(Text, nullable=True)
    consultation_fee = Column(Float, default=0.0)
    experience_years = Column(Integer, default=0)
    bio = Column(Text, nullable=True)
    languages = Column(String(300), nullable=True, default="English")
    available_days = Column(String(200), nullable=True, default="Mon,Tue,Wed,Thu,Fri")
    slot_duration_minutes = Column(Integer, default=30)
    is_available = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
