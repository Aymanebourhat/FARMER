from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.vets.models import VetVerificationStatus


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip() or None

def _clean_required(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Field cannot be blank")
    return value

class VetApplicationPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    clinic_name: str | None = Field(default=None, max_length=255)
    specialization: str | None = Field(default=None, max_length=255)
    region: str = Field(min_length=1, max_length=120)
    province: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=6, max_length=32)
    whatsapp: str | None = Field(default=None, min_length=6, max_length=32)
    _optional = field_validator("clinic_name", "specialization", "whatsapp")(_clean_optional)
    _required = field_validator("region", "province", "phone")(_clean_required)

class VetSelfUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    clinic_name: str | None = Field(default=None, max_length=255)
    specialization: str | None = Field(default=None, max_length=255)
    region: str | None = Field(default=None, min_length=1, max_length=120)
    province: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, min_length=6, max_length=32)
    whatsapp: str | None = Field(default=None, min_length=6, max_length=32)
    _optional = field_validator("clinic_name", "specialization", "whatsapp")(_clean_optional)
    _required = field_validator("region", "province", "phone")(_clean_optional)

class VetSelfResponse(BaseModel):
    id: UUID; clinic_name: str | None; specialization: str | None; region: str; province: str; phone: str; whatsapp: str | None
    verification_status: VetVerificationStatus; rejection_reason: str | None; verified_at: datetime | None
    has_document: bool; document_mime_type: str | None; document_size_bytes: int | None; created_at: datetime; updated_at: datetime

class PublicVetSummary(BaseModel):
    id: UUID; full_name: str; clinic_name: str | None; specialization: str | None; region: str; province: str; phone: str; whatsapp: str | None; verified_at: datetime; is_verified: Literal[True] = True

class PublicVetDetail(PublicVetSummary): pass

class VetPublicFilters(BaseModel):
    region: str | None = Field(default=None, max_length=120); province: str | None = Field(default=None, max_length=120); specialization: str | None = Field(default=None, max_length=255)
    page: int = Field(default=1, ge=1); page_size: int = Field(default=20, ge=1, le=100); sort: Literal["recently_verified", "name"] = "recently_verified"

class PaginatedPublicVets(BaseModel):
    items: list[PublicVetSummary]; page: int; page_size: int; total: int; pages: int

class AdminVetSummary(BaseModel):
    id: UUID; user_id: UUID; full_name: str; clinic_name: str | None; specialization: str | None; region: str; province: str; phone: str; whatsapp: str | None
    has_document: bool; document_mime_type: str | None; document_size_bytes: int | None; created_at: datetime; updated_at: datetime

class AdminVetDetail(AdminVetSummary):
    verification_status: VetVerificationStatus; rejection_reason: str | None; verified_at: datetime | None

class AdminVetFilters(BaseModel):
    region: str | None = Field(default=None, max_length=120); province: str | None = Field(default=None, max_length=120); page: int = Field(default=1, ge=1); page_size: int = Field(default=20, ge=1, le=100); sort: Literal["recently_verified", "name"] = "recently_verified"

class PaginatedAdminVets(BaseModel):
    items: list[AdminVetSummary]; page: int; page_size: int; total: int; pages: int

class VetRejectionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str = Field(min_length=5, max_length=1000)
    _reason = field_validator("reason")(_clean_required)
