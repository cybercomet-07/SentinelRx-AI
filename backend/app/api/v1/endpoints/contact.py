from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.contact_message import ContactMessage
from app.models.user import User, UserRole
from app.schemas.contact import ContactCreate, ContactListResponse, ContactRead

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post("", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER)),
):
    msg = ContactMessage(
        user_id=current_user.id,
        full_name=payload.full_name,
        contact_details=payload.contact_details,
        date_of_birth=payload.date_of_birth,
        description=payload.description,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return ContactRead(
        id=msg.id,
        user_id=msg.user_id,
        full_name=msg.full_name,
        contact_details=msg.contact_details,
        date_of_birth=msg.date_of_birth,
        description=msg.description,
        created_at=msg.created_at,
        user_name=current_user.name,
        user_email=current_user.email,
    )


@router.get("", response_model=ContactListResponse)
def list_contact_messages(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    query = db.query(ContactMessage)
    total = query.count()
    messages = (
        query.order_by(ContactMessage.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    items = [
        ContactRead(
            id=m.id,
            user_id=m.user_id,
            full_name=m.full_name,
            contact_details=m.contact_details,
            date_of_birth=m.date_of_birth,
            description=m.description,
            created_at=m.created_at,
            user_name=m.user.name if m.user else None,
            user_email=m.user.email if m.user else None,
        )
        for m in messages
    ]
    return ContactListResponse(items=items, total=total, page=page, limit=limit)
