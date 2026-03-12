export default function PlaylistLoading() {
  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-8 bg-[#FDFBF7]">
      {/* Header */}
      <header className="flex flex-col gap-1 pb-4 border-b border-border">
        <div className="h-9 w-56 bg-gray-200/70 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </header>

      {/* Stats — 3 cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white/50 border border-gray-100 shadow-sm rounded-xl p-5 space-y-2 animate-pulse">
          <div className="h-3.5 w-24 bg-gray-200/60 rounded" />
          <div className="h-7 w-10 bg-gray-200/80 rounded" />
          <div className="h-3 w-36 bg-gray-100 rounded" />
        </div>
        <div className="bg-green-50/50 border border-green-100 shadow-sm rounded-xl p-5 space-y-2 animate-pulse">
          <div className="h-3.5 w-28 bg-green-200/50 rounded" />
          <div className="h-7 w-8 bg-green-200/60 rounded" />
          <div className="h-3 w-24 bg-green-100/80 rounded" />
        </div>
        <div className="bg-primary/5 border border-primary/10 shadow-sm rounded-xl p-5 space-y-2 animate-pulse">
          <div className="h-3.5 w-20 bg-primary/20 rounded" />
          <div className="h-7 w-10 bg-primary/20 rounded" />
          <div className="h-3 w-16 bg-primary/10 rounded" />
        </div>
      </div>

      {/* Toolbar — search + add button */}
      <div className="flex gap-3 animate-pulse">
        <div className="h-9 flex-1 bg-gray-100 rounded-lg" />
        <div className="h-9 w-36 bg-gray-100 rounded-lg shrink-0" />
      </div>

      {/* Filters + sort */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="flex gap-2">
          {[64, 80, 80, 72].map((w, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-10 bg-gray-100 rounded" />
          {[44, 44, 52, 52].map((w, i) => (
            <div key={i} className="h-7 bg-gray-100 rounded-md" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Tracks list */}
      <div className="bg-white border border-border rounded-xl overflow-hidden animate-pulse">
        {/* Header row */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border bg-gray-50/60">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>

        <div className="divide-y divide-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3"
              style={{ opacity: 1 - i * 0.1 }}
            >
              {/* Checkbox */}
              <div className="w-4 h-4 bg-gray-100 rounded shrink-0" />
              {/* Cover */}
              <div className="w-11 h-11 bg-gray-100 rounded-lg shrink-0" />
              {/* Info */}
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200/70 rounded" style={{ width: `${40 + (i % 3) * 15}%` }} />
                <div className="h-3 bg-gray-100 rounded" style={{ width: `${30 + (i % 4) * 10}%` }} />
                <div className="h-2.5 bg-gray-100/60 rounded" style={{ width: `${50 + (i % 3) * 8}%` }} />
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-7 h-7 bg-gray-100 rounded-lg" />
                <div className="w-7 h-7 bg-gray-100 rounded-lg" />
                <div className="w-7 h-7 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
