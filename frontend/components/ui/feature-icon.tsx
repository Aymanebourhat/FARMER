type FeatureIconProps = {
  name: "registry" | "growth" | "health" | "market";
  className?: string;
};

export function FeatureIcon({ name, className = "size-6" }: FeatureIconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      {...common}
    >
      {name === "registry" && (
        <>
          <path d="M9 5h9a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V6" />
          <path d="M8 3h4v4H8zM9 11h7M9 15h7" />
        </>
      )}
      {name === "growth" && (
        <>
          <path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6" />
          <path d="M15 7h4v4" />
        </>
      )}
      {name === "health" && (
        <>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
          <path d="M9 12h6M12 9v6" />
        </>
      )}
      {name === "market" && (
        <>
          <path d="M4 10v10h16V10M3 5h18l-1 5H4L3 5Z" />
          <path d="M9 20v-6h6v6M5 5l2-2M19 5l-2-2" />
        </>
      )}
    </svg>
  );
}
