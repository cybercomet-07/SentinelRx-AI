import uuid

from pydantic import BaseModel, Field


class CartAddRequest(BaseModel):
    medicine_id: uuid.UUID
    quantity: int = Field(ge=1)


class CartItemRead(BaseModel):
    id: uuid.UUID
    medicine_id: uuid.UUID
    medicine_name: str
    medicine_price: float
    quantity: int
    line_total: float


class CartReadResponse(BaseModel):
    items: list[CartItemRead]
    total_items: int
    total_amount: float
