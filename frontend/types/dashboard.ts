import type { Species } from "@/types/animal";

export type DashboardSpeciesCounts = Record<Species, number>;

export type DashboardLatestWeight = {
  animal_id: string;
  animal_label: string;
  weight_kg: string;
  recorded_at: string;
  note: string | null;
};

export type DashboardActivityType =
  | "animal_created"
  | "weight_recorded"
  | "health_recorded"
  | "photo_uploaded";

export type DashboardActivityItem = {
  type: DashboardActivityType;
  title: string;
  date: string;
  animal_id: string | null;
};

export type FarmerDashboard = {
  total_animals: number;
  animals_by_species: DashboardSpeciesCounts;
  active_listings: number;
  ready_for_sale: number;
  health_alerts: number;
  latest_weight_updates: DashboardLatestWeight[];
  recent_activity: DashboardActivityItem[];
};
