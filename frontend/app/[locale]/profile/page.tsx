import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { getDictionary, isLocale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <SiteHeader locale={locale} content={dictionary.header} />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <ProfileScreen locale={locale} dictionary={dictionary} />
      </main>
      <SiteFooter locale={locale} content={dictionary.footer} />
    </div>
  );
}
