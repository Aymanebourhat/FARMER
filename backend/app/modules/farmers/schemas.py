from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.animals.models import Species


class FarmerProfileRead(BaseModel):
    id: UUID
    user_id: UUID
    farm_name: str | None
    region: str
    province: str
    commune: str | None
    main_livestock_type: str | None
    farm_size_label: str | None
    profile_completion_score: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FarmerProfileUpsert(BaseModel):
    farm_name: str | None = Field(default=None, max_length=255)
    region: str | None = Field(default=None, max_length=120)
    province: str | None = Field(default=None, max_length=120)
    commune: str | None = Field(default=None, max_length=120)
    main_livestock_type: str | None = Field(default=None, max_length=120)
    farm_size_label: str | None = Field(default=None, max_length=60)

    @field_validator(
        "farm_name",
        "region",
        "province",
        "commune",
        "main_livestock_type",
        "farm_size_label",
    )
    @classmethod
    def normalize_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class DashboardLatestWeight(BaseModel):
    animal_id: UUID
    animal_label: str
    weight_kg: Decimal
    recorded_at: date
    note: str | None


class DashboardActivityItem(BaseModel):
    type: Literal[
        "animal_created",
        "weight_recorded",
        "health_recorded",
        "photo_uploaded",
    ]
    title: str
    date: date | datetime
    animal_id: UUID | None = None


class FarmerDashboardRead(BaseModel):
    total_animals: int
    animals_by_species: dict[Species, int]
    active_listings: int
    ready_for_sale: int
    health_alerts: int
    latest_weight_updates: list[DashboardLatestWeight]
    recent_activity: list[DashboardActivityItem]
