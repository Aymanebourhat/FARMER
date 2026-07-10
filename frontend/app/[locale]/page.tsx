import { notFound } from "next/navigation";

import { FeatureGrid } from "@/components/landing/feature-grid";
import { Hero } from "@/components/landing/hero";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary, isLocale } from "@/lib/i18n";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <SiteHeader locale={locale} content={dictionary.header} />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-16">
          <Hero locale={locale} content={dictionary.hero} />
          <FeatureGrid locale={locale} content={dictionary.features} />
        </div>
      </main>
      <SiteFooter locale={locale} content={dictionary.footer} />
    </div>
  );
}
