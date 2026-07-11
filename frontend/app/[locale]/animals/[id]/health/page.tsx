import { notFound } from "next/navigation";

import { HealthScreen } from "@/components/animals/health-screen";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function HealthPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <SiteHeader locale={locale} content={dictionary.header} />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8"><HealthScreen locale={locale} dictionary={dictionary} animalId={id} /></main>
      <SiteFooter locale={locale} content={dictionary.footer} />
    </div>
  );
}
