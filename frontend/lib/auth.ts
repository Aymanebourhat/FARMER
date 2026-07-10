import { apiClient } from "@/lib/api-client";
import type { AuthResponse, AuthUser } from "@/types/user";

const TOKEN_KEY = "fellahlink_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(response: AuthResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, response.access_token);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
}

export async function restoreSession(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  try {
    return await apiClient.me(token);
  } catch {
    clearAuthSession();
    return null;
  }
}
