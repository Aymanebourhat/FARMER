import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { ApiError } from "@/lib/api-client";
import { getDictionary } from "@/lib/i18n";
import type { FarmerDashboard } from "@/types/dashboard";

const mocks = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  handleApiError: vi.fn(() => false),
  sessionState: { value: "ready" as "loading" | "ready" | "forbidden" },
}));

vi.mock("@/lib/use-farmer-session", () => ({
  useFarmerSession: () => ({
    state: mocks.sessionState.value,
    token: "token",
    handleApiError: mocks.handleApiError,
  }),
}));

vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...original,
    apiClient: {
      ...original.apiClient,
      getFarmerDashboard: mocks.getDashboard,
    },
  };
});

const emptyDashboard: FarmerDashboard = {
  total_animals: 0,
  animals_by_species: { sheep: 0, cow: 0, goat: 0, camel: 0, other: 0 },
  active_listings: 0,
  ready_for_sale: 0,
  health_alerts: 0,
  latest_weight_updates: [],
  recent_activity: [],
};

describe("DashboardScreen", () => {
  beforeEach(() => {
    mocks.getDashboard.mockReset();
    mocks.handleApiError.mockClear();
    mocks.sessionState.value = "ready";
  });
  afterEach(cleanup);

  it("shows loading skeletons while real metrics are requested", () => {
    mocks.getDashboard.mockReturnValue(new Promise(() => undefined));
    render(<DashboardScreen locale="en" dictionary={getDictionary("en")} />);

    expect(screen.getByRole("status", { name: "Loading..." })).toBeInTheDocument();
  });

  it("shows zero metrics and useful empty states", async () => {
    mocks.getDashboard.mockResolvedValue(emptyDashboard);
    render(<DashboardScreen locale="en" dictionary={getDictionary("en")} />);

    expect(await screen.findByText("No species data yet")).toBeInTheDocument();
    expect(screen.getByText("No weight updates yet")).toBeInTheDocument();
    expect(screen.getByText("No recent activity")).toBeInTheDocument();
    expect(screen.getByText("My listings")).toBeInTheDocument();
  });

  it("renders real counts, species, weights, and recent activity", async () => {
    mocks.getDashboard.mockResolvedValue({
      total_animals: 3,
      animals_by_species: { sheep: 2, cow: 0, goat: 1, camel: 0, other: 0 },
      active_listings: 0,
      ready_for_sale: 2,
      health_alerts: 1,
      latest_weight_updates: [
        {
          animal_id: "animal-1",
          animal_label: "Sardi",
          weight_kg: "42.50",
          recorded_at: "2026-07-10",
          note: "Monthly check",
        },
      ],
      recent_activity: [
        {
          type: "health_recorded",
          title: "PPR vaccination",
          date: "2026-07-10",
          animal_id: "animal-1",
        },
      ],
    } satisfies FarmerDashboard);
    render(<DashboardScreen locale="en" dictionary={getDictionary("en")} />);

    expect(await screen.findByText("42.50 kg")).toBeInTheDocument();
    expect(screen.getByText("Monthly check")).toBeInTheDocument();
    expect(screen.getByText("PPR vaccination")).toBeInTheDocument();
    expect(screen.getByText("Due health reminders").closest("article")).toHaveTextContent("1");
    expect(screen.getByText("Total animals").closest("article")).toHaveTextContent("3");
    expect(screen.getByText("Sheep").parentElement).toHaveTextContent("2");
  });

  it("shows API failures and supports retry", async () => {
    mocks.getDashboard
      .mockRejectedValueOnce(new ApiError(500, "Dashboard unavailable"))
      .mockResolvedValueOnce(emptyDashboard);
    render(<DashboardScreen locale="en" dictionary={getDictionary("en")} />);

    expect(await screen.findByText("Dashboard unavailable")).toBeInTheDocument();
    screen.getByRole("button", { name: "Try again" }).click();
    await waitFor(() => expect(mocks.getDashboard).toHaveBeenCalledTimes(2));
  });

  it("shows the farmer-only state for non-farmer sessions", () => {
    mocks.sessionState.value = "forbidden";
    render(<DashboardScreen locale="en" dictionary={getDictionary("en")} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Farmer dashboard access required");
    expect(mocks.getDashboard).not.toHaveBeenCalled();
  });
});
