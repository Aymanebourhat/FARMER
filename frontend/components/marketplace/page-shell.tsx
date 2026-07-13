import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export async function marketplacePageShell(params: Promise<{ locale: string }>, content: (locale: Locale, dictionary: ReturnType<typeof getDictionary>) => React.ReactNode) {
  const { locale } = await params; if (!isLocale(locale)) notFound(); const dictionary = getDictionary(locale);
  return <div className="flex min-h-screen flex-col bg-background text-on-background"><Suspense fallback={null}><SiteHeader locale={locale} content={dictionary.header} /></Suspense><main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8"><Suspense fallback={null}>{content(locale, dictionary)}</Suspense></main><SiteFooter locale={locale} content={dictionary.footer} /></div>;
}
