export type UserRole = "farmer" | "vet" | "admin";
export type BackendLanguage = "ar" | "fr";
export type LivestockType = "sheep" | "cow" | "goat" | "camel" | "other";
export type FarmSizeLabel = "small" | "medium" | "large";

export type AuthUser = {
  id: string;
  full_name: string;
  role: UserRole;
  phone_verified: boolean;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
};

export type RegisterPayload = {
  full_name: string;
  phone: string;
  password: string;
  role: Exclude<UserRole, "admin">;
  preferred_language: BackendLanguage;
};

export type LoginPayload = {
  phone: string;
  password: string;
};

export type FarmerProfile = {
  id: string;
  user_id: string;
  farm_name: string | null;
  region: string;
  province: string;
  commune: string | null;
  main_livestock_type: string | null;
  farm_size_label: string | null;
  profile_completion_score: number;
  created_at: string;
  updated_at: string;
};

export type FarmerProfilePayload = {
  farm_name?: string | null;
  region?: string | null;
  province?: string | null;
  commune?: string | null;
  main_livestock_type?: string | null;
  farm_size_label?: string | null;
};

