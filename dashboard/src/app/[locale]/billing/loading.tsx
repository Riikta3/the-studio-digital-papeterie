export default function BillingLoading() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-9 w-40 bg-gray-200/70 rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Filters bar */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-10 w-44 bg-gray-100 rounded-lg" />
          <div className="h-10 w-36 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-4 w-24 bg-gray-100 rounded" />
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-studio-lavande/40 bg-white shadow-studio-card overflow-hidden animate-pulse">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-studio-lavande/40 bg-gray-50/50">
          <div className="h-5 w-36 bg-gray-200/70 rounded" />
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-4 px-6 py-3 border-b border-studio-lavande/40 bg-gray-50/30">
          {["w-16", "w-20", "w-16", "w-14", "w-20"].map((w, i) => (
            <div key={i} className={`h-3 ${w} bg-gray-200/60 rounded`} />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_100px] gap-4 px-6 py-4 border-b border-studio-lavande/40 last:border-0"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 bg-gray-100 rounded" style={{ width: `${50 + (i % 3) * 15}%` }} />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
            <div className="h-4 w-24 bg-gray-100 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
