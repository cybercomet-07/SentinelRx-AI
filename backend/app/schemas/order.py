import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.order import OrderStatus


class OrderItemRead(BaseModel):
    id: uuid.UUID
    medicine_id: uuid.UUID
    medicine_name: str
    quantity: int
    unit_price: float
    line_total: float


class DeliveryAddressInput(BaseModel):
    delivery_address: str | None = None
    delivery_latitude: float | None = None
    delivery_longitude: float | None = None
    address_source: str | None = None  # live_location | manual
    payment_method: str = Field(default="cod", description="cod | upi")
    payment_receipt_url: str | None = None  # Cloudinary URL for UPI transaction screenshot


class OrderRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str | None = None
    user_email: str | None = None
    user: dict | None = None  # {name, email} for frontend fallback
    total_amount: float
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead]
    delivery_address: str | None = None
    delivery_latitude: float | None = None
    delivery_longitude: float | None = None
    address_source: str | None = None
    payment_method: str | None = None  # cod | upi
    payment_receipt_url: str | None = None  # Cloudinary URL for UPI transaction screenshot


class OrderListResponse(BaseModel):
    items: list[OrderRead]
    total: int
    page: int
    limit: int


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus
