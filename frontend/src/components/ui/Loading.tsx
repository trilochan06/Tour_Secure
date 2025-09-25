export default function Loading({ label="Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
      {label}
    </div>
  );
}
