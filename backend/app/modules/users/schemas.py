from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.modules.users.models import Language, UserRole, UserStatus


class UserRead(BaseModel):
    id: UUID
    full_name: str
    phone: str
    email: str | None
    role: UserRole
    phone_verified: bool
    status: UserStatus
    preferred_language: Language

    model_config = ConfigDict(from_attributes=True)
