from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.animals.models import (
    AnimalHealthStatus,
    AnimalOwnershipStatus,
    SaleReadiness,
    Sex,
    Species,
    VerificationLevel,
)


def _normalize_optional_string(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class AnimalCreate(BaseModel):
    species: Species
    breed: str | None = Field(default=None, max_length=120)
    sex: Sex
    birth_date: date | None = None
    estimated_age_months: int | None = Field(default=None, gt=0)
    color: str | None = Field(default=None, max_length=120)
    identification_notes: str | None = None
    health_status: AnimalHealthStatus
    ownership_status: AnimalOwnershipStatus = AnimalOwnershipStatus.OWNED
    sale_readiness: SaleReadiness

    @field_validator("breed", "color", "identification_notes")
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        return _normalize_optional_string(value)

    @field_validator("birth_date")
    @classmethod
    def birth_date_not_future(cls, value: date | None) -> date | None:
        if value is not None and value > date.today():
            raise ValueError("birth_date cannot be in the future")
        return value

    @model_validator(mode="after")
    def require_age(self) -> "AnimalCreate":
        if self.birth_date is None and self.estimated_age_months is None:
            raise ValueError("Either birth_date or estimated_age_months must be provided")
        return self


class AnimalUpdate(BaseModel):
    species: Species | None = None
    breed: str | None = Field(default=None, max_length=120)
    sex: Sex | None = None
    birth_date: date | None = None
    estimated_age_months: int | None = Field(default=None, gt=0)
    color: str | None = Field(default=None, max_length=120)
    identification_notes: str | None = None
    health_status: AnimalHealthStatus | None = None
    ownership_status: AnimalOwnershipStatus | None = None
    sale_readiness: SaleReadiness | None = None

    @field_validator("breed", "color", "identification_notes")
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        return _normalize_optional_string(value)

    @field_validator("birth_date")
    @classmethod
    def birth_date_not_future(cls, value: date | None) -> date | None:
        if value is not None and value > date.today():
            raise ValueError("birth_date cannot be in the future")
        return value


class AnimalRead(BaseModel):
    id: UUID
    farmer_id: UUID
    species: Species
    breed: str | None
    sex: Sex
    birth_date: date | None
    estimated_age_months: int | None
    color: str | None
    identification_notes: str | None
    health_status: AnimalHealthStatus
    ownership_status: AnimalOwnershipStatus
    sale_readiness: SaleReadiness
    verification_level: VerificationLevel
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnimalPhotoRead(BaseModel):
    id: UUID
    animal_id: UUID
    file_url: str
    mime_type: str
    size_bytes: int
    is_primary: bool
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnimalHistoryEvent(BaseModel):
    event_type: str
    occurred_at: date | datetime
    data: dict[str, Any]
