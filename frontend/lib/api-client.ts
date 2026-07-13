import type {
  AuthResponse,
  AuthUser,
  FarmerProfile,
  FarmerProfilePayload,
  LoginPayload,
  RegisterPayload,
} from "@/types/user";
import type {
  Animal,
  AnimalCreateInput,
  AnimalHistoryEvent,
  AnimalPhoto,
  AnimalUpdateInput,
  HealthRecord,
  HealthRecordCreateInput,
  WeightRecord,
  WeightRecordCreateInput,
} from "@/types/animal";
import type { FarmerDashboard } from "@/types/dashboard";
import type { CreateMarketplaceListingInput, MarketplaceFilters, MarketplaceListing, MarketplaceReport, OwnerListingFilters, OwnerMarketplaceListing, PaginatedMarketplaceResponse, ReportListingInput, UpdateMarketplaceListingInput } from "@/types/listing";
import type { AdminAuditFilters, AdminAuditLog, AdminListingDetail, AdminListingFilters, AdminListingSummary, AdminNotePayload, AdminPagination, AdminReportDetail, AdminReportFilters, AdminReportSummary, AdminStats, AdminUserDetail, AdminUserFilters, AdminUserSummary, ListingSuspensionPayload, ReportResolutionPayload, UserSuspensionPayload } from "@/types/admin";
import type { AdminVetDetail, AdminVetFilters, AdminVetSummary, ApiDocument, PaginatedVetResponse, PublicVetDetail, VetApplicationPayload, VetDirectoryFilters, VetProfileUpdatePayload, VetRejectionPayload, VetSelfProfile } from "@/types/vet";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  token?: string | null;
};

type QueryValues = Record<string, string | number | boolean | undefined | null>;

export function toQueryString(query: QueryValues): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function resolveApiMediaUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${API_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = response.statusText || "Request failed";
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail
          .map((item) => {
            if (item && typeof item === "object" && "msg" in item) {
              return String((item as { msg: unknown }).msg);
            }
            return String(item);
          })
          .join(" ");
      }
    } catch {
      // Keep the HTTP status text when the backend returns no JSON body.
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function requestDocument(path: string, token: string): Promise<ApiDocument> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) {
    let detail = response.statusText || "Request failed";
    try { const body = (await response.json()) as { detail?: unknown }; if (typeof body.detail === "string") detail = body.detail; } catch { /* document errors may not be JSON */ }
    throw new ApiError(response.status, detail);
  }
  return { blob: await response.blob(), contentType: response.headers.get("Content-Type")?.split(";")[0] ?? "application/octet-stream" };
}
export const apiClient = {
  register(payload: RegisterPayload) {
    return request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload) {
    return request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  me(token: string) {
    return request<AuthUser>("/api/v1/auth/me", {}, { token });
  },

  async getFarmerProfile(token: string) {
    try {
      return await request<FarmerProfile>("/api/v1/farmers/me", {}, { token });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  upsertFarmerProfile(token: string, payload: FarmerProfilePayload) {
    return request<FarmerProfile>(
      "/api/v1/farmers/me",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      { token },
    );
  },

  getFarmerDashboard: (token: string) =>
    request<FarmerDashboard>("/api/v1/farmers/me/dashboard", {}, { token }),

  listAnimals: (token: string) => request<Animal[]>("/api/v1/animals", {}, { token }),
  createAnimal: (token: string, payload: AnimalCreateInput) =>
    request<Animal>("/api/v1/animals", { method: "POST", body: JSON.stringify(payload) }, { token }),
  getAnimal: (token: string, animalId: string) =>
    request<Animal>(`/api/v1/animals/${animalId}`, {}, { token }),
  updateAnimal: (token: string, animalId: string, payload: AnimalUpdateInput) =>
    request<Animal>(`/api/v1/animals/${animalId}`, { method: "PATCH", body: JSON.stringify(payload) }, { token }),
  deleteAnimal: (token: string, animalId: string) =>
    request<void>(`/api/v1/animals/${animalId}`, { method: "DELETE" }, { token }),
  getAnimalHistory: (token: string, animalId: string) =>
    request<AnimalHistoryEvent[]>(`/api/v1/animals/${animalId}/history`, {}, { token }),
  listAnimalPhotos: (token: string, animalId: string) =>
    request<AnimalPhoto[]>(`/api/v1/animals/${animalId}/photos`, {}, { token }),
  uploadAnimalPhoto(token: string, animalId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    return request<AnimalPhoto>(`/api/v1/animals/${animalId}/photos`, { method: "POST", body }, { token });
  },
  deleteAnimalPhoto: (token: string, animalId: string, photoId: string) =>
    request<void>(`/api/v1/animals/${animalId}/photos/${photoId}`, { method: "DELETE" }, { token }),
  setPrimaryAnimalPhoto: (token: string, animalId: string, photoId: string) =>
    request<AnimalPhoto>(`/api/v1/animals/${animalId}/photos/${photoId}/primary`, { method: "PATCH" }, { token }),
  listWeights: (token: string, animalId: string) =>
    request<WeightRecord[]>(`/api/v1/animals/${animalId}/weights`, {}, { token }),
  createWeight: (token: string, animalId: string, payload: WeightRecordCreateInput) =>
    request<WeightRecord>(`/api/v1/animals/${animalId}/weights`, { method: "POST", body: JSON.stringify(payload) }, { token }),
  listHealthRecords: (token: string, animalId: string) =>
    request<HealthRecord[]>(`/api/v1/animals/${animalId}/health-records`, {}, { token }),
  createHealthRecord: (token: string, animalId: string, payload: HealthRecordCreateInput) =>
    request<HealthRecord>(`/api/v1/animals/${animalId}/health-records`, { method: "POST", body: JSON.stringify(payload) }, { token }),

  getMarketplaceListings: (filters: MarketplaceFilters = {}) =>
    request<PaginatedMarketplaceResponse>(`/api/v1/marketplace/listings${toQueryString(filters)}`),
  getMarketplaceListing: (listingId: string) => request<MarketplaceListing>(`/api/v1/marketplace/listings/${listingId}`),
  createMarketplaceListing: (token: string, payload: CreateMarketplaceListingInput) =>
    request<OwnerMarketplaceListing>("/api/v1/marketplace/listings", { method: "POST", body: JSON.stringify(payload) }, { token }),
  updateMarketplaceListing: (token: string, listingId: string, payload: UpdateMarketplaceListingInput) =>
    request<OwnerMarketplaceListing>(`/api/v1/marketplace/listings/${listingId}`, { method: "PATCH", body: JSON.stringify(payload) }, { token }),
  markMarketplaceListingSold: (token: string, listingId: string) =>
    request<OwnerMarketplaceListing>(`/api/v1/marketplace/listings/${listingId}/mark-sold`, { method: "POST" }, { token }),
  renewMarketplaceListing: (token: string, listingId: string) =>
    request<OwnerMarketplaceListing>(`/api/v1/marketplace/listings/${listingId}/renew`, { method: "POST" }, { token }),
  reportMarketplaceListing: (listingId: string, payload: ReportListingInput, token?: string | null) =>
    request<MarketplaceReport>(`/api/v1/marketplace/listings/${listingId}/report`, { method: "POST", body: JSON.stringify(payload) }, { token }),
  getMyMarketplaceListings: (token: string, filters: OwnerListingFilters = {}) =>
    request<PaginatedMarketplaceResponse<OwnerMarketplaceListing>>(`/api/v1/marketplace/my-listings${toQueryString(filters)}`, {}, { token }),
  getMyMarketplaceListing: (token: string, listingId: string) =>
    request<OwnerMarketplaceListing>(`/api/v1/marketplace/my-listings/${listingId}`, {}, { token }),
  getPublicVets: (filters: VetDirectoryFilters = {}) => request<PaginatedVetResponse>(`/api/v1/vets${toQueryString(filters)}`),
  getPublicVet: (vetId: string) => request<PublicVetDetail>(`/api/v1/vets/${vetId}`),
  applyAsVet(token: string, payload: VetApplicationPayload) {
    const body = new FormData();
    if (payload.clinic_name) body.append("clinic_name", payload.clinic_name);
    if (payload.specialization) body.append("specialization", payload.specialization);
    body.append("region", payload.region); body.append("province", payload.province); body.append("phone", payload.phone);
    if (payload.whatsapp) body.append("whatsapp", payload.whatsapp);
    body.append("document", payload.document);
    return request<VetSelfProfile>("/api/v1/vets/apply", { method: "POST", body }, { token });
  },
  getMyVetProfile: (token: string) => request<VetSelfProfile>("/api/v1/vets/me", {}, { token }),
  updateMyVetProfile: (token: string, payload: VetProfileUpdatePayload) => request<VetSelfProfile>("/api/v1/vets/me", { method: "PATCH", body: JSON.stringify(payload) }, { token }),
  replaceMyVetDocument(token: string, document: File) { const body = new FormData(); body.append("document", document); return request<VetSelfProfile>("/api/v1/vets/me/document", { method: "POST", body }, { token }); },
  getPendingVetApplications: (token: string, filters: AdminVetFilters = {}) => request<PaginatedVetResponse<AdminVetSummary>>(`/api/v1/admin/vets/pending${toQueryString(filters)}`, {}, { token }),
  getAdminVetApplication: (token: string, vetId: string) => request<AdminVetDetail>(`/api/v1/admin/vets/${vetId}`, {}, { token }),
  getAdminVetDocument: (token: string, vetId: string) => requestDocument(`/api/v1/admin/vets/${vetId}/document`, token),
  approveVetApplication: (token: string, vetId: string) => request<AdminVetDetail>(`/api/v1/admin/vets/${vetId}/approve`, { method: "PATCH" }, { token }),
  rejectVetApplication: (token: string, vetId: string, payload: VetRejectionPayload) => request<AdminVetDetail>(`/api/v1/admin/vets/${vetId}/reject`, { method: "PATCH", body: JSON.stringify(payload) }, { token }),
  getAdminStats: (token: string) => request<AdminStats>("/api/v1/admin/stats", {}, { token }),
  getAdminUsers: (token: string, filters: AdminUserFilters = {}) => request<AdminPagination<AdminUserSummary>>(`/api/v1/admin/users${toQueryString(filters)}`, {}, { token }),
  getAdminUser: (token: string, userId: string) => request<AdminUserDetail>(`/api/v1/admin/users/${userId}`, {}, { token }),
  suspendAdminUser: (token: string, userId: string, payload: UserSuspensionPayload) => request<AdminUserDetail>(`/api/v1/admin/users/${userId}/suspend`, { method: "PATCH", body: JSON.stringify(payload) }, { token }),
  activateAdminUser: (token: string, userId: string) => request<AdminUserDetail>(`/api/v1/admin/users/${userId}/activate`, { method: "PATCH" }, { token }),
  getAdminListings: (token: string, filters: AdminListingFilters = {}) => request<AdminPagination<AdminListingSummary>>(`/api/v1/admin/listings${toQueryString(filters)}`, {}, { token }),
  getAdminListing: (token: string, listingId: string) => request<AdminListingDetail>(`/api/v1/admin/listings/${listingId}`, {}, { token }),
  suspendAdminListing: (token: string, listingId: string, payload: ListingSuspensionPayload) => request<AdminListingDetail>(`/api/v1/admin/listings/${listingId}/suspend`, { method: "PATCH", body: JSON.stringify(payload) }, { token }),
  restoreAdminListing: (token: string, listingId: string) => request<AdminListingDetail>(`/api/v1/admin/listings/${listingId}/restore`, { method: "PATCH" }, { token }),
  getAdminReports: (token: string, filters: AdminReportFilters = {}) => request<AdminPagination<AdminReportSummary>>(`/api/v1/admin/reports${toQueryString(filters)}`, {}, { token }),
  getAdminReport: (token: string, reportId: string) => request<AdminReportDetail>(`/api/v1/admin/reports/${reportId}`, {}, { token }),
  dismissAdminReport: (token: string, reportId: string, payload: AdminNotePayload) => request<AdminReportDetail>(`/api/v1/admin/reports/${reportId}/dismiss`, { method: "PATCH", body: JSON.stringify(payload) }, { token }),
  resolveAdminReport: (token: string, reportId: string, payload: ReportResolutionPayload) => request<AdminReportDetail>(`/api/v1/admin/reports/${reportId}/resolve`, { method: "PATCH", body: JSON.stringify(payload) }, { token }),
  getAdminAuditLogs: (token: string, filters: AdminAuditFilters = {}) => request<AdminPagination<AdminAuditLog>>(`/api/v1/admin/audit-logs${toQueryString(filters)}`, {}, { token }),};
