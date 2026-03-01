import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class MedicineCreate(BaseModel):
    product_id: str | None = Field(default=None, max_length=50)
    pin: str | None = Field(default=None, max_length=20)
    name: str = Field(min_length=2, max_length=180)
    description: str | None = None
    price: float = Field(ge=0)
    quantity: int = Field(ge=0)
    category: str | None = Field(default=None, max_length=100)
    image_url: str | None = Field(default=None, max_length=500)
    low_stock_threshold: int = Field(default=10, ge=0)
    manufacturing_date: date | None = None
    expiry_date: date | None = None


class MedicineUpdate(BaseModel):
    product_id: str | None = Field(default=None, max_length=50)
    pin: str | None = Field(default=None, max_length=20)
    name: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = None
    price: float | None = Field(default=None, ge=0)
    quantity: int | None = Field(default=None, ge=0)
    category: str | None = Field(default=None, max_length=100)
    image_url: str | None = Field(default=None, max_length=500)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    manufacturing_date: date | None = None
    expiry_date: date | None = None


class MedicineStockUpdate(BaseModel):
    quantity: int = Field(ge=0)


class MedicineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: str | None
    pin: str | None
    name: str
    description: str | None
    price: float
    quantity: int
    category: str | None
    image_url: str | None
    low_stock_threshold: int
    manufacturing_date: date | None
    expiry_date: date | None
    created_at: datetime
    updated_at: datetime


class MedicineListResponse(BaseModel):
    items: list[MedicineRead]
    total: int
    page: int
    limit: int
