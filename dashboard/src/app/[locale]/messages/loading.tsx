export default function MessagesLoading() {
  const widths = [85, 60, 100, 75, 90, 65, 80, 55, 95, 70, 88, 62];

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto space-y-10 bg-[#FDFBF7]">
      {/* Header */}
      <header className="flex flex-col gap-2 pb-4 border-b border-border">
        <div className="h-9 w-40 bg-gray-200/70 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </header>

      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse -mt-4" />

      {/* Masonry skeleton */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
        {[5, 3, 7, 4, 6, 3, 8, 5, 4].map((lines, i) => (
          <div
            key={i}
            className="break-inside-avoid bg-white border border-border rounded-2xl p-6 shadow-sm space-y-3 animate-pulse"
            style={{ opacity: 1 - i * 0.06 }}
          >
            {/* Quote icon */}
            <div className="h-5 w-5 bg-gray-100 rounded" />
            {/* Message lines */}
            <div className="space-y-2 py-1">
              {Array.from({ length: lines }).map((_, j) => (
                <div
                  key={j}
                  className="h-3 bg-gray-100 rounded"
                  style={{ width: `${widths[(i * lines + j) % widths.length]}%` }}
                />
              ))}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-100" />
                <div className="h-3.5 w-24 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
