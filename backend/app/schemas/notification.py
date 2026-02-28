import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationRead(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    typ: NotificationType
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationRead]
    total: int
    page: int
    limit: int
