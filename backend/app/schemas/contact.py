from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ContactCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)
    contact_details: str = Field(..., min_length=1, max_length=255)
    date_of_birth: date | None = None
    description: str = Field(..., min_length=1)


class ContactRead(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    contact_details: str
    date_of_birth: date | None
    description: str
    created_at: datetime
    user_name: str | None = None
    user_email: str | None = None

    model_config = {"from_attributes": True}


class ContactListResponse(BaseModel):
    items: list[ContactRead]
    total: int
    page: int
    limit: int
