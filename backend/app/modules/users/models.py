import enum
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.farmers.models import FarmerProfile
    from app.modules.vets.models import VetProfile


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    VET = "vet"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class Language(str, enum.Enum):
    AR = "ar"
    FR = "fr"


def enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    return [item.value for item in enum_cls]


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=enum_values, name="user_role"),
        nullable=False,
        index=True,
    )
    phone_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, values_callable=enum_values, name="user_status"),
        nullable=False,
        default=UserStatus.ACTIVE,
        index=True,
    )
    preferred_language: Mapped[Language] = mapped_column(
        Enum(Language, values_callable=enum_values, name="language"),
        nullable=False,
        default=Language.AR,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    vet_profile: Mapped["VetProfile | None"] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)

    farmer_profile: Mapped["FarmerProfile | None"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )
