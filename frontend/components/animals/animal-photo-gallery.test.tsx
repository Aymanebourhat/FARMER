import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnimalPhotoGallery } from "@/components/animals/animal-photo-gallery";
import { getDictionary } from "@/lib/i18n";
import type { Animal, AnimalPhoto } from "@/types/animal";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  upload: vi.fn(),
  setPrimary: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...original,
    apiClient: {
      ...original.apiClient,
      listAnimalPhotos: mocks.list,
      uploadAnimalPhoto: mocks.upload,
      setPrimaryAnimalPhoto: mocks.setPrimary,
      deleteAnimalPhoto: mocks.remove,
    },
  };
});

const animal: Animal = {
  id: "animal", farmer_id: "farmer", species: "sheep", breed: "Sardi", sex: "male",
  birth_date: "2025-01-01", estimated_age_months: null, color: null, identification_notes: null,
  health_status: "healthy", ownership_status: "owned", sale_readiness: "not_ready",
  verification_level: "self_reported", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};
const photo = (id: string, primary: boolean): AnimalPhoto => ({
  id, animal_id: animal.id, file_url: `/uploads/${id}.jpg`, mime_type: "image/jpeg", size_bytes: 1000, is_primary: primary, uploaded_at: "2026-01-01T00:00:00Z",
});

describe("AnimalPhotoGallery", () => {
  afterEach(cleanup);
  beforeEach(() => {
    mocks.list.mockReset();
    mocks.upload.mockReset();
    mocks.setPrimary.mockReset();
    mocks.remove.mockReset();
  });

  it("sets a different primary photo", async () => {
    const photos = [photo("one", true), photo("two", false)];
    mocks.list.mockResolvedValue(photos);
    mocks.setPrimary.mockResolvedValue({ ...photos[1], is_primary: true });
    render(<AnimalPhotoGallery animal={animal} token="token" dictionary={getDictionary("en")} onAuthError={() => false} />);
    await userEvent.click(await screen.findByRole("button", { name: "Set as primary" }));
    await waitFor(() => expect(mocks.setPrimary).toHaveBeenCalledWith("token", "animal", "two"));
    expect(await screen.findByText("Primary photo updated.")).toBeInTheDocument();
  });

  it("requires confirmation before deleting a photo", async () => {
    mocks.list.mockResolvedValueOnce([photo("one", true)]).mockResolvedValueOnce([]);
    mocks.remove.mockResolvedValue(undefined);
    render(<AnimalPhotoGallery animal={animal} token="token" dictionary={getDictionary("en")} onAuthError={() => false} />);
    await userEvent.click(await screen.findByRole("button", { name: "Delete photo" }));
    expect(mocks.remove).not.toHaveBeenCalled();
    const deleteButtons = screen.getAllByRole("button", { name: "Delete photo" });
    await userEvent.click(deleteButtons.at(-1)!);
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("token", "animal", "one"));
  });

  it("shows upload failures without inventing progress", async () => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    mocks.list.mockResolvedValue([]);
    mocks.upload.mockRejectedValue(new Error("offline"));
    render(<AnimalPhotoGallery animal={animal} token="token" dictionary={getDictionary("en")} onAuthError={() => false} />);
    const input = await screen.findByLabelText("Choose photo");
    await userEvent.upload(input, new File(["image"], "animal.jpg", { type: "image/jpeg" }));
    await userEvent.click(screen.getByRole("button", { name: "Upload photo" }));
    expect(await screen.findByText("The photo could not be uploaded.")).toBeInTheDocument();
  });
});
