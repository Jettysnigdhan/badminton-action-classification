const STYLES: Record<string, string> = {
  complete: "bg-success/10 text-success ring-success/20",
  processing: "bg-accent/10 text-accent ring-accent/20",
  review: "bg-warning/10 text-warning ring-warning/25",
};

const DOTS: Record<string, string> = {
  complete: "bg-success",
  processing: "bg-accent animate-pulse-soft",
  review: "bg-warning",
};

const LABELS: Record<string, string> = {
  complete: "Complete",
  processing: "Processing",
  review: "Needs review",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        STYLES[status] ?? "bg-overlay/60 text-muted ring-line/10"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] ?? "bg-faint"}`} />
      {LABELS[status] ?? status}
    </span>
  );
}
