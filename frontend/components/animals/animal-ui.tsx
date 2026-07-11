"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { resolveApiMediaUrl } from "@/lib/api-client";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Animal, AnimalPhoto } from "@/types/animal";

export function AnimalStatusBadge({
  value,
  labels,
}: {
  value: string;
  labels: Record<string, string>;
}) {
  const tone =
    value === "healthy" || value === "ready" || value === "owned" || value === "vet_verified"
      ? "bg-success-container text-success"
      : value === "sick" || value === "dead"
        ? "bg-error-container text-error"
        : "bg-secondary-container text-secondary";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{labels[value] ?? value}</span>;
}

export function LoadingPanel({ label, skeletons = false }: { label: string; skeletons?: boolean }) {
  if (skeletons) {
    return (
      <div role="status" aria-label={label} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="overflow-hidden rounded-2xl border border-secondary-container bg-white shadow-sm">
            <div className="h-44 animate-pulse bg-surface-container-high" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-surface-container-high" />
              <div className="h-4 w-full animate-pulse rounded bg-surface-container" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-container" />
            </div>
          </div>
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }
  return (
    <div role="status" className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-secondary-container bg-white p-8">
      <div className="mb-4 size-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm font-bold text-primary">{label}</p>
    </div>
  );
}

export function ErrorPanel({
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
    <div role="alert" className="rounded-2xl border border-error/20 bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-black text-error">{title}</h2>
      <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
      {retry && retryLabel ? (
        <button type="button" onClick={retry} className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-container">
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-container bg-white p-8 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface-container text-3xl" aria-hidden="true">🐑</div>
      <h2 className="text-lg font-black text-primary">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function FarmerOnly({ dictionary }: { dictionary: Dictionary }) {
  return <ErrorPanel title={dictionary.animals.forbiddenTitle} message={dictionary.animals.forbiddenDescription} />;
}

export function Notice({ message, error = false }: { message: string; error?: boolean }) {
  if (!message) return null;
  return (
    <div aria-live="polite" className={`animate-fade-in rounded-xl border px-4 py-3 text-sm font-semibold ${error ? "border-error/20 bg-error-container/40 text-error" : "border-success/20 bg-success-container text-success"}`}>
      {message}
    </div>
  );
}

export function ConfirmationDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onCancel, open, pending]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
      <button className="absolute inset-0 cursor-default bg-black/50" aria-label={cancelLabel} onClick={onCancel} disabled={pending} />
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" className="relative z-10 w-full max-w-md animate-scale-in rounded-2xl border border-secondary-container bg-white p-6 shadow-2xl">
        <h2 id="confirm-title" className="text-xl font-black text-primary">{title}</h2>
        <p id="confirm-description" className="mt-3 text-sm leading-relaxed text-on-surface-variant">{description}</p>
        {error ? <p role="alert" className="mt-4 rounded-lg bg-error-container p-3 text-sm text-error">{error}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" disabled={pending} onClick={onCancel} className="min-h-11 rounded-xl border border-secondary-container px-5 py-2.5 text-sm font-bold text-secondary disabled:opacity-60">{cancelLabel}</button>
          <button type="button" disabled={pending} onClick={onConfirm} className="min-h-11 rounded-xl bg-error px-5 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{pending ? pendingLabel : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function AnimalImage({
  photo,
  alt,
  className,
  lazy = false,
  onClick,
}: {
  photo: AnimalPhoto | null;
  alt: string;
  className?: string;
  lazy?: boolean;
  onClick?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  if (!photo || broken) {
    return <div className={`flex items-center justify-center bg-surface-container-high text-5xl ${className ?? ""}`} role="img" aria-label={alt}>🐑</div>;
  }
  return (
    // Dynamic upload hosts are configured at runtime, so a stable native image avoids a brittle Next host allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolveApiMediaUrl(photo.file_url)} alt={alt} loading={lazy ? "lazy" : "eager"} onError={() => setBroken(true)} onClick={onClick} className={`object-cover ${onClick ? "cursor-zoom-in" : ""} ${className ?? ""}`} />
  );
}

export function AnimalSubnav({ locale, animalId, current, labels }: { locale: Locale; animalId: string; current: "overview" | "growth" | "health"; labels: Dictionary["animals"]["tabs"] }) {
  const items = [
    { key: "overview", href: `/${locale}/animals/${animalId}`, label: labels.overview },
    { key: "growth", href: `/${locale}/animals/${animalId}/growth`, label: labels.growth },
    { key: "health", href: `/${locale}/animals/${animalId}/health`, label: labels.health },
  ] as const;
  return (
    <nav aria-label={labels.label} className="flex overflow-x-auto rounded-xl border border-secondary-container bg-white p-1 shadow-sm">
      {items.map((item) => (
        <Link key={item.key} href={item.href} aria-current={current === item.key ? "page" : undefined} className={`min-w-28 flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-bold transition-colors ${current === item.key ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"}`}>{item.label}</Link>
      ))}
    </nav>
  );
}

export function animalLabel(animal: Animal, dictionary: Dictionary): string {
  return animal.breed ? `${dictionary.animals.values[animal.species]} · ${animal.breed}` : dictionary.animals.values[animal.species];
}
