import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.medicine import Medicine
from app.models.refill_alert import RefillAlert
from app.models.user import User
from app.schemas.refill_alert import RefillAlertCreate, RefillAlertRead
from app.services.refill_alert_email_service import try_send_refill_confirmation


def _build_refill_read(alert: RefillAlert, medicine_name: str) -> RefillAlertRead:
    today = date.today()
    return RefillAlertRead(
        id=alert.id,
        user_id=alert.user_id,
        medicine_id=alert.medicine_id,
        medicine_name=medicine_name,
        last_purchase_date=alert.last_purchase_date,
        suggested_refill_date=alert.suggested_refill_date,
        is_completed=alert.is_completed,
        is_due=not alert.is_completed and alert.suggested_refill_date <= today,
    )


def create_refill_alert(db: Session, user: User, payload: RefillAlertCreate) -> RefillAlertRead:
    if payload.suggested_refill_date < payload.last_purchase_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="suggested_refill_date must be on or after last_purchase_date",
        )
    medicine = db.query(Medicine).filter(Medicine.id == payload.medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")

    alert = RefillAlert(
        user_id=user.id,
        medicine_id=payload.medicine_id,
        last_purchase_date=payload.last_purchase_date,
        suggested_refill_date=payload.suggested_refill_date,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    if user.email:
        try_send_refill_confirmation(
            user_name=user.name or "User",
            user_email=user.email,
            medicine_name=medicine.name,
            refill_date=str(payload.suggested_refill_date),
        )
    return _build_refill_read(alert, medicine.name)


def list_refill_alerts_for_user(
    db: Session,
    user: User,
    *,
    page: int = 1,
    limit: int = 20,
    include_completed: bool = False,
) -> tuple[list[RefillAlertRead], int]:
    query = db.query(RefillAlert).filter(RefillAlert.user_id == user.id)
    if not include_completed:
        query = query.filter(RefillAlert.is_completed.is_(False))
    total = query.count()
    alerts = (
        query.order_by(RefillAlert.suggested_refill_date.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    medicine_ids = {a.medicine_id for a in alerts}
    medicines = db.query(Medicine).filter(Medicine.id.in_(medicine_ids)).all()
    medicine_map = {m.id: m.name for m in medicines}
    items = [_build_refill_read(a, medicine_map.get(a.medicine_id, "Unknown")) for a in alerts]
    return items, total


def mark_refill_alert_completed(db: Session, user: User, alert_id: uuid.UUID) -> RefillAlertRead:
    alert = (
        db.query(RefillAlert)
        .filter(RefillAlert.id == alert_id, RefillAlert.user_id == user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refill alert not found")
    medicine = db.query(Medicine).filter(Medicine.id == alert.medicine_id).first()
    medicine_name = medicine.name if medicine else "Unknown"
    alert.is_completed = True
    db.commit()
    db.refresh(alert)
    return _build_refill_read(alert, medicine_name)


def delete_refill_alert(db: Session, user: User, alert_id: uuid.UUID) -> None:
    alert = (
        db.query(RefillAlert)
        .filter(RefillAlert.id == alert_id, RefillAlert.user_id == user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refill alert not found")
    db.delete(alert)
    db.commit()
