"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/ui/brand-mark";
import type { Dictionary, Locale } from "@/lib/i18n";

type SiteHeaderProps = {
  locale: Locale;
  content: Dictionary["header"];
};

export function SiteHeader({ locale, content }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const pathname = usePathname();
  const homeHref = `/${locale}`;
  const isRtl = locale !== "fr";

  const languageHref = (nextLocale: Locale) => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return `/${nextLocale}`;
    }
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  };

  const currentLanguageLabel =
    locale === "ar" ? content.arabic : locale === "ary" ? content.darija : content.french;

  const navItems = [
    { href: `${homeHref}#features`, label: content.features },
    { href: `/${locale}/dashboard`, label: content.dashboard },
    { href: `/${locale}/profile`, label: content.profile },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-secondary-container/40 bg-white shadow-sm transition-all duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link
              href={homeHref}
              className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-90 focus:outline-none"
              aria-label="FellahLink"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BrandMark />
              <span className="text-2xl font-extrabold tracking-tight text-primary">
                FellahLink
              </span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`border-b-2 py-2 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-on-surface-variant/80 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setLangMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-secondary transition-all hover:bg-surface-container"
                aria-expanded={langMenuOpen}
                aria-haspopup="menu"
              >
                <GlobeIcon />
                <span>{currentLanguageLabel}</span>
              </button>

              {langMenuOpen && (
                <div
                  className={`absolute mt-2 w-40 overflow-hidden rounded-xl border border-secondary-container bg-white shadow-lg ${
                    isRtl ? "left-0" : "right-0"
                  } animate-fade-in`}
                  role="menu"
                >
                  <LanguageLink
                    href={languageHref("ar")}
                    label={content.arabic}
                    active={locale === "ar"}
                    alignRight={isRtl}
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <LanguageLink
                    href={languageHref("ary")}
                    label={content.darija}
                    active={locale === "ary"}
                    alignRight={isRtl}
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <LanguageLink
                    href={languageHref("fr")}
                    label={content.french}
                    active={locale === "fr"}
                    alignRight={isRtl}
                    onClick={() => setLangMenuOpen(false)}
                  />
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <Link
                href={`/${locale}/login`}
                className="rounded-lg px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-surface-container"
              >
                {content.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container"
              >
                {content.register}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-secondary transition-all hover:bg-surface-container md:hidden"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? content.closeMenu : content.openMenu}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="animate-fade-in border-t border-secondary-container bg-white px-4 py-4 shadow-inner md:hidden">
          <nav className="space-y-3" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  isRtl ? "text-right" : "text-left"
                } text-on-surface-variant hover:bg-surface-container`}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-secondary-container/60" />
            <div className="grid grid-cols-3 gap-2">
              <MobileLanguageLink
                href={languageHref("ar")}
                label={content.arabic}
                active={locale === "ar"}
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLanguageLink
                href={languageHref("ary")}
                label={content.darija}
                active={locale === "ary"}
                onClick={() => setMobileMenuOpen(false)}
              />
              <MobileLanguageLink
                href={languageHref("fr")}
                label={content.french}
                active={locale === "fr"}
                onClick={() => setMobileMenuOpen(false)}
              />
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${locale}/login`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 rounded-xl border border-secondary-container py-2.5 text-center text-sm font-bold text-primary"
              >
                {content.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-on-primary shadow-sm"
              >
                {content.register}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

type LanguageLinkProps = {
  href: string;
  label: string;
  active: boolean;
  alignRight: boolean;
  onClick: () => void;
};

function LanguageLink({ href, label, active, alignRight, onClick }: LanguageLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block w-full px-4 py-2.5 text-sm font-medium transition-all hover:bg-surface-container ${
        alignRight ? "text-right" : "text-left"
      } ${active ? "bg-primary-fixed/20 font-semibold text-primary" : "text-on-background"}`}
      role="menuitem"
    >
      {label}
    </Link>
  );
}

function MobileLanguageLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-xl border border-secondary-container py-2.5 text-center text-xs font-bold ${
        active ? "bg-primary text-on-primary" : "text-primary"
      }`}
    >
      {label}
    </Link>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
