type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "size-10" }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-fixed ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[55%]" fill="none">
        <path
          d="M5 15.5h12.5M7.5 15.5V11h7l3 4.5M9.5 11V8.5h3.5l1.5 2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="17.5" r="2.3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.5" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </span>
  );
}
