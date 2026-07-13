import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAdminSession } from "@/lib/use-admin-session";

const { replace, restoreSession, getAccessToken } = vi.hoisted(() => ({
  replace: vi.fn(),
  restoreSession: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/auth", () => ({
  clearAuthSession: vi.fn(),
  getAccessToken,
  restoreSession,
}));

describe("useAdminSession", () => {
  beforeEach(() => {
    replace.mockReset();
    restoreSession.mockReset();
    getAccessToken.mockReset();
  });

  it("redirects unauthenticated visitors through the locale login flow", async () => {
    restoreSession.mockResolvedValue(null);
    renderHook(() => useAdminSession("fr"));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/fr/login"));
  });

  it("returns a forbidden state for authenticated non-admin users", async () => {
    restoreSession.mockResolvedValue({ id: "farmer", full_name: "Farmer", role: "farmer", phone_verified: true });
    const { result } = renderHook(() => useAdminSession("ar"));
    await waitFor(() => expect(result.current.state).toBe("forbidden"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("allows admin users only when the existing session token is present", async () => {
    restoreSession.mockResolvedValue({ id: "admin", full_name: "Admin", role: "admin", phone_verified: true });
    getAccessToken.mockReturnValue("admin-token");
    const { result } = renderHook(() => useAdminSession("en"));
    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.token).toBe("admin-token");
  });
});