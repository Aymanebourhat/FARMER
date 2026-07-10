import Link from "next/link";

import { FeatureIcon } from "@/components/ui/feature-icon";
import type { Dictionary, Locale } from "@/lib/i18n";

type FeatureGridProps = {
  locale: Locale;
  content: Dictionary["features"];
};

export function FeatureGrid({ locale, content }: FeatureGridProps) {
  const samplePoints = [content.sampleOne, content.sampleTwo, content.sampleThree];
  const isRtl = locale !== "fr";

  return (
    <section id="features" className="border-t border-secondary-container/30 py-12 md:py-16">
      <h2 className={`mb-10 text-2xl font-extrabold text-primary sm:text-3xl ${isRtl ? "text-right" : "text-left"}`}>
        {content.title}
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Link
          href={`/${locale}/register`}
          className="animate-stagger-card group flex flex-col justify-between rounded-2xl border border-secondary-container bg-white p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg sm:p-8 md:col-span-2 md:row-span-2"
          style={{ animationDelay: "0ms" }}
        >
          <div>
            <IconBadge name="registry" />
            <h3 className={`mb-3 mt-5 text-xl font-bold text-primary sm:text-2xl ${isRtl ? "text-right" : "text-left"}`}>
              {content.registryTitle}
            </h3>
            <p className={`mb-6 text-sm leading-relaxed text-on-surface-variant/95 ${isRtl ? "text-right" : "text-left"}`}>
              {content.registryDescription}
            </p>
          </div>

          <div className="flex h-44 flex-col justify-between rounded-xl border border-secondary-container/40 bg-surface-container-low p-5 shadow-inner">
            <div className={`flex items-center justify-between border-b border-secondary-container/30 pb-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <span className="font-mono text-xs font-bold text-primary">Phase 1</span>
              <span className="rounded-full bg-success-container px-2.5 py-0.5 text-[10px] font-bold text-success">
                API
              </span>
            </div>
            <div className={`grid grid-cols-1 gap-2 py-2 sm:grid-cols-3 ${isRtl ? "text-right" : "text-left"}`}>
              {samplePoints.map((point, index) => (
                <div key={point}>
                  <span className="block text-[10px] text-on-surface-variant/70">0{index + 1}</span>
                  <span className="text-xs font-bold text-primary">{point}</span>
                </div>
              ))}
            </div>
            <div className={`rounded-lg border border-secondary-container/20 bg-white/80 p-2.5 text-xs ${isRtl ? "text-right" : "text-left"}`}>
              <span className="text-[11px] font-medium text-on-surface-variant/80">
                /api/v1/auth/register + /api/v1/farmers/me
              </span>
            </div>
          </div>
        </Link>

        <FeatureCard
          href={`/${locale}/login`}
          delay="100ms"
          icon="growth"
          title={content.growthTitle}
          description={content.growthDescription}
          isRtl={isRtl}
        />
        <FeatureCard
          href={`/${locale}/profile`}
          delay="200ms"
          icon="health"
          title={content.healthTitle}
          description={content.healthDescription}
          isRtl={isRtl}
          warm
        />
        <FeatureCard
          href={`/${locale}/dashboard`}
          delay="300ms"
          icon="market"
          title={content.marketTitle}
          description={content.marketDescription}
          isRtl={isRtl}
          dark
        />
      </div>
    </section>
  );
}

type FeatureCardProps = {
  href: string;
  delay: string;
  icon: "growth" | "health" | "market";
  title: string;
  description: string;
  isRtl: boolean;
  warm?: boolean;
  dark?: boolean;
};

function FeatureCard({ href, delay, icon, title, description, isRtl, warm = false, dark = false }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className={`animate-stagger-card group flex min-h-64 flex-col justify-between rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg ${
        dark
          ? "border-primary bg-primary text-on-primary hover:shadow-xl"
          : "border-secondary-container bg-white text-primary hover:border-primary/20"
      }`}
      style={{ animationDelay: delay }}
    >
      <IconBadge name={icon} warm={warm} dark={dark} />
      <div>
        <h3 className={`mb-2.5 text-lg font-bold sm:text-xl ${isRtl ? "text-right" : "text-left"}`}>{title}</h3>
        <p className={`text-sm leading-relaxed ${dark ? "text-primary-fixed/90" : "text-on-surface-variant/90"} ${isRtl ? "text-right" : "text-left"}`}>
          {description}
        </p>
      </div>
    </Link>
  );
}

type IconBadgeProps = {
  name: "registry" | "growth" | "health" | "market";
  warm?: boolean;
  dark?: boolean;
};

function IconBadge({ name, warm = false, dark = false }: IconBadgeProps) {
  return (
    <span
      className={`flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
        dark
          ? "bg-primary-container/80 text-primary-fixed"
          : warm
            ? "bg-error-container text-error"
            : "bg-secondary-fixed text-primary"
      }`}
    >
      <FeatureIcon name={name} className="size-6" />
    </span>
  );
}

