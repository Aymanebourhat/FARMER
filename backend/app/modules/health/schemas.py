from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.health.models import HealthRecordType, HealthVerificationStatus


class HealthRecordCreate(BaseModel):
    record_type: HealthRecordType
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    medicine_name: str | None = Field(default=None, max_length=255)
    recorded_at: date
    next_reminder_at: date | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title is required")
        return stripped

    @field_validator("description", "medicine_name")
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("recorded_at")
    @classmethod
    def recorded_at_not_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("recorded_at cannot be in the future")
        return value


class HealthRecordRead(BaseModel):
    id: UUID
    animal_id: UUID
    record_type: HealthRecordType
    title: str
    description: str | None
    medicine_name: str | None
    vet_id: UUID | None
    verification_status: HealthVerificationStatus
    recorded_at: date
    next_reminder_at: date | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
