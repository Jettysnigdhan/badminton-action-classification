// Shared brand mark — keeps the marketing site, auth, and app visually cohesive.
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-lg bg-midnight text-cyan ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[60%] w-[60%]"
      >
        <circle cx="12" cy="4.5" r="2" />
        <path d="M12 6.5v6M12 8.5l-4 2M12 8.5l4 2M12 12.5l-3 5M12 12.5l3 5" />
      </svg>
    </span>
  );
}
