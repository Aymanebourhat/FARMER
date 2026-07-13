import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient, toQueryString } from "@/lib/api-client";

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


describe("marketplace query serialization", () => {
  it("omits empty filters and keeps server-side marketplace filters", () => {
    expect(toQueryString({ species: "sheep", min_price: "2000", page: 2, breed: "", province: undefined })).toBe("?species=sheep&min_price=2000&page=2");
  });
});

describe("vet API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serializes public vet filters without empty values", () => {
    expect(toQueryString({ region: "Marrakech-Safi", province: "", page: 2, sort: "name" })).toBe("?region=Marrakech-Safi&page=2&sort=name");
  });

  it("submits only the supported vet application multipart fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "vet", verification_status: "pending" }), { status: 201, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await apiClient.applyAsVet("token", { clinic_name: "Clinic", specialization: "Sheep", region: "Marrakech-Safi", province: "Marrakech", phone: "+212600000000", document: new File(["%PDF-"], "license.pdf", { type: "application/pdf" }) });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const form = init.body as FormData;
    expect(init.headers instanceof Headers && init.headers.has("Content-Type")).toBe(false);
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer token");
    expect([...form.keys()].sort()).toEqual(["clinic_name", "document", "phone", "province", "region", "specialization"]);
  });
});

describe("admin API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serializes user and listing filters on the server request", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ items: [], page: 2, page_size: 20, total: 0, pages: 0 }), { status: 200, headers: { "Content-Type": "application/json" } })));
    vi.stubGlobal("fetch", fetchMock);
    await apiClient.getAdminUsers("admin-token", { role: "farmer", status: "suspended", search: "Fatima", sort: "name", page: 2 });
    await apiClient.getAdminListings("admin-token", { region: "Marrakech-Safi", province: "Marrakech", species: "sheep", has_reports: true, sort: "most_reported" });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/admin/users?role=farmer&status=suspended&search=Fatima&sort=name&page=2");
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/v1/admin/listings?region=Marrakech-Safi&province=Marrakech&species=sheep&has_reports=true&sort=most_reported");
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers instanceof Headers && ((fetchMock.mock.calls[0][1] as RequestInit).headers as Headers).get("Authorization")).toBe("Bearer admin-token");
  });

  it("sends controlled moderation payloads and keeps audit logs read-only", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ id: "record" }), { status: 200, headers: { "Content-Type": "application/json" } })));
    vi.stubGlobal("fetch", fetchMock);
    await apiClient.suspendAdminUser("token", "user-id", { reason: "Repeated fraudulent activity" });
    await apiClient.resolveAdminReport("token", "report-id", { action: "suspend_listing", note: "Misleading information" });
    await apiClient.getAdminAuditLogs("token", { action: "user.suspended", sort: "oldest" });
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("PATCH");
    expect(JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body))).toEqual({ reason: "Repeated fraudulent activity" });
    expect(JSON.parse(String((fetchMock.mock.calls[1][1] as RequestInit).body))).toEqual({ action: "suspend_listing", note: "Misleading information" });
    expect((fetchMock.mock.calls[2][1] as RequestInit).method).toBeUndefined();
    expect(String(fetchMock.mock.calls[2][0])).toContain("/api/v1/admin/audit-logs?action=user.suspended&sort=oldest");
  });
});
