import enum
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.users.models import enum_values


class HealthRecordType(str, enum.Enum):
    VACCINE = "vaccine"
    ILLNESS = "illness"
    TREATMENT = "treatment"
    CHECKUP = "checkup"
    NOTE = "note"


class HealthVerificationStatus(str, enum.Enum):
    FARMER_REPORTED = "farmer_reported"
    VET_VERIFIED = "vet_verified"


class HealthRecord(Base):
    __tablename__ = "health_records"
    __table_args__ = (
        Index("ix_health_records_animal_id_recorded_at", "animal_id", "recorded_at"),
        Index("ix_health_records_next_reminder_at", "next_reminder_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    animal_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("animals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    record_type: Mapped[HealthRecordType] = mapped_column(
        Enum(
            HealthRecordType,
            values_callable=enum_values,
            name="health_record_type",
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    medicine_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    vet_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    verification_status: Mapped[HealthVerificationStatus] = mapped_column(
        Enum(
            HealthVerificationStatus,
            values_callable=enum_values,
            name="health_verification_status",
        ),
        nullable=False,
        default=HealthVerificationStatus.FARMER_REPORTED,
    )
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    next_reminder_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )

    animal = relationship("Animal", back_populates="health_records")
