from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.modules.animals.models import AnimalOwnershipStatus, SaleReadiness, Sex, Species
from app.modules.marketplace.models import ListingStatus, ReportReason, ReportStatus
from app.modules.users.models import Language, UserRole, UserStatus
from app.modules.vets.models import VetVerificationStatus

def clean(value: str) -> str:
    value = value.strip()
    if not value: raise ValueError("Field cannot be blank")
    return value

class Page(BaseModel):
    page: int = Field(default=1, ge=1); page_size: int = Field(default=20, ge=1, le=100)
class ActionReason(BaseModel):
    model_config=ConfigDict(extra="forbid"); reason: str=Field(min_length=5,max_length=1000)
    _clean=field_validator("reason")(clean)
class AdminNote(BaseModel):
    model_config=ConfigDict(extra="forbid"); note: str=Field(min_length=3,max_length=1000)
    _clean=field_validator("note")(clean)
class ReportResolution(BaseModel):
    model_config=ConfigDict(extra="forbid"); action: Literal["no_action","suspend_listing","suspend_farmer"]; note: str=Field(min_length=3,max_length=1000)
    _clean=field_validator("note")(clean)

class SafeAdmin(BaseModel): id: UUID; full_name: str
class AdminUserSummary(BaseModel):
    id: UUID; full_name: str; phone: str; role: UserRole; status: UserStatus; preferred_language: Language; phone_verified: bool; created_at: datetime; updated_at: datetime
class FarmerSummary(BaseModel):
    id: UUID; farm_name: str|None; region: str; province: str; animal_count: int; active_listing_count: int
class VetSummary(BaseModel):
    id: UUID; clinic_name: str|None; specialization: str|None; region: str; province: str; verification_status: VetVerificationStatus
class AdminUserDetail(AdminUserSummary): farmer_profile: FarmerSummary|None; vet_profile: VetSummary|None
class UserFilters(Page):
    role: UserRole|None=None; status: UserStatus|None=None; search: str|None=Field(default=None,max_length=255); sort: Literal["newest","oldest","name"]="newest"
class PaginatedUsers(BaseModel): items:list[AdminUserSummary]; page:int; page_size:int; total:int; pages:int

class AdminAnimal(BaseModel):
    id: UUID; species: Species; breed: str|None; sex: Sex; ownership_status: AnimalOwnershipStatus; sale_readiness: SaleReadiness; photos:list[str]
class AdminFarmer(BaseModel): id: UUID; user_id: UUID; full_name: str; phone: str; status: UserStatus
class AdminListingSummary(BaseModel):
    id: UUID; title: str; price_mad: Decimal; region: str; province: str; status: ListingStatus; expires_at: datetime; created_at: datetime; updated_at: datetime; animal: AdminAnimal; farmer: AdminFarmer; report_count:int; pending_report_count:int
class AdminReportInline(BaseModel): id:UUID; reason:ReportReason; status:ReportStatus; description:str|None; created_at:datetime
class AdminListingDetail(AdminListingSummary): description:str|None; contact_phone:str; contact_whatsapp:str|None; trust_score:int; reports:list[AdminReportInline]
class ListingFilters(Page):
    status:ListingStatus|None=None; region:str|None=Field(default=None,max_length=120); province:str|None=Field(default=None,max_length=120); species:Species|None=None; farmer_id:UUID|None=None; has_reports:bool|None=None; sort:Literal["newest","oldest","highest_price","most_reported"]="newest"
class PaginatedListings(BaseModel): items:list[AdminListingSummary]; page:int; page_size:int; total:int; pages:int

class ReporterSummary(BaseModel): type:Literal["guest","user"]; id:UUID|None; full_name:str|None
class ReportListingSummary(BaseModel): id:UUID; title:str; status:ListingStatus; farmer:AdminFarmer
class AdminReportSummary(BaseModel):
    id:UUID; reason:ReportReason; description:str|None; status:ReportStatus; reporter:ReporterSummary; listing:ReportListingSummary; created_at:datetime; reviewed_at:datetime|None; reviewing_admin:SafeAdmin|None; admin_note:str|None
class AdminReportDetail(AdminReportSummary): other_report_count:int
class ReportFilters(Page): status:ReportStatus|None=None; reason:ReportReason|None=None; listing_id:UUID|None=None; sort:Literal["newest","oldest"]="newest"
class PaginatedReports(BaseModel): items:list[AdminReportSummary]; page:int; page_size:int; total:int; pages:int

class AdminAuditLogResponse(BaseModel):
    id:UUID; admin:SafeAdmin; action:str; target_type:str; target_id:UUID|None; metadata_json:dict[str,object]; created_at:datetime
class AuditFilters(Page): action:str|None=Field(default=None,max_length=80); target_type:str|None=Field(default=None,max_length=40); admin_user_id:UUID|None=None; date_from:datetime|None=None; date_to:datetime|None=None; sort:Literal["newest","oldest"]="newest"
class PaginatedAuditLogs(BaseModel): items:list[AdminAuditLogResponse]; page:int; page_size:int; total:int; pages:int
class RecentAdminAction(BaseModel): action:str; target_type:str; target_id:UUID|None; admin_name:str; created_at:datetime
class AdminStats(BaseModel):
    total_users:int; active_users:int; suspended_users:int; total_farmers:int; total_vets:int; approved_vets:int; pending_vet_applications:int; total_animals:int; active_listings:int; expired_listings:int; sold_listings:int; suspended_listings:int; pending_listing_reports:int; resolved_listing_reports:int; recent_admin_actions:list[RecentAdminAction]