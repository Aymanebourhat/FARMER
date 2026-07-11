"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { ApiError, apiClient } from "@/lib/api-client";
import { clearAuthSession, getAccessToken, restoreSession } from "@/lib/auth";
import { isRtlLocale, type Dictionary, type Locale } from "@/lib/i18n";
import type { AuthUser, FarmerProfile } from "@/types/user";

type DashboardScreenProps = {
  locale: Locale;
  dictionary: Dictionary;
};

type LoadState = "loading" | "ready" | "error";

export function DashboardScreen({ locale, dictionary }: DashboardScreenProps) {
  const router = useRouter();
  const isRtl = isRtlLocale(locale);
  const dashboard = dictionary.dashboard;
  const common = dictionary.common;
  const [state, setState] = useState<LoadState>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setState("loading");
    setError("");
    const sessionUser = await restoreSession();
    if (!sessionUser) {
      router.replace(`/${locale}/login`);
      return;
    }

    setUser(sessionUser);
    if (sessionUser.role === "farmer") {
      const token = getAccessToken();
      if (!token) {
        router.replace(`/${locale}/login`);
        return;
      }
      try {
        setProfile(await apiClient.getFarmerProfile(token));
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.detail : common.error);
        setState("error");
        return;
      }
    }

    setState("ready");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = () => {
    clearAuthSession();
    router.push(`/${locale}/login`);
  };

  if (state === "loading") {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-secondary-container bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm font-bold text-primary">{common.loading}</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-error/20 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-black text-error">{common.error}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:bg-primary-container"
          >
            {common.retry}
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const completion = user.role === "farmer" ? profile?.profile_completion_score ?? 0 : 0;
  const profileReady = user.role === "farmer" && profile !== null;

  return (
    <div className="animate-page-in space-y-8 py-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-2xl border border-secondary-container bg-white p-6 shadow-sm md:col-span-12 lg:col-span-4">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 size-32 rounded-bl-full bg-primary-container opacity-5 transition-transform duration-500 group-hover:scale-[1.15]" />
          <div className={isRtl ? "text-right" : "text-left"}>
            <h1 className="text-xl font-black tracking-tight text-primary sm:text-2xl">{dashboard.welcomeBack}</h1>
            <p className="mt-1 text-xs font-medium text-on-surface-variant/90">{dashboard.summaryStatus}</p>
          </div>
          <div className={`mt-6 flex items-center justify-between border-t border-surface-variant/40 pt-4 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div className={isRtl ? "text-right" : "text-left"}>
              <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-on-surface-variant/80">
                {dashboard.profileCompletion}
              </span>
              <span className="text-xl font-extrabold text-primary">{completion}%</span>
            </div>
            <VerifiedIcon />
          </div>
        </div>

        <div className="grid gap-4 md:col-span-12 md:grid-cols-3 lg:col-span-8">
          <MetricCard title={dashboard.accountRole} value={user.role} icon={<UserIcon />} />
          <MetricCard title={dashboard.sessionStatus} value={dashboard.protectedTitle} icon={<SessionIcon />} />
          <MetricCard
            title={dashboard.phoneVerified}
            value={user.phone_verified ? dashboard.verified : dashboard.notVerified}
            icon={<PhoneIcon error={!user.phone_verified} />}
            error={!user.phone_verified}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-secondary-container bg-white shadow-sm lg:col-span-2">
          <div className={`flex items-center justify-between border-b border-secondary-container bg-[#F5EBE0] px-6 py-4 ${isRtl ? "flex-row-reverse" : ""}`}>
            <h2 className="text-sm font-black uppercase tracking-wider text-primary">
              {profileReady ? dashboard.profileReadyTitle : dashboard.profileMissingTitle}
            </h2>
          </div>

          <div className="flex min-h-[320px] flex-col items-center justify-center space-y-5 p-8 text-center sm:p-12">
            <div className="flex size-20 items-center justify-center rounded-full border border-secondary-container/40 bg-surface-container-high">
              <InboxIcon />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-base font-black text-on-surface">
                {profileReady ? dashboard.profileReadyTitle : dashboard.profileMissingTitle}
              </h3>
              <p className="text-xs leading-relaxed text-on-surface-variant/90">
                {profileReady ? dashboard.profileReadyDescription : dashboard.profileMissingDescription}
              </p>
            </div>
            {user.role === "farmer" ? (
              <Link
                href={`/${locale}/profile`}
                className="rounded-xl bg-primary-container px-6 py-3 text-xs font-bold text-on-primary shadow-md transition-all hover:bg-primary-container/90"
              >
                {profileReady ? dashboard.viewProfile : dashboard.completeProfile}
              </Link>
            ) : (
              <p className="max-w-md rounded-xl border border-secondary-container bg-surface-container-low p-4 text-xs font-semibold text-secondary">
                {dictionary.profile.farmerOnlyDescription}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-secondary-container bg-white shadow-sm">
            <div className={`border-b border-secondary-container bg-[#F5EBE0] px-6 py-4 ${isRtl ? "text-right" : "text-left"}`}>
              <h2 className="text-sm font-black uppercase tracking-wider text-primary">
                {dashboard.phaseNoticeTitle}
              </h2>
            </div>
            <div className={`p-6 ${isRtl ? "text-right" : "text-left"}`}>
              <p className="text-xs leading-relaxed text-on-surface-variant/90">{dashboard.phaseNotice}</p>
              <button
                type="button"
                onClick={signOut}
                className="mt-6 w-full rounded-xl bg-error-container/20 py-2.5 text-xs font-bold text-error transition-all hover:bg-error-container/40"
              >
                {common.signOut}
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ title, value, icon, error = false }: { title: string; value: string; icon: React.ReactNode; error?: boolean }) {
  return (
    <div className="flex min-h-40 flex-col justify-between rounded-2xl border border-secondary-container bg-white p-5 shadow-sm transition-all hover:border-primary/20">
      <div className="mb-4 flex items-start justify-between">
        <div className={`${error ? "bg-error-container/30" : "bg-surface-container"} rounded-xl p-2.5`}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`mb-1 text-xl font-black leading-tight ${error ? "text-error" : "text-primary"}`}>{value}</p>
        <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/85">{title}</p>
      </div>
    </div>
  );
}

function SvgIcon({ children, className = "size-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function VerifiedIcon() {
  return <SvgIcon className="size-8 shrink-0 text-primary-container"><path d="M12 3 4 6.5v5.2c0 4.2 3.2 8 8 9.3 4.8-1.3 8-5.1 8-9.3V6.5L12 3Z" /><path d="m8.8 12 2.1 2.1 4.5-5" /></SvgIcon>;
}

function UserIcon() {
  return <SvgIcon className="size-5 text-primary"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></SvgIcon>;
}

function SessionIcon() {
  return <SvgIcon className="size-5 text-primary"><path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6" /><path d="M15 7h4v4" /></SvgIcon>;
}

function PhoneIcon({ error }: { error: boolean }) {
  return <SvgIcon className={`size-5 ${error ? "text-error" : "text-primary"}`}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6A2 2 0 0 1 22 16.9Z" /></SvgIcon>;
}

function InboxIcon() {
  return <SvgIcon className="size-9 text-outline"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="m5.5 5 3-3h7l3 3" /><path d="M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6L18.5 5h-13L2 12Z" /></SvgIcon>;
}



