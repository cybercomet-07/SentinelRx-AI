import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderItemRead(BaseModel):
    id: uuid.UUID
    medicine_id: uuid.UUID
    medicine_name: str
    quantity: int
    unit_price: float
    line_total: float


class OrderRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    total_amount: float
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead]


class OrderListResponse(BaseModel):
    items: list[OrderRead]
    total: int
    page: int
    limit: int


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus
