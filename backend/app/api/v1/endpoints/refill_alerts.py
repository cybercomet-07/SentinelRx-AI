import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.refill_alert import RefillAlertCreate, RefillAlertListResponse, RefillAlertRead
from app.services.refill_alert_service import (
    create_refill_alert,
    delete_refill_alert,
    list_refill_alerts_for_user,
    mark_refill_alert_completed,
)

router = APIRouter(prefix="/refill-alerts", tags=["Refill Alerts"])


@router.post("", response_model=RefillAlertRead, status_code=status.HTTP_201_CREATED)
def create_refill_alert_endpoint(
    payload: RefillAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    return create_refill_alert(db, current_user, payload)


@router.get("", response_model=RefillAlertListResponse)
def list_refill_alerts_endpoint(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    include_completed: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    items, total = list_refill_alerts_for_user(
        db, current_user, page=page, limit=limit, include_completed=include_completed
    )
    return RefillAlertListResponse(items=items, total=total, page=page, limit=limit)


@router.patch("/{alert_id}/complete", response_model=RefillAlertRead)
def mark_completed_endpoint(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    return mark_refill_alert_completed(db, current_user, alert_id)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_refill_alert_endpoint(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    delete_refill_alert(db, current_user, alert_id)
