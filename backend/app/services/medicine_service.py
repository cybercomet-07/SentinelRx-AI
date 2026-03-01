import uuid

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.medicine import Medicine
from app.schemas.medicine import MedicineCreate, MedicineUpdate
from app.services.notification_service import notify_low_stock_to_admins


def get_medicine_or_404(db: Session, medicine_id: uuid.UUID) -> Medicine:
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
    return medicine


def list_medicines(
    db: Session,
    *,
    q: str | None,
    category: str | None,
    low_stock_only: bool,
    page: int,
    limit: int,
) -> tuple[list[Medicine], int]:
    query = db.query(Medicine)

    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter(Medicine.name.ilike(pattern))
    if category:
        query = query.filter(func.lower(Medicine.category) == category.strip().lower())
    if low_stock_only:
        query = query.filter(Medicine.quantity <= Medicine.low_stock_threshold)

    total = query.count()
    items = (
        query.order_by(Medicine.name.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return items, total


def create_medicine(db: Session, payload: MedicineCreate) -> Medicine:
    duplicate = (
        db.query(Medicine)
        .filter(func.lower(Medicine.name) == payload.name.strip().lower())
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Medicine already exists")

    medicine = Medicine(
        product_id=payload.product_id,
        pin=payload.pin,
        name=payload.name.strip(),
        description=payload.description,
        price=payload.price,
        quantity=payload.quantity,
        category=payload.category,
        image_url=payload.image_url,
        low_stock_threshold=payload.low_stock_threshold,
        manufacturing_date=payload.manufacturing_date,
        expiry_date=payload.expiry_date,
    )
    db.add(medicine)
    if medicine.quantity <= medicine.low_stock_threshold:
        notify_low_stock_to_admins(
            db,
            medicine_name=medicine.name,
            quantity=medicine.quantity,
            threshold=medicine.low_stock_threshold,
        )
    db.commit()
    db.refresh(medicine)
    return medicine


def update_medicine(db: Session, medicine: Medicine, payload: MedicineUpdate) -> Medicine:
    was_low_stock = medicine.quantity <= medicine.low_stock_threshold
    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates and updates["name"] is not None:
        normalized_name = updates["name"].strip()
        duplicate = (
            db.query(Medicine)
            .filter(func.lower(Medicine.name) == normalized_name.lower(), Medicine.id != medicine.id)
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Medicine name already exists")
        updates["name"] = normalized_name

    for field, value in updates.items():
        setattr(medicine, field, value)

    is_low_stock = medicine.quantity <= medicine.low_stock_threshold
    if is_low_stock and not was_low_stock:
        notify_low_stock_to_admins(
            db,
            medicine_name=medicine.name,
            quantity=medicine.quantity,
            threshold=medicine.low_stock_threshold,
        )

    db.commit()
    db.refresh(medicine)
    return medicine


def delete_medicine(db: Session, medicine: Medicine) -> None:
    db.delete(medicine)
    db.commit()
