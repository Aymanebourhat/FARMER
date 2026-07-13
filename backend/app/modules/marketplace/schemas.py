from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.animals.models import SaleReadiness, Sex, Species
from app.modules.marketplace.models import ListingStatus, ReportReason, ReportStatus


def _strip_required(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("Field cannot be blank")
    return stripped


def _strip_optional(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip() or None


class ListingCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    animal_id: UUID
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    price_mad: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    contact_phone: str = Field(min_length=6, max_length=32)
    contact_whatsapp: str | None = Field(default=None, min_length=6, max_length=32)

    _required = field_validator("title", "contact_phone")(_strip_required)
    _optional = field_validator("description", "contact_whatsapp")(_strip_optional)


class ListingUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    price_mad: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    contact_phone: str | None = Field(default=None, min_length=6, max_length=32)
    contact_whatsapp: str | None = Field(default=None, min_length=6, max_length=32)

    _required = field_validator("title", "contact_phone")(_strip_required)
    _optional = field_validator("description", "contact_whatsapp")(_strip_optional)


class PublicPhoto(BaseModel):
    id: UUID
    file_url: str
    is_primary: bool


class PublicAnimal(BaseModel):
    id: UUID
    species: Species
    breed: str | None
    sex: Sex
    birth_date: date | None
    estimated_age_months: int | None
    sale_readiness: SaleReadiness
    latest_weight_kg: Decimal | None
    primary_photo_url: str | None
    photos: list[PublicPhoto]
    verification_label: Literal["Farmer-reported data"] = "Farmer-reported data"


class PublicListingSummary(BaseModel):
    id: UUID
    title: str
    description: str | None
    price_mad: Decimal
    region: str
    province: str
    contact_phone: str
    contact_whatsapp: str | None
    status: ListingStatus
    trust_score: int
    expires_at: datetime
    created_at: datetime
    animal: PublicAnimal

    @field_validator("expires_at", "created_at")
    @classmethod
    def ensure_utc(cls, value: datetime) -> datetime:
        return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


class PublicListingDetail(PublicListingSummary):
    pass


class ListingOwnerResponse(PublicListingDetail):
    farmer_id: UUID
    animal_id: UUID
    updated_at: datetime

    @field_validator("updated_at")
    @classmethod
    def updated_at_utc(cls, value: datetime) -> datetime:
        return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


class PaginatedMarketplaceResponse(BaseModel):
    items: list[PublicListingSummary]
    page: int
    page_size: int
    total: int
    pages: int


class OwnerListingFilters(BaseModel):
    status: ListingStatus | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedOwnerListingsResponse(BaseModel):
    items: list[ListingOwnerResponse]
    page: int
    page_size: int
    total: int
    pages: int


class MarketplaceFilters(BaseModel):
    species: Species | None = None
    breed: str | None = Field(default=None, max_length=120)
    region: str | None = Field(default=None, max_length=120)
    province: str | None = Field(default=None, max_length=120)
    min_price: Decimal | None = Field(default=None, ge=0)
    max_price: Decimal | None = Field(default=None, ge=0)
    min_weight: Decimal | None = Field(default=None, ge=0)
    max_weight: Decimal | None = Field(default=None, ge=0)
    sex: Sex | None = None
    sale_readiness: SaleReadiness | None = None
    sort: Literal["recent", "newest", "price_low_to_high", "price_high_to_low", "highest_trust"] = "recent"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

class ReportCreate(BaseModel):
    reason: ReportReason
    description: str | None = Field(default=None, max_length=1000)

    _optional = field_validator("description")(_strip_optional)


class ReportResponse(BaseModel):
    id: UUID
    listing_id: UUID
    reporter_user_id: UUID | None
    reason: ReportReason
    description: str | None
    status: ReportStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
