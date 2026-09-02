export default function RsvpResponsesLoading() {
  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto space-y-8 bg-[#FDFBF7]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-studio-lavande/40">
        <div className="space-y-2">
          <div className="h-9 w-56 bg-gray-200/70 rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-gray-100/80 rounded animate-pulse" />
        </div>
      </header>

      {/* Stats — 5 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[
          "bg-white/50 border-gray-100",
          "bg-amber-50/50 border-amber-100",
          "bg-green-50/50 border-green-100",
          "bg-red-50/50 border-red-100",
          "bg-studio-violet/5 border-studio-violet/10",
        ].map((cls, i) => (
          <div key={i} className={`${cls} border shadow-sm rounded-xl p-5 space-y-2 animate-pulse`}>
            <div className="h-3.5 w-24 bg-gray-200/60 rounded" />
            <div className="h-7 w-12 bg-gray-200/80 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-studio-lavande/40 shadow-sm p-4 space-y-3 animate-pulse">
        {/* Row 1 — search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="h-9 w-full sm:max-w-xs bg-gray-100 rounded-lg" />
          <div className="flex gap-2 sm:ml-auto">
            {[64, 72, 56, 72].map((w, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-md" style={{ width: w }} />
            ))}
          </div>
        </div>
        {/* Row 2 — actions */}
        <div className="flex gap-2 border-t border-studio-lavande/40 pt-3">
          <div className="h-8 w-24 bg-gray-100 rounded-md" />
          <div className="h-8 w-24 bg-gray-100 rounded-md" />
          <div className="h-8 w-20 bg-gray-100 rounded-md" />
          <div className="h-8 w-36 bg-gray-100 rounded-md ml-auto" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-studio-lavande/40 shadow-sm overflow-hidden animate-pulse">
        {/* Header row */}
        <div className="border-b border-studio-lavande/40 bg-studio-lavande/10 px-4 py-3.5 grid grid-cols-[40px_40px_18%_16%_8%_1fr_1fr_10%_40px] gap-4 items-center">
          {[20, 20, 80, 64, 32, 100, 80, 48, 20].map((w, i) => (
            <div key={i} className="h-3 bg-gray-200/60 rounded" style={{ maxWidth: w }} />
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-studio-lavande/30 px-4 py-4 grid grid-cols-[40px_40px_18%_16%_8%_1fr_1fr_10%_40px] gap-4 items-center"
            style={{ opacity: 1 - i * 0.09 }}
          >
            <div className="h-4 w-4 bg-gray-100 rounded" />
            <div className="h-4 w-4 bg-gray-100 rounded" />
            {/* Name */}
            <div className="h-4 bg-gray-100 rounded" style={{ width: `${55 + (i % 3) * 15}%` }} />
            {/* Badge */}
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
            {/* Guests */}
            <div className="h-4 w-6 bg-gray-100 rounded" />
            {/* Dietary */}
            <div className="h-4 bg-gray-100 rounded" style={{ width: `${30 + (i % 4) * 10}%` }} />
            {/* Note */}
            <div className="h-4 bg-gray-100 rounded" style={{ width: `${20 + (i % 5) * 12}%` }} />
            {/* Date */}
            <div className="h-3 w-16 bg-gray-100 rounded" />
            {/* Delete */}
            <div className="h-4 w-4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Count */}
      <div className="h-3 w-24 bg-gray-100 rounded ml-auto animate-pulse" />
    </div>
  );
}
