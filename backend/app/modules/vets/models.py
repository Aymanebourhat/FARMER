import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.users.models import enum_values


class VetVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class VetProfile(Base):
    __tablename__ = "vet_profiles"
    __table_args__ = (
        Index("ix_vet_profiles_region_province", "region", "province"),
        Index("ix_vet_profiles_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    clinic_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    region: Mapped[str] = mapped_column(String(120), nullable=False)
    province: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    whatsapp: Mapped[str | None] = mapped_column(String(32), nullable=True)
    license_document_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    license_document_mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    license_document_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verification_status: Mapped[VetVerificationStatus] = mapped_column(Enum(VetVerificationStatus, values_callable=enum_values, name="vet_verification_status"), nullable=False, default=VetVerificationStatus.PENDING, index=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    user = relationship("User", back_populates="vet_profile")
