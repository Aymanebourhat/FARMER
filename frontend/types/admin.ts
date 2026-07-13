import type { AnimalOwnershipStatus, AnimalSex, SaleReadiness, Species } from "@/types/animal";
import type { ListingStatus, ReportReason } from "@/types/listing";
import type { UserRole } from "@/types/user";
import type { VetVerificationStatus } from "@/types/vet";

export type UserStatus = "active" | "suspended" | "deleted";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "action_taken";
export type ReportResolutionAction = "no_action" | "suspend_listing" | "suspend_farmer";
export type AdminSort = "newest" | "oldest";

export type AdminPagination<T> = { items: T[]; page: number; page_size: number; total: number; pages: number };
export type SafeAdmin = { id: string; full_name: string };
export type RecentAdminAction = { action: string; target_type: string; target_id: string | null; admin_name: string; created_at: string };
export type AdminStats = {
  total_users: number; active_users: number; suspended_users: number; total_farmers: number; total_vets: number;
  approved_vets: number; pending_vet_applications: number; total_animals: number; active_listings: number;
  expired_listings: number; sold_listings: number; suspended_listings: number; pending_listing_reports: number;
  resolved_listing_reports: number; recent_admin_actions: RecentAdminAction[];
};
export type AdminUserSummary = {
  id: string; full_name: string; phone: string; role: UserRole; status: UserStatus; preferred_language: "ar" | "fr";
  phone_verified: boolean; created_at: string; updated_at: string;
};
export type AdminFarmerProfileSummary = { id: string; farm_name: string | null; region: string; province: string; animal_count: number; active_listing_count: number };
export type AdminVetProfileSummary = { id: string; clinic_name: string | null; specialization: string | null; region: string; province: string; verification_status: VetVerificationStatus };
export type AdminUserDetail = AdminUserSummary & { farmer_profile: AdminFarmerProfileSummary | null; vet_profile: AdminVetProfileSummary | null };
export type AdminUserFilters = { role?: UserRole; status?: UserStatus; search?: string; sort?: "newest" | "oldest" | "name"; page?: number; page_size?: number };
export type UserSuspensionPayload = { reason: string };

export type AdminAnimalSummary = { id: string; species: Species; breed: string | null; sex: AnimalSex; ownership_status: AnimalOwnershipStatus; sale_readiness: SaleReadiness; photos: string[] };
export type AdminFarmerSummary = { id: string; user_id: string; full_name: string; phone: string; status: UserStatus };
export type AdminListingSummary = {
  id: string; title: string; price_mad: string; region: string; province: string; status: ListingStatus; expires_at: string;
  created_at: string; updated_at: string; animal: AdminAnimalSummary; farmer: AdminFarmerSummary; report_count: number; pending_report_count: number;
};
export type AdminInlineReport = { id: string; reason: ReportReason; status: ReportStatus; description: string | null; created_at: string };
export type AdminListingDetail = AdminListingSummary & { description: string | null; contact_phone: string; contact_whatsapp: string | null; trust_score: number; reports: AdminInlineReport[] };
export type AdminListingFilters = { status?: ListingStatus; region?: string; province?: string; species?: Species; farmer_id?: string; has_reports?: boolean; sort?: "newest" | "oldest" | "highest_price" | "most_reported"; page?: number; page_size?: number };
export type ListingSuspensionPayload = { reason: string };

export type AdminReporterSummary = { type: "guest" | "user"; id: string | null; full_name: string | null };
export type AdminReportListingSummary = { id: string; title: string; status: ListingStatus; farmer: AdminFarmerSummary };
export type AdminReportSummary = {
  id: string; reason: ReportReason; description: string | null; status: ReportStatus; reporter: AdminReporterSummary;
  listing: AdminReportListingSummary; created_at: string; reviewed_at: string | null; reviewing_admin: SafeAdmin | null; admin_note: string | null;
};
export type AdminReportDetail = AdminReportSummary & { other_report_count: number };
export type AdminReportFilters = { status?: ReportStatus; reason?: ReportReason; listing_id?: string; sort?: AdminSort; page?: number; page_size?: number };
export type AdminNotePayload = { note: string };
export type ReportResolutionPayload = { action: ReportResolutionAction; note: string };

export type AdminAuditLog = { id: string; admin: SafeAdmin; action: string; target_type: string; target_id: string | null; metadata_json: Record<string, unknown>; created_at: string };
export type AdminAuditFilters = { action?: string; target_type?: string; admin_user_id?: string; date_from?: string; date_to?: string; sort?: AdminSort; page?: number; page_size?: number };
