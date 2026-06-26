export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center text-muted">
      <div className="flex flex-col items-center gap-3">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-muted/30 border-t-[var(--accent)]" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}
