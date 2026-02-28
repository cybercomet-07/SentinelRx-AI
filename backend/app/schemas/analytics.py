import uuid

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrdersByStatusItem(BaseModel):
    status: OrderStatus
    count: int


class TopMedicineItem(BaseModel):
    medicine_id: uuid.UUID
    medicine_name: str
    units_sold: int
    revenue: float


class AnalyticsSummary(BaseModel):
    total_orders: int
    total_revenue: float
    total_users: int
    low_stock_medicines_count: int
    orders_by_status: list[OrdersByStatusItem]
    top_medicines: list[TopMedicineItem]
