import Link from "next/link";

import { isRtlLocale, type Dictionary, type Locale } from "@/lib/i18n";

type HeroProps = {
  locale: Locale;
  content: Dictionary["hero"];
};

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD7T7ZVX1JlopYVpf8dOx7L5EPWVpv5--r8VhFTBOsKlboPsWv-a7x9Cq4gLEcnQGYr5P1xNlwSuYiribqK-MuhxlrwCTN5di2g1b4p1cP7wrG9CsVTaQlOUCQxkac1QGmsuaYV9VZcpTsrF0encwcSBvBC_XEvBIg6cxyTztHp9t3vqVFXnDckZ_ZHBJNhPfrerL-tN4SVk0G-qP6ulWLUN1IHdcrNitABWLY4jeo5u0USiYBxArOQBYHaUiaTnu8LZM3m6u_qPrs";

export function Hero({ locale, content }: HeroProps) {
  const isRtl = isRtlLocale(locale);

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div
        className={`flex flex-col items-center gap-12 lg:gap-16 ${
          isRtl ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        <div
          className={`animate-hero-copy flex-1 space-y-6 ${isRtl ? "text-right" : "text-left"}`}
        >
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-primary sm:text-4xl lg:text-5xl">
            {content.title}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant/90 sm:text-lg">
            {content.description}
          </p>

          <div
            className={`flex flex-col gap-4 pt-4 sm:flex-row ${
              isRtl ? "sm:flex-row-reverse" : "sm:flex-row"
            }`}
          >
            <Link
              href={`/${locale}/register`}
              className="rounded-lg bg-primary px-8 py-3.5 text-center font-semibold text-on-primary shadow-md transition-all hover:scale-[1.02] hover:bg-primary-container active:scale-[0.98]"
            >
              {content.primaryAction}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-lg border-2 border-primary px-8 py-3.5 text-center font-semibold text-primary transition-all hover:scale-[1.02] hover:bg-surface-container active:scale-[0.98]"
            >
              {content.secondaryAction}
            </Link>
          </div>

          <div
            className={`flex items-center gap-3 pt-8 text-secondary ${
              isRtl ? "flex-row-reverse justify-start" : "justify-start"
            }`}
          >
            <ShieldIcon />
            <span className="text-sm font-semibold tracking-wide">{content.trustNote}</span>
          </div>
        </div>

        <div className="animate-hero-media relative w-full flex-1">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-secondary-container bg-surface-variant shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={content.artworkAlt}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 shrink-0 text-primary" fill="none">
      <path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}






