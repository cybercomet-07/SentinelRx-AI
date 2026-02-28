from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PrescriptionCreate(BaseModel):
    patient_name: str = Field(min_length=2, max_length=120)
    doctor_name: str | None = Field(default=None, max_length=120)
    prescription_text: str = Field(min_length=3)
    extra_data: dict[str, Any] | None = None


class PrescriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_name: str
    doctor_name: str | None
    prescription_text: str
    extra_data: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
