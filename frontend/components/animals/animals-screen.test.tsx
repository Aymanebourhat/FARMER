import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnimalsScreen } from "@/components/animals/animals-screen";
import { ApiError } from "@/lib/api-client";
import { getDictionary } from "@/lib/i18n";
import type { Animal } from "@/types/animal";

const mocks = vi.hoisted(() => ({
  listAnimals: vi.fn(),
  handleApiError: vi.fn(() => false),
}));

vi.mock("@/lib/use-farmer-session", () => ({
  useFarmerSession: () => ({ state: "ready", token: "token", handleApiError: mocks.handleApiError }),
}));

vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...original, apiClient: { ...original.apiClient, listAnimals: mocks.listAnimals } };
});

const animal: Animal = {
  id: "animal-1",
  farmer_id: "farmer-1",
  species: "sheep",
  breed: "Sardi",
  sex: "male",
  birth_date: "2025-01-10",
  estimated_age_months: null,
  color: null,
  identification_notes: null,
  health_status: "healthy",
  ownership_status: "owned",
  sale_readiness: "not_ready",
  verification_level: "self_reported",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("AnimalsScreen", () => {
  beforeEach(() => {
    mocks.listAnimals.mockReset();
    mocks.handleApiError.mockClear();
  });
  afterEach(cleanup);

  it("shows a loading state", () => {
    mocks.listAnimals.mockReturnValue(new Promise(() => undefined));
    render(<AnimalsScreen locale="en" dictionary={getDictionary("en")} />);
    expect(screen.getByLabelText("Loading your animals...")).toBeInTheDocument();
  });

  it("shows the guided empty state", async () => {
    mocks.listAnimals.mockResolvedValue([]);
    render(<AnimalsScreen locale="en" dictionary={getDictionary("en")} />);
    expect(await screen.findByText("No animals registered")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Add animal" }).length).toBeGreaterThan(0);
  });

  it("renders animals returned by the API", async () => {
    mocks.listAnimals.mockResolvedValue([animal]);
    render(<AnimalsScreen locale="en" dictionary={getDictionary("en")} />);
    expect(await screen.findByText("Sheep · Sardi")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View animal" })).toHaveAttribute("href", "/en/animals/animal-1");
  });

  it("shows API failures and retries", async () => {
    mocks.listAnimals.mockRejectedValueOnce(new ApiError(500, "Server unavailable")).mockResolvedValueOnce([]);
    render(<AnimalsScreen locale="en" dictionary={getDictionary("en")} />);
    expect(await screen.findByText("Server unavailable")).toBeInTheDocument();
    screen.getByRole("button", { name: "Try again" }).click();
    await waitFor(() => expect(mocks.listAnimals).toHaveBeenCalledTimes(2));
  });
});
