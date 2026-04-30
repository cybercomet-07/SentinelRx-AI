import uuid
from datetime import timedelta

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


def _norm_email(email: str) -> str:
    """Lowercase + strip so sign-in matches sign-up regardless of casing / spacing."""
    return str(email).strip().lower()


def _user_by_email(db: Session, email: str) -> User | None:
    key = _norm_email(email)
    return db.query(User).filter(func.lower(User.email) == key).first()


def _build_token_response(user: User, role_override: str | None = None) -> TokenResponse:
    settings = get_settings()
    normalized = role_override.upper() if role_override else None
    valid_roles = {r.value for r in UserRole}
    effective_role = normalized if normalized in valid_roles else user.role.value
    claims = {"email": user.email, "role": effective_role}
    access_token = create_token(
        subject=str(user.id),
        token_type="access",
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        extra_claims=claims,
    )
    refresh_token = create_token(
        subject=str(user.id),
        token_type="refresh",
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        extra_claims=claims,
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


def register_user(db: Session, payload: RegisterRequest) -> TokenResponse:
    email_store = _norm_email(str(payload.email))
    existing = db.query(User).filter(func.lower(User.email) == email_store).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name,
        email=email_store,
        password_hash=hash_password(payload.password),
        role=UserRole.USER,
        is_active=True,
        phone=payload.phone,
        address=payload.address,
        landmark=payload.landmark,
        pin_code=payload.pin_code,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        preferred_language=payload.preferred_language or "en",
    )
    db.add(user)
    db.flush()
    db.commit()
    db.refresh(user)
    return _build_token_response(user)


# ── Official demo credentials (seed_demo_roles.py) — see PROJECT_OVERVIEW ──
# Password login when ALLOW_ALL_LOGINS is false:
#   • Patient (self-registered): any email that exists with role USER (sign-up creates USER only).
#   • Patient (demo) + all staff: ONLY the emails below (no other staff email can sign in).
OFFICIAL_DEMO_LOGIN_EMAILS = frozenset(
    {
        "patient@sentinelrx.ai",  # Patient — also allows sign-in like any USER
        "admin@sentinelrx.ai",  # Super Admin
        "doctor@sentinelrx.ai",
        "hospital@sentinelrx.ai",
        "ngo@sentinelrx.ai",
    }
)
# Backwards-compatible alias
ALLOWED_TEST_EMAILS = OFFICIAL_DEMO_LOGIN_EMAILS

EXPECTED_DEMO_ROLES = {
    "patient@sentinelrx.ai": UserRole.USER,
    "admin@sentinelrx.ai": UserRole.ADMIN,
    "doctor@sentinelrx.ai": UserRole.DOCTOR,
    "hospital@sentinelrx.ai": UserRole.HOSPITAL_ADMIN,
    "ngo@sentinelrx.ai": UserRole.NGO,
}


def _ui_selected_role(sel: str | None) -> UserRole | None:
    """Maps Login.jsx role dropdown value to UserRole; None if missing or unknown."""
    if sel is None or not str(sel).strip():
        return None
    mapping = {
        "user": UserRole.USER,
        "admin": UserRole.ADMIN,
        "doctor": UserRole.DOCTOR,
        "hospital_admin": UserRole.HOSPITAL_ADMIN,
        "ngo": UserRole.NGO,
    }
    return mapping.get(str(sel).strip().lower())


def login_user(db: Session, payload: LoginRequest) -> TokenResponse:
    settings = get_settings()
    email_norm = _norm_email(str(payload.email))
    user = _user_by_email(db, email_norm)

    # Staff/demo accounts: keep invite-only unless allow_all_logins.
    # Patients (USER): anyone who registered may sign in with their own email.
    if not settings.allow_all_logins:
        if email_norm in OFFICIAL_DEMO_LOGIN_EMAILS:
            pass
        else:
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )
            if user.role != UserRole.USER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Staff accounts are not self-serve. Use the email and password from your administrator.",
                )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    # Self-heal role drift for fixed judging/demo accounts.
    expected_role = EXPECTED_DEMO_ROLES.get(email_norm)
    if expected_role and user.role != expected_role:
        user.role = expected_role
        db.commit()
        db.refresh(user)

    desired = _ui_selected_role(payload.selected_role)
    if desired is not None and desired != user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The role you selected does not match this account. Pick the role that goes with this email (e.g. Doctor for doctor@sentinelrx.ai).",
        )

    return _build_token_response(user, role_override=user.role.value)


def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return _build_token_response(user, role_override=user.role.value)


def login_with_google(db: Session, token: str) -> TokenResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google auth is not configured")

    try:
        token_data = google_id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token") from exc

    email = token_data.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account email not available")

    email_store = _norm_email(email)
    user = _user_by_email(db, email_store)
    if not user:
        name = token_data.get("name") or email_store.split("@")[0]
        user = User(
            name=name,
            email=email_store,
            password_hash=hash_password(str(uuid.uuid4())),
            role=UserRole.USER,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google sign-in is only for patient accounts. Use your work email and password.",
        )
    return _build_token_response(user)
