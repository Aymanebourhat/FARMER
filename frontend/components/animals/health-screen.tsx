"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AnimalStatusBadge, AnimalSubnav, EmptyPanel, ErrorPanel, FarmerOnly, LoadingPanel, Notice, animalLabel } from "@/components/animals/animal-ui";
import { filterHealthRecords, healthRecordTypeValues, localToday, sortHealthNewest, upcomingReminders } from "@/lib/animal-utils";
import { ApiError, apiClient } from "@/lib/api-client";
import { dateLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { useFarmerSession } from "@/lib/use-farmer-session";
import type { Animal, HealthRecord, HealthRecordCreateInput, HealthRecordType } from "@/types/animal";

type Filter = "all" | HealthRecordType;
type HealthFormValues = {
  record_type: HealthRecordType;
  title: string;
  description: string;
  medicine_name: string;
  recorded_at: string;
  next_reminder_at: string;
};

export function HealthScreen({ locale, dictionary, animalId }: { locale: Locale; dictionary: Dictionary; animalId: string }) {
  const { state: sessionState, token, handleApiError } = useFarmerSession(locale);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setState("loading");
    setError("");
    try {
      const [loadedAnimal, loadedRecords] = await Promise.all([
        apiClient.getAnimal(token, animalId),
        apiClient.listHealthRecords(token, animalId),
      ]);
      setAnimal(loadedAnimal);
      setRecords(sortHealthNewest(loadedRecords));
      setState("ready");
    } catch (loadError) {
      if (handleApiError(loadError)) return;
      if (loadError instanceof ApiError && loadError.status === 404) setState("missing");
      else {
        setError(loadError instanceof ApiError ? loadError.detail : dictionary.animals.health.error);
        setState("error");
      }
    }
  }, [animalId, dictionary.animals.health.error, handleApiError, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (sessionState === "loading") return <LoadingPanel label={dictionary.common.loading} />;
  if (sessionState === "forbidden") return <FarmerOnly dictionary={dictionary} />;
  if (state === "loading") return <LoadingPanel label={dictionary.animals.health.loading} />;
  if (state === "missing") return <ErrorPanel title={dictionary.animals.missingTitle} message={dictionary.animals.missingDescription} />;
  if (state === "error") return <ErrorPanel title={dictionary.common.error} message={error} retry={load} retryLabel={dictionary.common.retry} />;
  if (!animal || !token) return null;

  const text = dictionary.animals.health;
  const values = dictionary.animals.values;
  const reminders = upcomingReminders(records);
  const filtered = filterHealthRecords(records, filter);
  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(dateLocale(locale));

  return (
    <div className="animate-page-in space-y-7">
      <Notice message={notice} />
      <Link href={`/${locale}/animals/${animal.id}`} className="inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline">← {dictionary.animals.detail.back}</Link>
      <header className="flex flex-col gap-4 rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{animalLabel(animal, dictionary)}</p>
          <h1 className="mt-1 text-2xl font-black text-primary sm:text-3xl">{text.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{text.description}</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary">{text.add}</button>
      </header>
      <AnimalSubnav locale={locale} animalId={animal.id} current="health" labels={dictionary.animals.tabs} />

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-on-surface-variant">{text.current}</h2>
          <div className="mt-4"><AnimalStatusBadge value={animal.health_status} labels={values} /></div>
        </div>
        <div className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-black text-primary">{text.remindersTitle}</h2>
          {reminders.length === 0 ? <p className="mt-3 text-sm text-on-surface-variant">{text.noReminders}</p> : (
            <ol className="mt-3 grid gap-3 sm:grid-cols-2">
              {reminders.map((record) => (
                <li key={record.id} className="rounded-xl bg-secondary-container/60 p-4">
                  <p className="text-sm font-black text-primary">{record.title}</p>
                  <p className="mt-1 text-xs font-semibold text-secondary">{text.reminderOn.replace("{date}", formatDate(record.next_reminder_at!))}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <p className="rounded-xl border border-secondary-container bg-[#F5EBE0] p-4 text-xs leading-relaxed text-secondary">{text.noDiagnosis}</p>

      <section className="rounded-2xl border border-secondary-container bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-black text-primary">{text.historyTitle}</h2>
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={text.recordType}>
            {(["all", ...healthRecordTypeValues] as Filter[]).map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-10 shrink-0 rounded-full px-4 text-xs font-bold ${filter === value ? "bg-primary text-on-primary" : "bg-surface-container text-secondary"}`}>
                {value === "all" ? text.all : values[value]}
              </button>
            ))}
          </div>
        </div>
        {records.length === 0 ? <div className="mt-5"><EmptyPanel title={text.emptyTitle} description={text.emptyDescription} /></div> : null}
        {records.length > 0 && filtered.length === 0 ? <div className="mt-5"><EmptyPanel title={text.filterEmpty} description={text.filterEmpty} /></div> : null}
        {filtered.length > 0 ? (
          <ol className="mt-5 space-y-4">
            {filtered.map((record) => (
              <li key={record.id} className="rounded-xl border border-secondary-container bg-surface-container-low p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AnimalStatusBadge value={record.record_type} labels={values} />
                      <AnimalStatusBadge value={record.verification_status} labels={values} />
                    </div>
                    <h3 className="mt-3 text-base font-black text-primary">{record.title}</h3>
                  </div>
                  <time className="text-xs font-bold text-on-surface-variant">{formatDate(record.recorded_at)}</time>
                </div>
                {record.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">{record.description}</p> : null}
                {record.medicine_name ? <p className="mt-3 text-sm"><span className="font-black">{text.medicineLabel}:</span> {record.medicine_name}</p> : null}
                {record.next_reminder_at ? <p className="mt-2 text-xs font-bold text-secondary">{text.reminderOn.replace("{date}", formatDate(record.next_reminder_at))}</p> : null}
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <AddHealthDialog open={modalOpen} token={token} animalId={animal.id} dictionary={dictionary} onAuthError={handleApiError} onClose={() => setModalOpen(false)} onAdded={(record) => {
        setRecords((current) => sortHealthNewest([...current, record]));
        setNotice(text.success);
        setModalOpen(false);
      }} />
    </div>
  );
}

function AddHealthDialog({ open, token, animalId, dictionary, onAuthError, onClose, onAdded }: { open: boolean; token: string; animalId: string; dictionary: Dictionary; onAuthError: (error: unknown) => boolean; onClose: () => void; onAdded: (record: HealthRecord) => void }) {
  const text = dictionary.animals.health;
  const values = dictionary.animals.values;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HealthFormValues>({
    defaultValues: { record_type: "note", title: "", description: "", medicine_name: "", recorded_at: localToday(), next_reminder_at: "" },
  });

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) onClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose, open, submitting]);

  const submit = async (form: HealthFormValues) => {
    if (submitting) return;
    const payload: HealthRecordCreateInput = {
      record_type: form.record_type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      medicine_name: form.medicine_name.trim() || null,
      recorded_at: form.recorded_at,
      next_reminder_at: form.next_reminder_at || null,
    };
    setSubmitting(true);
    setError("");
    try {
      const record = await apiClient.createHealthRecord(token, animalId, payload);
      reset({ record_type: "note", title: "", description: "", medicine_name: "", recorded_at: localToday(), next_reminder_at: "" });
      onAdded(record);
    } catch (submitError) {
      if (!onAuthError(submitError)) setError(submitError instanceof ApiError ? submitError.detail : text.addError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4">
      <button type="button" className="fixed inset-0 bg-black/50" aria-label={dictionary.animals.form.cancel} onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="health-dialog-title" className="relative z-10 my-auto w-full max-w-xl animate-scale-in rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <h2 id="health-dialog-title" className="text-xl font-black text-primary">{text.add}</h2>
        <form onSubmit={handleSubmit(submit)} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Notice message={error} error /></div>
          <FormField label={text.recordType} error={errors.record_type?.message}>
            <select {...register("record_type", { required: dictionary.common.required })} className={fieldClass}>{healthRecordTypeValues.map((type) => <option key={type} value={type}>{values[type]}</option>)}</select>
          </FormField>
          <FormField label={text.recordTitle} error={errors.title?.message}>
            <input autoFocus maxLength={255} placeholder={text.titlePlaceholder} {...register("title", { required: dictionary.common.required, validate: (value) => value.trim().length > 0 || dictionary.common.required })} className={fieldClass} />
          </FormField>
          <FormField label={text.recordedAt} error={errors.recorded_at?.message}>
            <input type="date" max={localToday()} {...register("recorded_at", { required: dictionary.common.required, validate: (value) => value <= localToday() || text.futureDate })} className={fieldClass} />
          </FormField>
          <FormField label={text.nextReminder} error={errors.next_reminder_at?.message}>
            <input type="date" {...register("next_reminder_at")} className={fieldClass} />
          </FormField>
          <div className="sm:col-span-2"><FormField label={text.descriptionLabel} error={errors.description?.message}><textarea rows={3} placeholder={text.descriptionPlaceholder} {...register("description")} className={fieldClass} /></FormField></div>
          <div className="sm:col-span-2"><FormField label={text.medicine} error={errors.medicine_name?.message}><input maxLength={255} placeholder={text.medicinePlaceholder} {...register("medicine_name")} className={fieldClass} /></FormField></div>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={submitting} onClick={onClose} className="min-h-11 rounded-xl border border-secondary-container px-5 text-sm font-bold">{dictionary.animals.form.cancel}</button>
            <button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60">{submitting ? text.saving : text.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-secondary-container bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold">{label}{children}{error ? <span role="alert" className="mt-1 block text-xs text-error">{error}</span> : null}</label>;
}
