"use client";

import Link from "next/link";
import { useState } from "react";
import { resolveApiMediaUrl } from "@/lib/api-client";
import { dateLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { getRegionLabel } from "@/lib/morocco-regions";
import type { MarketplaceListing } from "@/types/listing";

export function label(dictionary: Dictionary, value: string) { return (dictionary.animals.values as Record<string, string>)[value] ?? dictionary.marketplace[value as keyof Dictionary["marketplace"]] ?? value; }
export function formatDate(value: string, locale: Locale) { return new Date(value).toLocaleDateString(dateLocale(locale), { day: "numeric", month: "short", year: "numeric" }); }
export function formatMoney(value: string, locale: Locale) { return new Intl.NumberFormat(dateLocale(locale), { style: "currency", currency: "MAD", maximumFractionDigits: 2 }).format(Number(value)); }
export function apiError(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
export function whatsapp(value: string) { return value.replace(/[^\d+]/g, "").replace(/^\+/, ""); }

export function ListingImage({ listing, alt, className = "" }: { listing: MarketplaceListing; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  const url = listing.animal.primary_photo_url ?? listing.animal.photos.find((photo) => photo.is_primary)?.file_url ?? listing.animal.photos[0]?.file_url;
  if (!url || broken) return <div role="img" aria-label={alt} className={`flex items-center justify-center bg-surface-container-high text-5xl ${className}`}>🐑</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolveApiMediaUrl(url)} alt={alt} onError={() => setBroken(true)} className={`object-cover ${className}`} />;
}

export function Status({ value, dictionary }: { value: MarketplaceListing["status"]; dictionary: Dictionary }) {
  const tone = value === "active" ? "bg-success-container text-success" : value === "sold" || value === "suspended" ? "bg-error-container text-error" : "bg-secondary-container text-secondary";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{dictionary.marketplace[value]}</span>;
}

export function ListingCard({ listing, locale, dictionary, owner = false }: { listing: MarketplaceListing; locale: Locale; dictionary: Dictionary; owner?: boolean }) {
  const t = dictionary.marketplace;
  const species = listing.animal.breed ? `${label(dictionary, listing.animal.species)} · ${listing.animal.breed}` : label(dictionary, listing.animal.species);
  const href = owner ? `/${locale}/marketplace/my-listings/${listing.id}/edit` : `/${locale}/marketplace/${listing.id}`;
  return <article className="overflow-hidden rounded-2xl border border-secondary-container bg-white shadow-sm"><ListingImage listing={listing} alt={t.imageAlt.replace("{animal}", species)} className="h-48 w-full" /><div className="space-y-3 p-4"><div className="flex gap-3"><h2 className="min-w-0 flex-1 font-black text-primary">{listing.title}</h2>{owner ? <Status value={listing.status} dictionary={dictionary} /> : null}</div><p className="text-lg font-black text-primary">{formatMoney(listing.price_mad, locale)}</p><p className="text-sm text-on-surface-variant">{species} · {label(dictionary, listing.animal.sex)}</p><p className="text-xs text-on-surface-variant">{getRegionLabel(listing.region, locale)} · {listing.province}</p><div className="flex justify-between text-xs text-on-surface-variant"><span>{t.trust}: {listing.trust_score}/100</span>{listing.animal.latest_weight_kg ? <span>{listing.animal.latest_weight_kg} kg</span> : null}</div><Link href={href} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary hover:text-on-primary">{owner ? t.edit : t.listingLink}</Link></div></article>;
}

export function Paging({ page, pages, onPage, dictionary }: { page: number; pages: number; onPage: (page: number) => void; dictionary: Dictionary }) {
  const t = dictionary.marketplace; if (pages < 2) return null;
  return <nav aria-label={t.title} className="flex justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="min-h-11 rounded-xl border border-secondary-container px-4 text-sm font-bold disabled:opacity-50">{t.previous}</button><span className="flex min-h-11 items-center text-sm font-bold">{page} / {pages}</span><button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="min-h-11 rounded-xl border border-secondary-container px-4 text-sm font-bold disabled:opacity-50">{t.next}</button></nav>;
}
