export default function ModuleConfigLoading() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-pulse">
      {/* Back button */}
      <div className="mb-8">
        <div className="h-9 w-32 rounded-full bg-muted mb-6" />
        <div className="h-10 w-56 rounded-xl bg-muted mb-3" />
        <div className="h-4 w-80 rounded-lg bg-muted" />
      </div>

      {/* Config card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8 space-y-6">

        {/* Field 1 — label + input */}
        <div className="space-y-2">
          <div className="h-3.5 w-24 rounded bg-muted" />
          <div className="h-10 w-full rounded-xl bg-muted" />
        </div>

        {/* Field 2 — label + input */}
        <div className="space-y-2">
          <div className="h-3.5 w-32 rounded bg-muted" />
          <div className="h-10 w-full rounded-xl bg-muted" />
        </div>

        {/* Field 3 — label + textarea */}
        <div className="space-y-2">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-20 w-full rounded-xl bg-muted" />
        </div>

        {/* Field 4 — label + zone upload / toggle */}
        <div className="space-y-2">
          <div className="h-3.5 w-20 rounded bg-muted" />
          <div className="h-24 w-full rounded-xl bg-muted" />
        </div>

        {/* Divider */}
        <div className="h-px bg-muted w-full" />

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-9 w-28 rounded-xl bg-muted" />
          <div className="h-9 w-32 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
