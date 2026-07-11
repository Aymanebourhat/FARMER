"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AnimalForm } from "@/components/animals/animal-form";
import { AnimalHistory } from "@/components/animals/animal-history";
import { AnimalPhotoGallery } from "@/components/animals/animal-photo-gallery";
import { AnimalStatusBadge, AnimalSubnav, ConfirmationDialog, ErrorPanel, FarmerOnly, LoadingPanel, Notice, animalLabel } from "@/components/animals/animal-ui";
import { ApiError, apiClient } from "@/lib/api-client";
import { dateLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { useFarmerSession } from "@/lib/use-farmer-session";
import type { Animal, AnimalCreateInput } from "@/types/animal";

export function AnimalDetailScreen({ locale, dictionary, animalId, created = false }: { locale: Locale; dictionary: Dictionary; animalId: string; created?: boolean }) {
  const router = useRouter();
  const { state: sessionState, token, handleApiError } = useFarmerSession(locale);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(created ? dictionary.animals.form.createSuccess : "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setState("loading");
    setError("");
    try {
      setAnimal(await apiClient.getAnimal(token, animalId));
      setState("ready");
    } catch (loadError) {
      if (handleApiError(loadError)) return;
      if (loadError instanceof ApiError && loadError.status === 404) {
        setState("missing");
        return;
      }
      setError(loadError instanceof ApiError ? loadError.detail : dictionary.common.error);
      setState("error");
    }
  }, [animalId, dictionary.common.error, handleApiError, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (sessionState === "loading") return <LoadingPanel label={dictionary.common.loading} />;
  if (sessionState === "forbidden") return <FarmerOnly dictionary={dictionary} />;
  if (state === "loading") return <LoadingPanel label={dictionary.common.loading} />;
  if (state === "missing") return <ErrorPanel title={dictionary.animals.missingTitle} message={dictionary.animals.missingDescription} />;
  if (state === "error") return <ErrorPanel title={dictionary.common.error} message={error} retry={load} retryLabel={dictionary.common.retry} />;
  if (!animal || !token) return null;

  const update = async (payload: AnimalCreateInput) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await apiClient.updateAnimal(token, animal.id, payload);
      setAnimal(updated);
      setEditing(false);
      setNotice(dictionary.animals.form.updateSuccess);
    } catch (updateError) {
      if (!handleApiError(updateError)) setError(updateError instanceof ApiError ? updateError.detail : dictionary.animals.form.generalError);
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (archiving) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await apiClient.deleteAnimal(token, animal.id);
      setArchiveOpen(false);
      setNotice(dictionary.animals.detail.archiveSuccess);
      window.setTimeout(() => router.replace(`/${locale}/animals`), 700);
    } catch (deleteError) {
      if (!handleApiError(deleteError)) setArchiveError(deleteError instanceof ApiError ? deleteError.detail : dictionary.animals.detail.archiveError);
    } finally {
      setArchiving(false);
    }
  };

  const label = animalLabel(animal, dictionary);
  const detail = dictionary.animals.detail;
  const values = dictionary.animals.values;
  const formatDate = (value: string) => new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString(dateLocale(locale));

  return (
    <div className="animate-page-in space-y-7">
      <Notice message={notice} />
      <Link href={`/${locale}/animals`} className="inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline">← {detail.back}</Link>
      <header className="flex flex-col gap-4 rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{values[animal.verification_level]}</p>
          <h1 className="mt-1 text-2xl font-black text-primary sm:text-3xl">{label}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <AnimalStatusBadge value={animal.health_status} labels={values} />
            <AnimalStatusBadge value={animal.ownership_status} labels={values} />
            <AnimalStatusBadge value={animal.sale_readiness} labels={values} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => { setEditing(true); setError(""); }} className="min-h-11 rounded-xl border border-primary px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5">{detail.edit}</button>
          <button type="button" onClick={() => setArchiveOpen(true)} className="min-h-11 rounded-xl bg-error-container/50 px-5 py-2.5 text-sm font-bold text-error hover:bg-error-container">{detail.archive}</button>
        </div>
      </header>

      <AnimalSubnav locale={locale} animalId={animal.id} current="overview" labels={dictionary.animals.tabs} />

      {editing ? (
        <section className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-xl font-black text-primary">{dictionary.animals.form.editTitle}</h2>
          <AnimalForm dictionary={dictionary} animal={animal} submitting={saving} error={error} onSubmit={update} onCancel={() => setEditing(false)} />
        </section>
      ) : (
        <section className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-black text-primary">{detail.identity}</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label={detail.species} value={values[animal.species]} />
            <Detail label={detail.breed} value={animal.breed ?? detail.notProvided} />
            <Detail label={detail.sex} value={values[animal.sex]} />
            <Detail label={animal.birth_date ? detail.birthDate : detail.estimatedAge} value={animal.birth_date ? formatDate(animal.birth_date) : detail.months.replace("{count}", String(animal.estimated_age_months))} />
            <Detail label={detail.color} value={animal.color ?? detail.notProvided} />
            <Detail label={detail.healthStatus} value={values[animal.health_status]} />
            <Detail label={detail.ownershipStatus} value={values[animal.ownership_status]} />
            <Detail label={detail.saleReadiness} value={values[animal.sale_readiness]} />
            <Detail label={detail.verification} value={values[animal.verification_level]} />
            <Detail label={detail.created} value={formatDate(animal.created_at)} />
            <Detail label={detail.updated} value={formatDate(animal.updated_at)} />
          </dl>
          <div className="mt-5 rounded-xl bg-surface-container-low p-4">
            <dt className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{detail.notes}</dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{animal.identification_notes ?? detail.notProvided}</dd>
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-7">
        <AnimalPhotoGallery animal={animal} token={token} dictionary={dictionary} onAuthError={handleApiError} />
      </div>
      <div className="rounded-2xl border border-secondary-container bg-surface-container-low p-5 sm:p-7">
        <AnimalHistory animalId={animal.id} token={token} locale={locale} dictionary={dictionary} onAuthError={handleApiError} />
      </div>

      <ConfirmationDialog
        open={archiveOpen}
        title={detail.archiveTitle}
        description={detail.archiveDescription.replace("{animal}", label)}
        cancelLabel={dictionary.animals.form.cancel}
        confirmLabel={detail.archiveConfirm}
        pendingLabel={detail.archiving}
        pending={archiving}
        error={archiveError}
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => void archive()}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <dt className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{label}</dt>
      <dd className="mt-1.5 text-sm font-bold text-on-surface">{value}</dd>
    </div>
  );
}
