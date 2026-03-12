export default function SettingsLoading() {
  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <header className="pb-8 border-b border-border space-y-2">
        <div className="h-10 w-32 bg-gray-200/70 rounded-lg animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
      </header>

      {/* Tabs */}
      <div className="animate-pulse">
        <div className="flex gap-1 mb-8 bg-gray-100 rounded-lg p-1 w-fit">
          {[64, 56, 72].map((w, i) => (
            <div key={i} className={`h-8 rounded-md bg-gray-200/60 ${i === 0 ? "bg-white shadow-sm" : ""}`} style={{ width: w }} />
          ))}
        </div>

        {/* Section cards */}
        <div className="space-y-6">
          {/* Card 1 — guest code */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="h-5 w-48 bg-gray-200/70 rounded" />
            <div className="h-4 w-96 bg-gray-100 rounded" />
            <div className="h-4 w-80 bg-gray-100 rounded" />
            <div className="space-y-2 pt-2 max-w-md">
              <div className="h-3.5 w-24 bg-gray-200/60 rounded" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-9 w-24 bg-gray-200/60 rounded-lg" />
          </div>

          {/* Card 2 — language */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="h-5 w-36 bg-gray-200/70 rounded" />
            <div className="h-4 w-72 bg-gray-100 rounded" />
            <div className="h-10 w-48 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
