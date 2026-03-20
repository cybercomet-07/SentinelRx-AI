import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.notification import NotificationListResponse, NotificationRead
from app.services.notification_service import list_notifications_for_user, mark_notification_read

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications_endpoint(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.NGO)),
):
    jwt_role = getattr(current_user, "_jwt_role", current_user.role)
    return list_notifications_for_user(db, current_user, page, limit, jwt_role=jwt_role)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read_endpoint(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN, UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.NGO)),
):
    return mark_notification_read(db, current_user, notification_id)
