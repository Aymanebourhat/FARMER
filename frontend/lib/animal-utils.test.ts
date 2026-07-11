import { describe, expect, it } from "vitest";

import {
  createAnimalFormSchema,
  filterHealthRecords,
  maxAnimalPhotoBytes,
  sortWeights,
  toAnimalPayload,
  upcomingReminders,
  validatePhoto,
  type AnimalFormValues,
} from "@/lib/animal-utils";
import { getDictionary, isRtlLocale } from "@/lib/i18n";
import type { HealthRecord, WeightRecord } from "@/types/animal";

const messages = { required: "required", positive: "positive", futureDate: "future", chooseAge: "choose age" };
const base: AnimalFormValues = {
  species: "sheep",
  breed: "",
  sex: "male",
  age_mode: "birth_date",
  birth_date: "2025-01-01",
  estimated_age_months: "",
  color: "",
  health_status: "healthy",
  sale_readiness: "not_ready",
  identification_notes: "",
};

describe("animal form age rules", () => {
  it("accepts an exact birth date and clears estimated age", () => {
    expect(createAnimalFormSchema(messages).safeParse(base).success).toBe(true);
    expect(toAnimalPayload({ ...base, estimated_age_months: "10" })).toMatchObject({ birth_date: "2025-01-01", estimated_age_months: null });
  });

  it("accepts a positive estimated age and clears birth date", () => {
    const estimated = { ...base, age_mode: "estimated" as const, birth_date: "2025-01-01", estimated_age_months: "12" };
    expect(createAnimalFormSchema(messages).safeParse(estimated).success).toBe(true);
    expect(toAnimalPayload(estimated)).toMatchObject({ birth_date: null, estimated_age_months: 12 });
  });

  it("rejects a missing selected age and invalid estimated values", () => {
    expect(createAnimalFormSchema(messages).safeParse({ ...base, birth_date: "" }).success).toBe(false);
    expect(createAnimalFormSchema(messages).safeParse({ ...base, age_mode: "estimated", estimated_age_months: "0" }).success).toBe(false);
  });
});

describe("photo validation", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (type) => {
    expect(validatePhoto({ type, size: 1024 }, 0)).toBeNull();
  });
  it("rejects unsupported, oversized, and sixth photos", () => {
    expect(validatePhoto({ type: "image/gif", size: 1024 }, 0)).toBe("unsupported");
    expect(validatePhoto({ type: "image/jpeg", size: maxAnimalPhotoBytes + 1 }, 0)).toBe("oversized");
    expect(validatePhoto({ type: "image/jpeg", size: 1024 }, 5)).toBe("maximum");
  });
});

const weight = (id: string, date: string, value: string): WeightRecord => ({
  id, animal_id: "animal", recorded_at: date, weight_kg: value, note: null, created_at: `${date}T00:00:00Z`,
});

const health = (id: string, type: HealthRecord["record_type"], reminder: string | null): HealthRecord => ({
  id, animal_id: "animal", record_type: type, title: id, description: null, medicine_name: null, vet_id: null,
  verification_status: "farmer_reported", recorded_at: "2026-01-01", next_reminder_at: reminder, created_at: "2026-01-01T00:00:00Z",
});

describe("real record calculations", () => {
  it("sorts weight records chronologically for the chart", () => {
    expect(sortWeights([weight("2", "2026-02-01", "45.0"), weight("1", "2026-01-01", "42.0")]).map((item) => item.id)).toEqual(["1", "2"]);
  });
  it("filters health records and returns only future reminders in date order", () => {
    const records = [health("v", "vaccine", "2026-08-01"), health("n", "note", null), health("old", "checkup", "2026-01-01")];
    expect(filterHealthRecords(records, "vaccine").map((item) => item.id)).toEqual(["v"]);
    expect(upcomingReminders(records, "2026-07-01").map((item) => item.id)).toEqual(["v"]);
  });
});

describe("localization", () => {
  it("loads English, French, Arabic, and Darija dictionaries", () => {
    expect(getDictionary("en").animals.title).toBe("Livestock registry");
    expect(getDictionary("fr").animals.addAnimal).toBeTruthy();
    expect(getDictionary("ar").animals.addAnimal).toBeTruthy();
    expect(getDictionary("ary").animals.addAnimal).toBeTruthy();
  });
  it("marks Arabic and Darija RTL while English and French remain LTR", () => {
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("ary")).toBe(true);
    expect(isRtlLocale("fr")).toBe(false);
    expect(isRtlLocale("en")).toBe(false);
  });
});
