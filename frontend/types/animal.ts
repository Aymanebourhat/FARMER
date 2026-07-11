export type Species = "sheep" | "cow" | "goat" | "camel" | "other";
export type AnimalSex = "male" | "female" | "unknown";
export type AnimalHealthStatus = "healthy" | "sick" | "recovering" | "unknown";
export type AnimalOwnershipStatus = "owned" | "listed" | "reserved" | "sold" | "dead";
export type SaleReadiness = "not_ready" | "ready" | "unknown";
export type VerificationLevel = "self_reported" | "admin_reviewed" | "vet_verified";
export type HealthRecordType = "vaccine" | "illness" | "treatment" | "checkup" | "note";
export type HealthVerificationStatus = "farmer_reported" | "vet_verified";

export type Animal = {
  id: string;
  farmer_id: string;
  species: Species;
  breed: string | null;
  sex: AnimalSex;
  birth_date: string | null;
  estimated_age_months: number | null;
  color: string | null;
  identification_notes: string | null;
  health_status: AnimalHealthStatus;
  ownership_status: AnimalOwnershipStatus;
  sale_readiness: SaleReadiness;
  verification_level: VerificationLevel;
  created_at: string;
  updated_at: string;
};

export type AnimalCreateInput = {
  species: Species;
  breed?: string | null;
  sex: AnimalSex;
  birth_date?: string | null;
  estimated_age_months?: number | null;
  color?: string | null;
  identification_notes?: string | null;
  health_status: AnimalHealthStatus;
  ownership_status?: AnimalOwnershipStatus;
  sale_readiness: SaleReadiness;
};

export type AnimalUpdateInput = Partial<AnimalCreateInput>;

export type AnimalHistoryEvent = {
  event_type: "animal_created" | "weight_recorded" | "health_recorded" | "photo_uploaded" | string;
  occurred_at: string;
  data: Record<string, unknown>;
};

export type AnimalPhoto = {
  id: string;
  animal_id: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  is_primary: boolean;
  uploaded_at: string;
};

export type WeightRecord = {
  id: string;
  animal_id: string;
  weight_kg: string;
  recorded_at: string;
  note: string | null;
  created_at: string;
};

export type WeightRecordCreateInput = { weight_kg: number; recorded_at: string; note?: string | null };

export type HealthRecord = {
  id: string;
  animal_id: string;
  record_type: HealthRecordType;
  title: string;
  description: string | null;
  medicine_name: string | null;
  vet_id: string | null;
  verification_status: HealthVerificationStatus;
  recorded_at: string;
  next_reminder_at: string | null;
  created_at: string;
};

export type HealthRecordCreateInput = {
  record_type: HealthRecordType;
  title: string;
  description?: string | null;
  medicine_name?: string | null;
  recorded_at: string;
  next_reminder_at?: string | null;
};
