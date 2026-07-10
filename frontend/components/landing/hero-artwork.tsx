import type { Dictionary } from "@/lib/i18n";

type HeroArtworkProps = {
  content: Dictionary["hero"];
};

export function HeroArtwork({ content }: HeroArtworkProps) {
  return (
    <div
      role="img"
      aria-label={content.artworkAlt}
      className="relative min-h-[330px] overflow-hidden rounded-2xl border border-secondary-container bg-primary-fixed shadow-xl sm:min-h-[430px]"
    >
      <svg aria-hidden="true" viewBox="0 0 760 560" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        <rect width="760" height="560" fill="#c1ecd4" />
        <circle cx="630" cy="90" r="45" fill="#f5d89b" />
        <path d="M0 300C130 220 230 250 350 300S600 340 760 245V560H0Z" fill="#86af99" />
        <path d="M0 390C180 310 290 350 430 395S640 415 760 350V560H0Z" fill="#1b4332" opacity="0.75" />
        <path d="M0 465C170 390 310 440 470 470s210 20 290-5v95H0Z" fill="#012d1d" />
        <path d="M160 318h145v108H160z" fill="#fcf9f8" />
        <path d="m140 325 92-70 94 70" fill="#ebe1d6" />
        <path d="M208 354h48v72h-48z" fill="#012d1d" />
        <path d="M82 362v-76M65 318h34M70 296h25" stroke="#012d1d" strokeWidth="9" strokeLinecap="round" />
      </svg>
      <div className="absolute end-[5%] top-[8%] w-[52%] min-w-52 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur sm:p-5">
        <div className="mb-5 flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-primary-container" />
          <span className="h-2.5 w-20 rounded-full bg-primary/15" />
        </div>
        <div className="space-y-4">
          {["/auth/me", "/farmers/me", "JWT"].map((label, index) => (
            <div key={label}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-primary sm:text-xs">{label}</span>
                <span className="size-2 rounded-full bg-primary-fixed" />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                <div className="h-full rounded-full bg-primary" style={{ width: `${index === 0 ? 84 : index === 1 ? 66 : 74}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
