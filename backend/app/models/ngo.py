import enum
import uuid
from datetime import datetime, date

from sqlalchemy import Column, String, Text, Boolean, Integer, Float, Date, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class BeneficiaryStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"


class CampStatus(str, enum.Enum):
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class NGOBeneficiary(Base):
    __tablename__ = "ngo_beneficiaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    health_condition = Column(String(500), nullable=True)
    scheme_eligible = Column(Boolean, default=False)
    scheme_names = Column(Text, nullable=True)
    status = Column(Enum(BeneficiaryStatus), default=BeneficiaryStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ngo = relationship("User", foreign_keys=[ngo_id])


class NGOBloodCamp(Base):
    __tablename__ = "ngo_blood_camps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    date = Column(Date, nullable=False)
    location = Column(Text, nullable=False)
    target_units = Column(Integer, default=50)
    collected_units = Column(Integer, default=0)
    volunteers = Column(Integer, default=0)
    status = Column(Enum(CampStatus), default=CampStatus.UPCOMING, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ngo = relationship("User", foreign_keys=[ngo_id])


class NGODonationDrive(Base):
    __tablename__ = "ngo_donation_drives"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    target_amount = Column(Float, default=0.0)
    raised_amount = Column(Float, default=0.0)
    status = Column(Enum(CampStatus), default=CampStatus.UPCOMING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ngo = relationship("User", foreign_keys=[ngo_id])
