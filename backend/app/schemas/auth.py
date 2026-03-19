import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120, description="Full legal name")
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    phone: str = Field(min_length=10, max_length=20, description="Phone number")
    address: str = Field(min_length=5, max_length=500, description="Full address")
    landmark: str = Field(min_length=2, max_length=200, description="Landmark")
    pin_code: str = Field(min_length=5, max_length=10, description="PIN code")
    date_of_birth: date = Field(description="Date of birth")
    gender: str | None = Field(default=None, max_length=20, description="Gender")
    preferred_language: str | None = Field(default="en", max_length=10, description="en, hi, mr")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    selected_role: str | None = Field(default=None, description="Role the user selected at login: 'user' or 'admin'")


class GoogleLoginRequest(BaseModel):
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    phone: str | None = None
    address: str | None = None
    landmark: str | None = None
    pin_code: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    preferred_language: str | None = None


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=10, max_length=20)
    address: str | None = Field(default=None, min_length=5, max_length=500)
    landmark: str | None = Field(default=None, min_length=2, max_length=200)
    pin_code: str | None = Field(default=None, min_length=5, max_length=10)
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=20)
    preferred_language: str | None = Field(default=None, max_length=10)
