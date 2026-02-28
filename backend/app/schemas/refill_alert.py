import uuid
from datetime import date

from pydantic import BaseModel, Field


class RefillAlertCreate(BaseModel):
    medicine_id: uuid.UUID
    last_purchase_date: date
    suggested_refill_date: date = Field(..., description="When to remind the user to refill")


class RefillAlertRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    medicine_id: uuid.UUID
    medicine_name: str
    last_purchase_date: date
    suggested_refill_date: date
    is_completed: bool
    is_due: bool


class RefillAlertListResponse(BaseModel):
    items: list[RefillAlertRead]
    total: int
    page: int
    limit: int
