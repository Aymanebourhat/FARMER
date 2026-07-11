import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrowthScreen } from "@/components/animals/growth-screen";
import { ApiError } from "@/lib/api-client";
import { getDictionary } from "@/lib/i18n";
import type { Animal, WeightRecord } from "@/types/animal";

const mocks = vi.hoisted(() => ({ getAnimal: vi.fn(), listWeights: vi.fn(), createWeight: vi.fn(), authError: vi.fn(() => false) }));
vi.mock("@/lib/use-farmer-session", () => ({ useFarmerSession: () => ({ state: "ready", token: "token", handleApiError: mocks.authError }) }));
vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...original, apiClient: { ...original.apiClient, getAnimal: mocks.getAnimal, listWeights: mocks.listWeights, createWeight: mocks.createWeight } };
});

const animal: Animal = {
  id: "animal", farmer_id: "farmer", species: "goat", breed: null, sex: "female", birth_date: null, estimated_age_months: 10,
  color: null, identification_notes: null, health_status: "healthy", ownership_status: "owned", sale_readiness: "unknown",
  verification_level: "self_reported", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};
const record: WeightRecord = { id: "weight", animal_id: "animal", weight_kg: "42.50", recorded_at: "2026-01-01", note: null, created_at: "2026-01-01T00:00:00Z" };

describe("GrowthScreen", () => {
  beforeEach(() => {
    mocks.getAnimal.mockResolvedValue(animal);
    mocks.listWeights.mockResolvedValue([]);
    mocks.createWeight.mockReset();
  });
  afterEach(cleanup);

  it("shows the empty weight state", async () => {
    render(<GrowthScreen locale="en" dictionary={getDictionary("en")} animalId="animal" />);
    expect(await screen.findByText("No weight records")).toBeInTheDocument();
    expect(screen.getByText("Add at least two weight records to see a meaningful growth chart.")).toBeInTheDocument();
  });

  it("validates and adds a real weight record", async () => {
    mocks.createWeight.mockResolvedValue(record);
    render(<GrowthScreen locale="en" dictionary={getDictionary("en")} animalId="animal" />);
    await screen.findByText("No weight records");
    await userEvent.click(screen.getByRole("button", { name: "Add weight" }));
    await userEvent.click(screen.getByRole("button", { name: "Add measurement" }));
    expect(await screen.findByText("This field is required.")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("spinbutton"), "42.5");
    await userEvent.click(screen.getByRole("button", { name: "Add measurement" }));
    await waitFor(() => expect(mocks.createWeight).toHaveBeenCalled());
    expect(await screen.findByText("Weight measurement added.")).toBeInTheDocument();
    expect(screen.getAllByText("42.50 kg").length).toBeGreaterThan(0);
  });

  it("shows duplicate-date and API failures", async () => {
    mocks.createWeight.mockRejectedValue(new ApiError(409, "duplicate"));
    render(<GrowthScreen locale="en" dictionary={getDictionary("en")} animalId="animal" />);
    await screen.findByText("No weight records");
    await userEvent.click(screen.getByRole("button", { name: "Add weight" }));
    await userEvent.type(screen.getByRole("spinbutton"), "40");
    await userEvent.click(screen.getByRole("button", { name: "Add measurement" }));
    expect(await screen.findByText("A weight already exists for this date.")).toBeInTheDocument();
  });
});
