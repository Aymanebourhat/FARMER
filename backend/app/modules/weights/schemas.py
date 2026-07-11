from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WeightRecordCreate(BaseModel):
    weight_kg: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    recorded_at: date
    note: str | None = None

    @field_validator("recorded_at")
    @classmethod
    def recorded_at_not_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("recorded_at cannot be in the future")
        return value

    @field_validator("note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class WeightRecordRead(BaseModel):
    id: UUID
    animal_id: UUID
    weight_kg: Decimal
    recorded_at: date
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
