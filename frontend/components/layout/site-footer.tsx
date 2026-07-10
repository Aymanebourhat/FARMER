import Link from "next/link";

import { BrandMark } from "@/components/ui/brand-mark";
import type { Dictionary, Locale } from "@/lib/i18n";

type SiteFooterProps = {
  locale: Locale;
  content: Dictionary["footer"];
};

export function SiteFooter({ locale, content }: SiteFooterProps) {
  return (
    <footer className="mt-16 border-t border-secondary-container/30 bg-white py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row lg:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 rounded-lg">
          <BrandMark className="size-8" />
          <span className="text-lg font-bold tracking-tight text-primary">FellahLink</span>
        </Link>
        <p className="max-w-md text-center text-xs text-on-surface-variant/80">
          {content.tagline}
        </p>
        <p className="text-xs text-on-surface-variant/70">
          © {new Date().getFullYear()} FellahLink. {content.rights}
        </p>
      </div>
    </footer>
  );
}
