"""Call schedule API - medicine reminder calls via Twilio."""
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.api.deps.auth import require_roles
from app.db.session import get_db
from app.models.call_schedule import CallSchedule
from app.models.user import User, UserRole

router = APIRouter(prefix="/call-schedules", tags=["Call Schedules"])


def _format_phone(number: str) -> str | None:
    """Format Indian 10-digit to E.164."""
    if not number or not str(number).strip():
        return None
    s = str(number).strip().replace(" ", "")
    if re.fullmatch(r"\d{10}", s):
        return "+91" + s
    if s.startswith("+"):
        return s
    return None


class CallScheduleCreate(BaseModel):
    phone: str
    times: list[str]
    start_date: str
    end_date: str
    message: str | None = "Please take your medicine on time"
    audio_url: str | None = None

    @field_validator("times")
    @classmethod
    def validate_times(cls, v: list[str]) -> list[str]:
        if len(v) > 3:
            raise ValueError("Max 3 times allowed")
        for t in v:
            if not re.match(r"^\d{2}:\d{2}$", t):
                raise ValueError("Invalid time format (use HH:MM)")
        return v


@router.post("")
def create(
    data: CallScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    """Create a call schedule. User gets Twilio calls at specified times."""
    phone = _format_phone(data.phone)
    if not phone:
        raise HTTPException(400, "Invalid phone number")
    obj = CallSchedule(
        id=uuid.uuid4(),
        user_id=current_user.id,
        phone=phone,
        times=",".join(data.times),
        message=data.message,
        audio_url=data.audio_url,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    # Reload scheduler (handled by background task)
    from app.tasks.call_schedule_task import reload_jobs
    reload_jobs()
    return {"msg": "Saved", "id": str(obj.id)}


@router.get("")
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    """List call schedules for current user."""
    items = (
        db.query(CallSchedule)
        .filter(CallSchedule.user_id == current_user.id)
        .order_by(CallSchedule.start_date.desc())
        .all()
    )
    return {
        "items": [
            {
                "id": str(s.id),
                "phone": s.phone[:6] + "****" if len(s.phone) > 6 else s.phone,
                "times": s.times.split(",") if s.times else [],
                "message": s.message,
                "start_date": s.start_date,
                "end_date": s.end_date,
            }
            for s in items
        ],
        "total": len(items),
    }


@router.delete("/{schedule_id}")
def delete(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.ADMIN)),
):
    """Delete a call schedule."""
    item = (
        db.query(CallSchedule)
        .filter(CallSchedule.id == schedule_id, CallSchedule.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(404, "Not found")
    db.delete(item)
    db.commit()
    from app.tasks.call_schedule_task import reload_jobs
    reload_jobs()
    return {"msg": "Deleted"}
