"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api-client";
import { clearAuthSession, getAccessToken, restoreSession } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

export function useAdminSession(locale: Locale) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "forbidden">("loading");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void restoreSession().then((user) => {
      if (!active) return;
      if (!user) { router.replace(`/${locale}/login`); return; }
      if (user.role !== "admin") { setState("forbidden"); return; }
      const saved = getAccessToken();
      if (!saved) { router.replace(`/${locale}/login`); return; }
      setToken(saved);
      setState("ready");
    });
    return () => { active = false; };
  }, [locale, router]);

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession();
      router.replace(`/${locale}/login`);
      return true;
    }
    return false;
  }, [locale, router]);

  return { state, token, handleApiError };
}
