import enum
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.users.models import enum_values


class Species(str, enum.Enum):
    SHEEP = "sheep"
    COW = "cow"
    GOAT = "goat"
    CAMEL = "camel"
    OTHER = "other"


class Sex(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    UNKNOWN = "unknown"


class AnimalHealthStatus(str, enum.Enum):
    HEALTHY = "healthy"
    SICK = "sick"
    RECOVERING = "recovering"
    UNKNOWN = "unknown"


class AnimalOwnershipStatus(str, enum.Enum):
    OWNED = "owned"
    LISTED = "listed"
    RESERVED = "reserved"
    SOLD = "sold"
    DEAD = "dead"


class SaleReadiness(str, enum.Enum):
    NOT_READY = "not_ready"
    READY = "ready"
    UNKNOWN = "unknown"


class VerificationLevel(str, enum.Enum):
    SELF_REPORTED = "self_reported"
    ADMIN_REVIEWED = "admin_reviewed"
    VET_VERIFIED = "vet_verified"


class Animal(Base):
    __tablename__ = "animals"
    __table_args__ = (
        CheckConstraint(
            "birth_date IS NOT NULL OR estimated_age_months IS NOT NULL",
            name="age_required",
        ),
        CheckConstraint(
            "estimated_age_months IS NULL OR estimated_age_months > 0",
            name="estimated_age_months_positive",
        ),
        Index("ix_animals_farmer_id_species", "farmer_id", "species"),
        Index(
            "ix_animals_species_ownership_status",
            "species",
            "ownership_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farmer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    species: Mapped[Species] = mapped_column(
        Enum(Species, values_callable=enum_values, name="species"),
        nullable=False,
    )
    breed: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sex: Mapped[Sex] = mapped_column(
        Enum(Sex, values_callable=enum_values, name="animal_sex"),
        nullable=False,
    )
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    estimated_age_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None] = mapped_column(String(120), nullable=True)
    identification_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    health_status: Mapped[AnimalHealthStatus] = mapped_column(
        Enum(
            AnimalHealthStatus,
            values_callable=enum_values,
            name="animal_health_status",
        ),
        nullable=False,
    )
    ownership_status: Mapped[AnimalOwnershipStatus] = mapped_column(
        Enum(
            AnimalOwnershipStatus,
            values_callable=enum_values,
            name="animal_ownership_status",
        ),
        nullable=False,
        default=AnimalOwnershipStatus.OWNED,
    )
    sale_readiness: Mapped[SaleReadiness] = mapped_column(
        Enum(SaleReadiness, values_callable=enum_values, name="sale_readiness"),
        nullable=False,
    )
    verification_level: Mapped[VerificationLevel] = mapped_column(
        Enum(
            VerificationLevel,
            values_callable=enum_values,
            name="verification_level",
        ),
        nullable=False,
        default=VerificationLevel.SELF_REPORTED,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    photos: Mapped[list["AnimalPhoto"]] = relationship(
        back_populates="animal",
        cascade="all, delete-orphan",
        order_by="AnimalPhoto.uploaded_at",
    )
    weight_records = relationship(
        "WeightRecord",
        back_populates="animal",
        cascade="all, delete-orphan",
    )
    health_records = relationship(
        "HealthRecord",
        back_populates="animal",
        cascade="all, delete-orphan",
    )


class AnimalPhoto(Base):
    __tablename__ = "animal_photos"
    __table_args__ = (
        CheckConstraint("size_bytes > 0 AND size_bytes <= 10485760", name="size_valid"),
        CheckConstraint(
            "mime_type IN ('image/jpeg', 'image/png', 'image/webp')",
            name="mime_type_allowed",
        ),
        Index("ix_animal_photos_animal_id_uploaded_at", "animal_id", "uploaded_at"),
        Index(
            "uq_animal_photos_one_primary",
            "animal_id",
            unique=True,
            postgresql_where=text("is_primary IS true"),
            sqlite_where=text("is_primary = 1"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    animal_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("animals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    animal: Mapped[Animal] = relationship(back_populates="photos")
