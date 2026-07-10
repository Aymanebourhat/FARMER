import ar from "@/messages/ar.json";
import ary from "@/messages/ary.json";
import fr from "@/messages/fr.json";

export const locales = ["ar", "ary", "fr"] as const;

export type Locale = (typeof locales)[number];
export type Dictionary = typeof ar;

const dictionaries: Record<Locale, Dictionary> = {
  ar,
  ary,
  fr,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
