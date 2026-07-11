import { z } from "zod";

import type { Animal, AnimalHistoryEvent, AnimalPhoto, HealthRecord, WeightRecord } from "@/types/animal";

export const speciesValues = ["sheep", "cow", "goat", "camel", "other"] as const;
export const sexValues = ["male", "female", "unknown"] as const;
export const healthStatusValues = ["healthy", "sick", "recovering", "unknown"] as const;
export const ownershipStatusValues = ["owned", "listed", "reserved", "sold", "dead"] as const;
export const saleReadinessValues = ["not_ready", "ready", "unknown"] as const;
export const healthRecordTypeValues = ["vaccine", "illness", "treatment", "checkup", "note"] as const;
export const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxAnimalPhotoBytes = 10 * 1024 * 1024;
export const maxAnimalPhotos = 5;

type ValidationMessages = {
  required: string;
  positive: string;
  futureDate: string;
  chooseAge: string;
};

export function createAnimalFormSchema(messages: ValidationMessages) {
  return z
    .object({
      species: z.enum(speciesValues),
      breed: z.string().max(120).optional(),
      sex: z.enum(sexValues),
      age_mode: z.enum(["birth_date", "estimated"]),
      birth_date: z.string().optional(),
      estimated_age_months: z.string().optional(),
      color: z.string().max(120).optional(),
      health_status: z.enum(healthStatusValues),
      sale_readiness: z.enum(saleReadinessValues),
      identification_notes: z.string().optional(),
    })
    .superRefine((value, context) => {
      if (value.age_mode === "birth_date") {
        if (!value.birth_date) {
          context.addIssue({ code: "custom", path: ["birth_date"], message: messages.chooseAge });
        } else if (value.birth_date > localToday()) {
          context.addIssue({ code: "custom", path: ["birth_date"], message: messages.futureDate });
        }
      } else {
        const months = Number(value.estimated_age_months);
        if (!value.estimated_age_months) {
          context.addIssue({ code: "custom", path: ["estimated_age_months"], message: messages.chooseAge });
        } else if (!Number.isInteger(months) || months <= 0) {
          context.addIssue({ code: "custom", path: ["estimated_age_months"], message: messages.positive });
        }
      }
    });
}

export type AnimalFormValues = z.infer<ReturnType<typeof createAnimalFormSchema>>;

export function animalFormDefaults(animal?: Animal): AnimalFormValues {
  const exact = Boolean(animal?.birth_date);
  return {
    species: animal?.species ?? "sheep",
    breed: animal?.breed ?? "",
    sex: animal?.sex ?? "unknown",
    age_mode: exact ? "birth_date" : "estimated",
    birth_date: animal?.birth_date ?? "",
    estimated_age_months: animal?.estimated_age_months?.toString() ?? "",
    color: animal?.color ?? "",
    health_status: animal?.health_status ?? "healthy",
    sale_readiness: animal?.sale_readiness ?? "unknown",
    identification_notes: animal?.identification_notes ?? "",
  };
}

export function toAnimalPayload(values: AnimalFormValues) {
  const exact = values.age_mode === "birth_date";
  return {
    species: values.species,
    breed: values.breed?.trim() || null,
    sex: values.sex,
    birth_date: exact ? values.birth_date || null : null,
    estimated_age_months: exact ? null : Number(values.estimated_age_months),
    color: values.color?.trim() || null,
    health_status: values.health_status,
    sale_readiness: values.sale_readiness,
    identification_notes: values.identification_notes?.trim() || null,
  };
}

export function localToday(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function sortWeights(records: WeightRecord[]): WeightRecord[] {
  return [...records].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
}

export function sortHealthNewest(records: HealthRecord[]): HealthRecord[] {
  return [...records].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
}

export function filterHealthRecords(records: HealthRecord[], type: "all" | HealthRecord["record_type"]): HealthRecord[] {
  return type === "all" ? records : records.filter((record) => record.record_type === type);
}

export function upcomingReminders(records: HealthRecord[], today = localToday()): HealthRecord[] {
  return records
    .filter((record) => record.next_reminder_at && record.next_reminder_at >= today)
    .sort((a, b) => (a.next_reminder_at ?? "").localeCompare(b.next_reminder_at ?? ""));
}

export function sortHistoryNewest(events: AnimalHistoryEvent[]): AnimalHistoryEvent[] {
  return [...events].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));
}

export function primaryPhoto(photos: AnimalPhoto[]): AnimalPhoto | null {
  return photos.find((photo) => photo.is_primary) ?? photos[0] ?? null;
}

export type PhotoValidationError = "unsupported" | "oversized" | "maximum";

export function validatePhoto(file: Pick<File, "type" | "size">, photoCount: number): PhotoValidationError | null {
  if (photoCount >= maxAnimalPhotos) return "maximum";
  if (!allowedPhotoTypes.includes(file.type as (typeof allowedPhotoTypes)[number])) return "unsupported";
  if (file.size > maxAnimalPhotoBytes) return "oversized";
  return null;
}
