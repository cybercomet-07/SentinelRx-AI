import uuid
from datetime import timedelta

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


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
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
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


# ── Testing mode: only these accounts may log in ────────────────────────────
ALLOWED_TEST_EMAILS = {
    "patient@sentinelrx.ai",
    "admin@sentinelrx.ai",
    "doctor@sentinelrx.ai",
    "hospital@sentinelrx.ai",
    "ngo@sentinelrx.ai",
}

EXPECTED_DEMO_ROLES = {
    "patient@sentinelrx.ai": UserRole.USER,
    "admin@sentinelrx.ai": UserRole.ADMIN,
    "doctor@sentinelrx.ai": UserRole.DOCTOR,
    "hospital@sentinelrx.ai": UserRole.HOSPITAL_ADMIN,
    "ngo@sentinelrx.ai": UserRole.NGO,
}


def login_user(db: Session, payload: LoginRequest) -> TokenResponse:
    settings = get_settings()
    email_norm = payload.email.lower()
    if not settings.allow_all_logins and email_norm not in ALLOWED_TEST_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. Only authorised test accounts can log in during this phase.",
        )
    user = db.query(User).filter(User.email == payload.email).first()
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

    user = db.query(User).filter(User.email == email).first()
    if not user:
        name = token_data.get("name") or email.split("@")[0]
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(str(uuid.uuid4())),
            role=UserRole.USER,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return _build_token_response(user)
