import { notFound } from "next/navigation";

import { AnimalDetailScreen } from "@/components/animals/animal-detail-screen";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function AnimalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const query = await searchParams;
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <SiteHeader locale={locale} content={dictionary.header} />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <AnimalDetailScreen locale={locale} dictionary={dictionary} animalId={id} created={query.created === "1"} />
      </main>
      <SiteFooter locale={locale} content={dictionary.footer} />
    </div>
  );
}
