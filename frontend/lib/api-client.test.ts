import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api-client";

describe("apiClient multipart handling", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lets the browser set the multipart boundary for photo uploads", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "photo", animal_id: "animal", file_url: "/uploads/photo.jpg", mime_type: "image/jpeg",
          size_bytes: 100, is_primary: true, uploaded_at: "2026-01-01T00:00:00Z",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    await apiClient.uploadAnimalPhoto("token", "animal", new File(["jpeg"], "animal.jpg", { type: "image/jpeg" }));
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Headers;
    expect(init.body).toBeInstanceOf(FormData);
    expect(headers.has("Content-Type")).toBe(false);
    expect(headers.get("Authorization")).toBe("Bearer token");
  });
});
