"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ApiError, apiClient } from "@/lib/api-client";
import { clearAuthSession } from "@/lib/auth";
import { dateLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { useFarmerSession } from "@/lib/use-farmer-session";
import type { Species } from "@/types/animal";
import type {
  DashboardActivityItem,
  DashboardActivityType,
  FarmerDashboard,
} from "@/types/dashboard";

type DashboardScreenProps = {
  locale: Locale;
  dictionary: Dictionary;
};

const speciesOrder: Species[] = ["sheep", "cow", "goat", "camel", "other"];

export function DashboardScreen({ locale, dictionary }: DashboardScreenProps) {
  const { state: sessionState, token, handleApiError } = useFarmerSession(locale);
  const [dashboardData, setDashboardData] = useState<FarmerDashboard | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const text = dictionary.dashboard;

  const load = useCallback(async () => {
    if (!token) return;
    setState("loading");
    setError("");
    try {
      setDashboardData(await apiClient.getFarmerDashboard(token));
      setState("ready");
    } catch (loadError) {
      if (handleApiError(loadError)) return;
      setError(loadError instanceof ApiError ? loadError.detail : text.loadError);
      setState("error");
    }
  }, [handleApiError, text.loadError, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (sessionState === "forbidden") {
    return <DashboardError title={text.farmerOnlyTitle} message={text.farmerOnlyDescription} />;
  }
  if (sessionState === "loading" || state === "loading") {
    return <DashboardLoading label={dictionary.common.loading} />;
  }
  if (state === "error" || !dashboardData) {
    return (
      <DashboardError
        title={dictionary.common.error}
        message={error || text.loadError}
        retry={load}
        retryLabel={dictionary.common.retry}
      />
    );
  }

  const signOut = () => {
    clearAuthSession();
    window.location.assign("/" + locale + "/login");
  };

  return (
    <div className="animate-page-in space-y-8 py-4">
      <header className="flex flex-col gap-4 rounded-2xl border border-secondary-container bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{text.liveData}</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-primary sm:text-3xl">{text.welcomeBack}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{text.summaryStatus}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={"/" + locale + "/animals"}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm hover:bg-primary-container"
          >
            {text.viewAnimals}
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="min-h-11 rounded-xl border border-secondary-container px-5 py-3 text-sm font-bold text-secondary hover:bg-surface-container"
          >
            {dictionary.common.signOut}
          </button>
        </div>
      </header>

      <section aria-label={text.metricsLabel} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={text.totalAnimals} value={dashboardData.total_animals} icon={<AnimalIcon />} />
        <MetricCard title={text.readyForSale} value={dashboardData.ready_for_sale} icon={<ReadyIcon />} />
        <MetricCard
          title={text.healthAlerts}
          value={dashboardData.health_alerts}
          icon={<HealthIcon />}
          alert={dashboardData.health_alerts > 0}
        />
        <MetricCard
          title={text.activeListings}
          value={dashboardData.active_listings}
          description={text.marketplacePending}
          icon={<ListingIcon />}
        />
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading title={text.animalsBySpecies} />
          <SpeciesBreakdown data={dashboardData} dictionary={dictionary} />
        </div>
        <div className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading title={text.latestWeights} />
          {dashboardData.latest_weight_updates.length === 0 ? (
            <EmptyState title={text.weightsEmptyTitle} description={text.weightsEmptyDescription} />
          ) : (
            <ul className="mt-5 space-y-3">
              {dashboardData.latest_weight_updates.map((update) => (
                <li key={update.animal_id + "-" + update.recorded_at}>
                  <Link
                    href={"/" + locale + "/animals/" + update.animal_id + "/growth"}
                    className="flex min-h-16 flex-col gap-2 rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-primary">{update.animal_label}</p>
                      {update.note ? <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{update.note}</p> : null}
                    </div>
                    <div className="shrink-0 sm:text-end">
                      <p className="text-lg font-black text-primary">{Number(update.weight_kg).toFixed(2)} {text.weightUnit}</p>
                      <time className="text-xs text-on-surface-variant">{formatDashboardDate(update.recorded_at, locale)}</time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading title={text.recentActivity} />
        {dashboardData.recent_activity.length === 0 ? (
          <EmptyState title={text.activityEmptyTitle} description={text.activityEmptyDescription} />
        ) : (
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {dashboardData.recent_activity.map((item, index) => (
              <ActivityRow
                key={item.type + "-" + item.date + "-" + (item.animal_id ?? index)}
                item={item}
                locale={locale}
                dictionary={dictionary}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  description,
  alert = false,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  alert?: boolean;
}) {
  const borderClass = alert ? "border-error/30" : "border-secondary-container";
  const iconClass = alert ? "bg-error-container text-error" : "bg-surface-container text-primary";
  return (
    <article className={"flex min-h-40 flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm " + borderClass}>
      <div className={"flex size-11 items-center justify-center rounded-xl " + iconClass}>{icon}</div>
      <div className="mt-5">
        <p className={"text-3xl font-black " + (alert ? "text-error" : "text-primary")}>{value}</p>
        <h2 className="mt-1 text-xs font-black uppercase tracking-wider text-on-surface-variant">{title}</h2>
        {description ? <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">{description}</p> : null}
      </div>
    </article>
  );
}

function SpeciesBreakdown({ data, dictionary }: { data: FarmerDashboard; dictionary: Dictionary }) {
  const text = dictionary.dashboard;
  const maximum = Math.max(...Object.values(data.animals_by_species), 1);
  if (data.total_animals === 0) {
    return <EmptyState title={text.speciesEmptyTitle} description={text.speciesEmptyDescription} />;
  }
  return (
    <ul className="mt-5 space-y-4">
      {speciesOrder.map((species) => {
        const count = data.animals_by_species[species];
        const width = count === 0 ? 0 : Math.max((count / maximum) * 100, 8);
        return (
          <li key={species}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-on-surface">{dictionary.animals.values[species]}</span>
              <span className="font-black text-primary">{count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: String(width) + "%" }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ActivityRow({
  item,
  locale,
  dictionary,
}: {
  item: DashboardActivityItem;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const labels: Record<DashboardActivityType, string> = {
    animal_created: dictionary.dashboard.activityAnimalCreated,
    weight_recorded: dictionary.dashboard.activityWeightRecorded,
    health_recorded: dictionary.dashboard.activityHealthRecorded,
    photo_uploaded: dictionary.dashboard.activityPhotoUploaded,
  };
  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed/40 text-primary">
        <ActivityIcon type={item.type} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{labels[item.type]}</p>
        <p className="mt-1 truncate text-sm font-bold text-on-surface">{item.title}</p>
      </div>
      <time className="shrink-0 text-xs text-on-surface-variant">{formatDashboardDate(item.date, locale)}</time>
    </>
  );
  return (
    <li>
      {item.animal_id ? (
        <Link
          href={"/" + locale + "/animals/" + item.animal_id}
          className="flex min-h-16 items-center gap-3 rounded-xl bg-surface-container-low p-4 hover:bg-surface-container"
        >
          {content}
        </Link>
      ) : (
        <div className="flex min-h-16 items-center gap-3 rounded-xl bg-surface-container-low p-4">{content}</div>
      )}
    </li>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-lg font-black text-primary sm:text-xl">{title}</h2>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-secondary-container bg-surface-container-low p-6 text-center">
      <p className="text-sm font-black text-primary">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{description}</p>
    </div>
  );
}

function DashboardLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="animate-page-in space-y-6 py-4">
      <div className="h-40 animate-pulse rounded-2xl bg-surface-container-high" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-surface-container" />)}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function DashboardError({
  title,
  message,
  retry,
  retryLabel,
}: {
  title: string;
  message: string;
  retry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-error/20 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-black text-error">{title}</h1>
      <p className="mt-3 text-sm text-on-surface-variant">{message}</p>
      {retry && retryLabel ? (
        <button type="button" onClick={retry} className="mt-6 min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary">
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

function formatDashboardDate(value: string, locale: Locale): string {
  const parsed = new Date(value.length === 10 ? value + "T00:00:00" : value);
  return parsed.toLocaleDateString(dateLocale(locale), { day: "numeric", month: "short", year: "numeric" });
}

function SvgIcon({ children }: { children: React.ReactNode }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

function AnimalIcon() {
  return <SvgIcon><path d="M5 9c0-3 2-5 7-5s7 2 7 5v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V9Z" /><path d="M8 4 5 2M16 4l3-2M9 12h.01M15 12h.01M10 16h4" /></SvgIcon>;
}
function ReadyIcon() {
  return <SvgIcon><path d="M20 7 10 17l-5-5" /></SvgIcon>;
}
function HealthIcon() {
  return <SvgIcon><path d="M12 21s-8-4.6-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.4-8 11-8 11Z" /><path d="M8 12h2l1-2 2 4 1-2h2" /></SvgIcon>;
}
function ListingIcon() {
  return <SvgIcon><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></SvgIcon>;
}
function ActivityIcon({ type }: { type: DashboardActivityType }) {
  if (type === "weight_recorded") return <SvgIcon><path d="M5 20h14M7 20l1-11h8l1 11M10 9a2 2 0 1 1 4 0" /></SvgIcon>;
  if (type === "health_recorded") return <HealthIcon />;
  if (type === "photo_uploaded") return <SvgIcon><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 15-5-5L5 19" /></SvgIcon>;
  return <AnimalIcon />;
}
