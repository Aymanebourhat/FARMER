import type { AnimalSex, SaleReadiness, Species } from "@/types/animal";

export type ListingStatus = "active" | "expired" | "sold" | "suspended" | "draft";
export type ReportReason = "fake" | "scam" | "wrong_price" | "sold" | "abusive" | "other";

export type MarketplacePhoto = { id: string; file_url: string; is_primary: boolean };
export type MarketplaceAnimal = {
  id: string; species: Species; breed: string | null; sex: AnimalSex;
  birth_date: string | null; estimated_age_months: number | null;
  sale_readiness: SaleReadiness; latest_weight_kg: string | null;
  primary_photo_url: string | null; photos: MarketplacePhoto[];
  verification_label: "Farmer-reported data";
};
export type MarketplaceListing = {
  id: string; title: string; description: string | null; price_mad: string;
  region: string; province: string; contact_phone: string; contact_whatsapp: string | null;
  status: ListingStatus; trust_score: number; expires_at: string; created_at: string;
  animal: MarketplaceAnimal;
};
export type OwnerMarketplaceListing = MarketplaceListing & { farmer_id: string; animal_id: string; updated_at: string };
export type PaginatedMarketplaceResponse<T extends MarketplaceListing = MarketplaceListing> = {
  items: T[]; page: number; page_size: number; total: number; pages: number;
};
export type MarketplaceFilters = {
  species?: Species; breed?: string; region?: string; province?: string;
  min_price?: string; max_price?: string; min_weight?: string; max_weight?: string;
  sex?: AnimalSex; sale_readiness?: SaleReadiness;
  sort?: "recent" | "newest" | "price_low_to_high" | "price_high_to_low" | "highest_trust";
  page?: number; page_size?: number;
};
export type OwnerListingFilters = { status?: ListingStatus; page?: number; page_size?: number };
export type CreateMarketplaceListingInput = {
  animal_id: string; title: string; description?: string | null; price_mad: string;
  contact_phone: string; contact_whatsapp?: string | null;
};
export type UpdateMarketplaceListingInput = Omit<Partial<CreateMarketplaceListingInput>, "animal_id">;
export type ReportListingInput = { reason: ReportReason; description?: string | null };
export type MarketplaceReport = { id: string; listing_id: string; reporter_user_id: string | null; reason: ReportReason; description: string | null; status: "pending" | string; created_at: string };
