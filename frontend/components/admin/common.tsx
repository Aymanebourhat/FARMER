"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { ErrorPanel, LoadingPanel, Notice } from "@/components/animals/animal-ui";
import { ApiError } from "@/lib/api-client";
import { dateLocale, type Dictionary, type Locale } from "@/lib/i18n";

export type AdminText = Dictionary["admin"];

export function errorMessage(error: unknown, fallback: string) { return error instanceof ApiError ? error.detail : fallback; }
export function formatDate(value: string | null, locale: Locale) { return value ? new Date(value).toLocaleString(dateLocale(locale), { dateStyle: "medium", timeStyle: "short" }) : "—"; }
export function money(value: string, locale: Locale) { return new Intl.NumberFormat(dateLocale(locale), { style: "currency", currency: "MAD" }).format(Number(value)); }

export function AdminGuard({ state, t, children }: { state: "loading" | "ready" | "forbidden"; t: AdminText; children: React.ReactNode }) {
  if (state === "loading") return <LoadingPanel label={t.loading} />;
  if (state === "forbidden") return <ErrorPanel title={t.forbidden} message={t.adminOnly} />;
  return children;
}

export function AdminFrame({ locale, t, title, description, notice, children }: { locale: Locale; t: AdminText; title: string; description?: string; notice?: { text: string; error?: boolean } | null; children: React.ReactNode }) {
  return <div data-locale={locale} className="space-y-6"><header><p className="text-sm font-bold uppercase tracking-wide text-secondary">{t.title}</p><h1 className="mt-1 text-3xl font-black text-primary">{title}</h1>{description ? <p className="mt-2 text-sm text-on-surface-variant">{description}</p> : null}</header><AdminNav locale={locale} t={t} />{notice ? <Notice message={notice.text} error={notice.error} /> : null}{children}</div>;
}

export function AdminNav({ locale, t }: { locale: Locale; t: AdminText }) {
  const pathname = usePathname();
  const links = [
    [`/${locale}/admin`, t.overview], [`/${locale}/admin/users`, t.users], [`/${locale}/admin/listings`, t.listings],
    [`/${locale}/admin/reports`, t.reports], [`/${locale}/admin/vets`, t.vetVerification], [`/${locale}/admin/audit-logs`, t.auditLogs],
  ] as const;
  return <nav aria-label={t.title} className="flex gap-1 overflow-x-auto rounded-2xl border border-secondary-container bg-white p-2 shadow-sm">{links.map(([href, label]) => { const active = href === `/${locale}/admin` ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`min-h-11 shrink-0 rounded-xl px-4 py-3 text-sm font-bold ${active ? "bg-primary text-on-primary" : "text-secondary hover:bg-surface-container"}`}>{label}</Link>; })}</nav>;
}

export function Badge({ value, t, label }: { value: string; t: AdminText; label?: string }) {
  const labels: Record<string, string> = { active: t.active, suspended: t.suspended, deleted: t.deleted, pending: t.pending, reviewed: t.reviewed, dismissed: t.dismissed, action_taken: t.actionTaken, farmer: t.farmer, vet: t.vet, admin: t.admin };
  const tone = value === "active" || value === "action_taken" ? "bg-success-container text-success" : value === "suspended" || value === "deleted" ? "bg-error-container text-error" : "bg-secondary-container text-secondary";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label ?? labels[value] ?? value.replaceAll("_", " ")}</span>;
}

export function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl bg-surface-container-low p-3"><dt className="text-xs font-bold text-secondary">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-on-surface">{value}</dd></div>; }

export function Pager({ page, pages, t, onPage }: { page: number; pages: number; t: AdminText; onPage: (page: number) => void }) {
  if (pages <= 1) return null;
  return <nav aria-label={t.pagination} className="flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="min-h-11 rounded-xl border border-secondary-container px-4 text-sm font-bold disabled:opacity-40">{t.previous}</button><span className="text-sm font-bold">{page} / {pages}</span><button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="min-h-11 rounded-xl border border-secondary-container px-4 text-sm font-bold disabled:opacity-40">{t.next}</button></nav>;
}

export function ActionDialog({ open, title, description, fieldLabel, fieldValue, fieldError, confirmLabel, t, pending, destructive = true, confirmDisabled = false, onFieldChange, onCancel, onConfirm }: { open: boolean; title: string; description: string; fieldLabel?: string; fieldValue?: string; fieldError?: string; confirmLabel: string; t: AdminText; pending: boolean; destructive?: boolean; confirmDisabled?: boolean; onFieldChange?: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null); const firstRef = useRef<HTMLTextAreaElement | HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; firstRef.current?.focus(); const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) onCancel(); if (event.key === "Tab" && dialogRef.current) { const nodes = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), textarea:not([disabled])")]; if (!nodes.length) return; const first = nodes[0], last = nodes[nodes.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } }; document.addEventListener("keydown", key); return () => document.removeEventListener("keydown", key); }, [open, pending, onCancel]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"><button aria-label={t.cancel} className="absolute inset-0 bg-black/50" onClick={onCancel} disabled={pending}/><div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="admin-dialog-title" aria-describedby="admin-dialog-description" className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 id="admin-dialog-title" className="text-xl font-black text-primary">{title}</h2><p id="admin-dialog-description" className="mt-3 text-sm text-on-surface-variant">{description}</p>{fieldLabel && onFieldChange ? <label className="mt-5 block text-sm font-bold text-secondary">{fieldLabel} *<textarea ref={firstRef as React.RefObject<HTMLTextAreaElement>} value={fieldValue} onChange={(event) => onFieldChange(event.target.value)} maxLength={1000} className="mt-2 min-h-28 w-full rounded-xl border border-secondary-container p-3"/>{fieldError ? <span role="alert" className="mt-1 block text-xs text-error">{fieldError}</span> : null}</label> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button ref={!fieldLabel ? firstRef as React.RefObject<HTMLButtonElement> : undefined} type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-xl border border-secondary-container px-5 text-sm font-bold">{t.cancel}</button><button type="button" onClick={onConfirm} disabled={pending || confirmDisabled} className={`min-h-11 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50 ${destructive ? "bg-error" : "bg-primary"}`}>{pending ? t.saving : confirmLabel}</button></div></div></div>;
}




