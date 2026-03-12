export default function ModuleConfigLoading() {
  return (
    <div className="p-6 md:p-10 xl:p-12 max-w-[1400px] mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-32 rounded-full bg-muted mb-6" />
        <div className="h-12 w-64 rounded-xl bg-muted mx-auto mb-3" />
        <div className="h-4 w-80 rounded-lg bg-muted mx-auto" />
      </div>

      {/* Layout 2 colonnes */}
      <div className="flex gap-8 items-start">
        {/* Colonne form */}
        <div className="w-full xl:w-[480px] shrink-0">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8 space-y-6">
            {/* Field 1 */}
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-10 w-full rounded-xl bg-muted" />
            </div>
            {/* Field 2 */}
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-10 w-full rounded-xl bg-muted" />
            </div>
            {/* Field 3 — textarea */}
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-24 w-full rounded-xl bg-muted" />
            </div>
            {/* Field 4 — toggle */}
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-10 flex-1 rounded-xl bg-muted" />
                <div className="h-10 flex-1 rounded-xl bg-muted" />
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <div className="h-10 w-28 rounded-xl bg-muted" />
              <div className="h-10 w-24 rounded-xl bg-muted" />
            </div>
          </div>
        </div>

        {/* Colonne preview */}
        <div className="hidden xl:flex flex-col flex-1 min-w-0" style={{ height: "calc(100vh - 4rem)" }}>
          {/* Label "Aperçu en direct" */}
          <div className="h-4 w-36 rounded bg-muted mb-4 ml-1" />
          {/* Preview card */}
          <div className="flex-1 bg-white rounded-2xl border border-border overflow-hidden p-10 space-y-8">
            {/* Titre module */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-10 w-48 rounded-xl bg-muted" />
            </div>
            {/* Bloc contenu */}
            <div className="max-w-sm mx-auto space-y-4">
              <div className="h-32 w-full rounded-2xl bg-muted" />
              <div className="h-32 w-full rounded-2xl bg-muted" />
              <div className="h-32 w-full rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
