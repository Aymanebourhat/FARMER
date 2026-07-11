import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HealthScreen } from "@/components/animals/health-screen";
import { ApiError } from "@/lib/api-client";
import { getDictionary } from "@/lib/i18n";
import type { Animal, HealthRecord } from "@/types/animal";

const mocks = vi.hoisted(() => ({ getAnimal: vi.fn(), listHealth: vi.fn(), createHealth: vi.fn(), authError: vi.fn(() => false) }));
vi.mock("@/lib/use-farmer-session", () => ({ useFarmerSession: () => ({ state: "ready", token: "token", handleApiError: mocks.authError }) }));
vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...original, apiClient: { ...original.apiClient, getAnimal: mocks.getAnimal, listHealthRecords: mocks.listHealth, createHealthRecord: mocks.createHealth } };
});

const animal: Animal = {
  id: "animal", farmer_id: "farmer", species: "sheep", breed: "Sardi", sex: "male", birth_date: "2025-01-01", estimated_age_months: null,
  color: null, identification_notes: null, health_status: "recovering", ownership_status: "owned", sale_readiness: "not_ready",
  verification_level: "self_reported", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};
const record = (id: string, type: HealthRecord["record_type"], reminder: string | null): HealthRecord => ({
  id, animal_id: "animal", record_type: type, title: id === "vaccine" ? "PPR vaccination" : "Observation",
  description: null, medicine_name: null, vet_id: null, verification_status: "farmer_reported",
  recorded_at: "2026-01-01", next_reminder_at: reminder, created_at: "2026-01-01T00:00:00Z",
});

describe("HealthScreen", () => {
  beforeEach(() => {
    mocks.getAnimal.mockResolvedValue(animal);
    mocks.listHealth.mockResolvedValue([record("vaccine", "vaccine", "2099-12-01"), record("note", "note", null)]);
    mocks.createHealth.mockReset();
  });
  afterEach(cleanup);

  it("displays reminders and filters record types", async () => {
    render(<HealthScreen locale="en" dictionary={getDictionary("en")} animalId="animal" />);
    expect((await screen.findAllByText("PPR vaccination")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Reminder on/).length).toBeGreaterThan(0);
    const noteFilter = screen.getByRole("button", { name: "General note" });
    await userEvent.click(noteFilter);
    expect(screen.getByText("Observation")).toBeInTheDocument();
    expect(noteFilter).toHaveAttribute("aria-pressed", "true");
  });

  it("validates and adds a health record", async () => {
    const added = record("added", "checkup", "2099-12-02");
    mocks.createHealth.mockResolvedValue(added);
    render(<HealthScreen locale="en" dictionary={getDictionary("en")} animalId="animal" />);
    await screen.findAllByText("PPR vaccination");
    await userEvent.click(screen.getByRole("button", { name: "Add health record" }));
    await userEvent.click(screen.getByRole("button", { name: "Add record" }));
    expect(await screen.findByText("This field is required.")).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText("Short factual title"), "Annual checkup");
    await userEvent.click(screen.getByRole("button", { name: "Add record" }));
    await waitFor(() => expect(mocks.createHealth).toHaveBeenCalled());
    expect(await screen.findByText("Health record added.")).toBeInTheDocument();
  });

  it("shows API failures", async () => {
    mocks.createHealth.mockRejectedValue(new ApiError(422, "Invalid health record"));
    render(<HealthScreen locale="en" dictionary={getDictionary("en")} animalId="animal" />);
    await screen.findAllByText("PPR vaccination");
    await userEvent.click(screen.getByRole("button", { name: "Add health record" }));
    await userEvent.type(screen.getByLabelText("Title"), "Check");
    await userEvent.click(screen.getByRole("button", { name: "Add record" }));
    expect(await screen.findByText("Invalid health record")).toBeInTheDocument();
  });
});
