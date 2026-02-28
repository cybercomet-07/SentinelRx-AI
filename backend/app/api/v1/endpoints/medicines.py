import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.medicine import (
    MedicineCreate,
    MedicineListResponse,
    MedicineRead,
    MedicineStockUpdate,
    MedicineUpdate,
)
from app.models.medicine import Medicine
from app.services.medicine_service import (
    create_medicine,
    delete_medicine,
    get_medicine_or_404,
    list_medicines,
    update_medicine,
)

router = APIRouter(prefix="/medicines", tags=["Medicines"])


@router.get("/categories")
def list_categories(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    """Return distinct categories from all medicines (for dropdown, independent of filters)."""
    categories = db.query(Medicine.category).filter(Medicine.category.isnot(None)).distinct().order_by(Medicine.category).all()
    return {"categories": [c[0] for c in categories]}


@router.get("", response_model=MedicineListResponse)
def list_medicines_endpoint(
    q: str | None = Query(default=None, description="Search by medicine name"),
    category: str | None = Query(default=None),
    low_stock_only: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    items, total = list_medicines(
        db,
        q=q,
        category=category,
        low_stock_only=low_stock_only,
        page=page,
        limit=limit,
    )
    return MedicineListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{medicine_id}", response_model=MedicineRead)
def get_medicine_endpoint(
    medicine_id: uuid.UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    return get_medicine_or_404(db, medicine_id)


@router.post("", response_model=MedicineRead, status_code=status.HTTP_201_CREATED)
def create_medicine_endpoint(
    payload: MedicineCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    return create_medicine(db, payload)


@router.patch("/{medicine_id}", response_model=MedicineRead)
def update_medicine_endpoint(
    medicine_id: uuid.UUID,
    payload: MedicineUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    medicine = get_medicine_or_404(db, medicine_id)
    return update_medicine(db, medicine, payload)


@router.patch("/{medicine_id}/stock", response_model=MedicineRead)
def update_medicine_stock_endpoint(
    medicine_id: uuid.UUID,
    payload: MedicineStockUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    medicine = get_medicine_or_404(db, medicine_id)
    return update_medicine(db, medicine, MedicineUpdate(quantity=payload.quantity))


@router.delete("/{medicine_id}")
def delete_medicine_endpoint(
    medicine_id: uuid.UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    medicine = get_medicine_or_404(db, medicine_id)
    delete_medicine(db, medicine)
    return {"message": "Medicine deleted successfully"}
