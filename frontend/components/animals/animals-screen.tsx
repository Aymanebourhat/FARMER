"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AnimalStatusBadge, EmptyPanel, ErrorPanel, FarmerOnly, LoadingPanel } from "@/components/animals/animal-ui";
import { ApiError, apiClient } from "@/lib/api-client";
import { dateLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { useFarmerSession } from "@/lib/use-farmer-session";
import type { Animal } from "@/types/animal";

export function AnimalsScreen({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const { state: sessionState, token, handleApiError } = useFarmerSession(locale);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setState("loading");
    setError("");
    try {
      setAnimals(await apiClient.listAnimals(token));
      setState("ready");
    } catch (loadError) {
      if (handleApiError(loadError)) return;
      setError(loadError instanceof ApiError ? loadError.detail : dictionary.animals.failedLoad);
      setState("error");
    }
  }, [dictionary.animals.failedLoad, handleApiError, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (sessionState === "loading") return <LoadingPanel label={dictionary.common.loading} />;
  if (sessionState === "forbidden") return <FarmerOnly dictionary={dictionary} />;

  return (
    <div className="animate-page-in space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">{dictionary.animals.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{dictionary.animals.description}</p>
        </div>
        <Link href={`/${locale}/animals/new`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary-container">
          <span aria-hidden="true" className="me-2 text-lg">+</span>{dictionary.animals.addAnimal}
        </Link>
      </header>

      {state === "loading" ? <LoadingPanel label={dictionary.animals.loadingList} skeletons /> : null}
      {state === "error" ? <ErrorPanel title={dictionary.common.error} message={error} retry={load} retryLabel={dictionary.common.retry} /> : null}
      {state === "ready" && animals.length === 0 ? (
        <EmptyPanel
          title={dictionary.animals.emptyTitle}
          description={dictionary.animals.emptyDescription}
          action={<Link href={`/${locale}/animals/new`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary">{dictionary.animals.addAnimal}</Link>}
        />
      ) : null}
      {state === "ready" && animals.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((animal) => <AnimalCard key={animal.id} animal={animal} locale={locale} dictionary={dictionary} />)}
        </div>
      ) : null}
    </div>
  );
}

function AnimalCard({ animal, locale, dictionary }: { animal: Animal; locale: Locale; dictionary: Dictionary }) {
  const values = dictionary.animals.values;
  const title = animal.breed ? `${values[animal.species]} · ${animal.breed}` : values[animal.species];
  const age = animal.birth_date
    ? dictionary.animals.ageExact.replace("{date}", new Date(`${animal.birth_date}T00:00:00`).toLocaleDateString(dateLocale(locale)))
    : dictionary.animals.ageEstimated.replace("{months}", String(animal.estimated_age_months ?? ""));
  return (
    <article className="group overflow-hidden rounded-2xl border border-secondary-container bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex h-44 items-center justify-center bg-surface-container-high text-6xl" role="img" aria-label={dictionary.animals.noPhoto}>🐑</div>
      <div className="space-y-4 p-5">
        <div>
          <h2 className="text-lg font-black text-primary">{title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{values[animal.sex]} · {age}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AnimalStatusBadge value={animal.health_status} labels={values} />
          <AnimalStatusBadge value={animal.ownership_status} labels={values} />
          <AnimalStatusBadge value={animal.sale_readiness} labels={values} />
        </div>
        <Link href={`/${locale}/animals/${animal.id}`} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary">
          {dictionary.animals.viewAnimal}
        </Link>
      </div>
    </article>
  );
}
