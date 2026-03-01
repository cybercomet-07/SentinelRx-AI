from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PrescriptionCreate(BaseModel):
    patient_name: str = Field(min_length=2, max_length=120)
    doctor_name: str | None = Field(default=None, max_length=120)
    prescription_text: str = Field(min_length=3)
    image_url: str | None = None  # Cloudinary URL (upload separately first)
    extra_data: dict[str, Any] | None = None


class PrescriptionMedicineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    medicine_id: UUID
    quantity: int
    medicine_name: str = ""
    medicine_price: float = 0.0

    @classmethod
    def from_pm(cls, pm) -> "PrescriptionMedicineRead":
        return cls(
            id=pm.id,
            medicine_id=pm.medicine_id,
            quantity=pm.quantity,
            medicine_name=pm.medicine.name if pm.medicine else "",
            medicine_price=pm.medicine.price if pm.medicine else 0.0,
        )


class PrescriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: UUID | None
    patient_name: str
    doctor_name: str | None
    prescription_text: str
    image_url: str | None
    admin_reply: str | None
    extra_data: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    recommended_medicines: list[PrescriptionMedicineRead] = []

    @classmethod
    def from_prescription(cls, p) -> "PrescriptionRead":
        return cls(
            id=p.id,
            user_id=p.user_id,
            patient_name=p.patient_name,
            doctor_name=p.doctor_name,
            prescription_text=p.prescription_text,
            image_url=p.image_url or (p.extra_data.get("image") if p.extra_data and isinstance(p.extra_data.get("image"), str) else None),
            admin_reply=p.admin_reply,
            extra_data=p.extra_data,
            created_at=p.created_at,
            updated_at=p.updated_at,
            recommended_medicines=[PrescriptionMedicineRead.from_pm(pm) for pm in (p.recommended_medicines or [])],
        )


class PrescriptionMedicineInput(BaseModel):
    medicine_id: UUID
    quantity: int = 1


class PrescriptionAdminUpdate(BaseModel):
    admin_reply: str | None = None
    recommended_medicines: list[PrescriptionMedicineInput] | None = None
