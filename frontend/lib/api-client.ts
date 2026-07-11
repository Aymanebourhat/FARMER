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
};
