"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AnimalSubnav, EmptyPanel, ErrorPanel, FarmerOnly, LoadingPanel, Notice, animalLabel } from "@/components/animals/animal-ui";
import { localToday, sortWeights } from "@/lib/animal-utils";
import { ApiError, apiClient } from "@/lib/api-client";
import { dateLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { useFarmerSession } from "@/lib/use-farmer-session";
import type { Animal, WeightRecord, WeightRecordCreateInput } from "@/types/animal";

const WeightChart = dynamic(() => import("@/components/charts/weight-chart").then((module) => module.WeightChart), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-surface-container" />,
});

type WeightFormValues = { weight_kg: string; recorded_at: string; note: string };

export function GrowthScreen({ locale, dictionary, animalId }: { locale: Locale; dictionary: Dictionary; animalId: string }) {
  const { state: sessionState, token, handleApiError } = useFarmerSession(locale);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setState("loading");
    setError("");
    try {
      const [loadedAnimal, loadedRecords] = await Promise.all([
        apiClient.getAnimal(token, animalId),
        apiClient.listWeights(token, animalId),
      ]);
      setAnimal(loadedAnimal);
      setRecords(sortWeights(loadedRecords));
      setState("ready");
    } catch (loadError) {
      if (handleApiError(loadError)) return;
      if (loadError instanceof ApiError && loadError.status === 404) setState("missing");
      else {
        setError(loadError instanceof ApiError ? loadError.detail : dictionary.animals.growth.error);
        setState("error");
      }
    }
  }, [animalId, dictionary.animals.growth.error, handleApiError, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (sessionState === "loading") return <LoadingPanel label={dictionary.common.loading} />;
  if (sessionState === "forbidden") return <FarmerOnly dictionary={dictionary} />;
  if (state === "loading") return <LoadingPanel label={dictionary.animals.growth.loading} />;
  if (state === "missing") return <ErrorPanel title={dictionary.animals.missingTitle} message={dictionary.animals.missingDescription} />;
  if (state === "error") return <ErrorPanel title={dictionary.common.error} message={error} retry={load} retryLabel={dictionary.common.retry} />;
  if (!animal || !token) return null;

  const text = dictionary.animals.growth;
  const latest = records.at(-1);
  const previous = records.at(-2);
  const difference = latest && previous ? Number(latest.weight_kg) - Number(previous.weight_kg) : null;
  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(dateLocale(locale));

  return (
    <div className="animate-page-in space-y-7">
      <Notice message={notice} />
      <Link href={`/${locale}/animals/${animal.id}`} className="inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline">← {dictionary.animals.detail.back}</Link>
      <header className="flex flex-col gap-4 rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{animalLabel(animal, dictionary)}</p>
          <h1 className="mt-1 text-2xl font-black text-primary sm:text-3xl">{text.title}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{text.description}</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary">{text.add}</button>
      </header>
      <AnimalSubnav locale={locale} animalId={animal.id} current="growth" labels={dictionary.animals.tabs} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label={text.latest} value={latest ? `${Number(latest.weight_kg).toFixed(2)} ${text.kilograms}` : text.noValue} />
        <Summary label={text.previous} value={previous ? `${Number(previous.weight_kg).toFixed(2)} ${text.kilograms}` : text.noValue} />
        <Summary label={text.difference} value={difference === null ? text.noValue : `${difference > 0 ? "+" : ""}${difference.toFixed(2)} ${text.kilograms}`} />
        <Summary label={text.latestDate} value={latest ? formatDate(latest.recorded_at) : text.noValue} />
      </section>

      <section className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black text-primary">{text.chartTitle}</h2>
        <div className="mt-5">
          {records.length >= 2 ? <WeightChart records={records} locale={locale} kilograms={text.kilograms} /> : <EmptyPanel title={text.chartTitle} description={text.chartEmpty} />}
        </div>
      </section>

      <section className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black text-primary">{text.historyTitle}</h2>
        {records.length === 0 ? <div className="mt-5"><EmptyPanel title={text.emptyTitle} description={text.emptyDescription} /></div> : (
          <ol className="mt-5 space-y-3">
            {[...records].reverse().map((record) => (
              <li key={record.id} className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-lg font-black text-primary">{Number(record.weight_kg).toFixed(2)} {text.kilograms}</p>{record.note ? <p className="mt-1 text-sm text-on-surface-variant">{record.note}</p> : null}</div>
                <time className="text-xs font-bold text-on-surface-variant">{formatDate(record.recorded_at)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>

      <AddWeightDialog open={modalOpen} token={token} animalId={animal.id} dictionary={dictionary} onAuthError={handleApiError} onClose={() => setModalOpen(false)} onAdded={(record) => {
        setRecords((current) => sortWeights([...current, record]));
        setNotice(text.success);
        setModalOpen(false);
      }} />
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-2 text-xl font-black text-primary">{value}</p></div>;
}

function AddWeightDialog({ open, token, animalId, dictionary, onAuthError, onClose, onAdded }: { open: boolean; token: string; animalId: string; dictionary: Dictionary; onAuthError: (error: unknown) => boolean; onClose: () => void; onAdded: (record: WeightRecord) => void }) {
  const text = dictionary.animals.growth;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WeightFormValues>({ defaultValues: { weight_kg: "", recorded_at: localToday(), note: "" } });

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) onClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose, open, submitting]);

  const submit = async (values: WeightFormValues) => {
    if (submitting) return;
    const payload: WeightRecordCreateInput = { weight_kg: Number(values.weight_kg), recorded_at: values.recorded_at, note: values.note.trim() || null };
    setSubmitting(true);
    setError("");
    try {
      const record = await apiClient.createWeight(token, animalId, payload);
      reset({ weight_kg: "", recorded_at: localToday(), note: "" });
      onAdded(record);
    } catch (submitError) {
      if (!onAuthError(submitError)) setError(submitError instanceof ApiError && submitError.status === 409 ? text.duplicate : submitError instanceof ApiError ? submitError.detail : text.addError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label={dictionary.animals.form.cancel} onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="weight-title" className="relative z-10 w-full max-w-md animate-scale-in rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="weight-title" className="text-xl font-black text-primary">{text.add}</h2>
        <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-4">
          <Notice message={error} error />
          <label className="block text-sm font-bold">{text.weightKg}<input autoFocus type="number" step="0.01" min="0.01" inputMode="decimal" {...register("weight_kg", { required: dictionary.common.required, validate: (value) => Number(value) > 0 || text.positive })} className="mt-2 min-h-11 w-full rounded-xl border border-secondary-container px-3" />{errors.weight_kg ? <span role="alert" className="mt-1 block text-xs text-error">{errors.weight_kg.message}</span> : null}</label>
          <label className="block text-sm font-bold">{text.recordedAt}<input type="date" max={localToday()} {...register("recorded_at", { required: dictionary.common.required, validate: (value) => value <= localToday() || text.futureDate })} className="mt-2 min-h-11 w-full rounded-xl border border-secondary-container px-3" />{errors.recorded_at ? <span role="alert" className="mt-1 block text-xs text-error">{errors.recorded_at.message}</span> : null}</label>
          <label className="block text-sm font-bold">{text.note}<textarea rows={3} {...register("note")} placeholder={text.notePlaceholder} className="mt-2 w-full rounded-xl border border-secondary-container px-3 py-2" /></label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={submitting} onClick={onClose} className="min-h-11 rounded-xl border border-secondary-container px-5 text-sm font-bold">{dictionary.animals.form.cancel}</button>
            <button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60">{submitting ? text.saving : text.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
