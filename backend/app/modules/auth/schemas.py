from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.users.models import Language, UserRole


class AuthUser(BaseModel):
    id: UUID
    full_name: str
    role: UserRole
    phone_verified: bool

    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=6, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    preferred_language: Language = Language.AR

    @field_validator("full_name", "phone")
    @classmethod
    def strip_required_strings(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Field cannot be blank")
        return stripped


class LoginRequest(BaseModel):
    phone: str = Field(min_length=6, max_length=32)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("phone")
    @classmethod
    def strip_phone(cls, value: str) -> str:
        return value.strip()


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
