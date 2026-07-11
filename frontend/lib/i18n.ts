import ar from "@/messages/ar.json";
import ary from "@/messages/ary.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";

export const locales = ["ar", "ary", "fr", "en"] as const;

export type Locale = (typeof locales)[number];
export type Dictionary = typeof ar;

const dictionaries: Record<Locale, Dictionary> = {
  ar,
  ary,
  fr,
  en,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === "ar" || locale === "ary";
}

export function dateLocale(locale: Locale): string {
  if (locale === "fr") return "fr-MA";
  if (locale === "en") return "en-GB";
  return "ar-MA";
}
