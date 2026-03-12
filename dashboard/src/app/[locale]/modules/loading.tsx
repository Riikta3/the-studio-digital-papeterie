export default function ModulesLoading() {
  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10 space-y-2">
        <div className="h-10 w-48 bg-gray-200/70 rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Active modules section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3 w-28 bg-gray-200/60 rounded animate-pulse" />
          <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-4 animate-pulse"
              style={{ opacity: 1 - i * 0.1 }}
            >
              {/* Drag handle */}
              <div className="h-4 w-4 bg-gray-200/60 rounded shrink-0" />
              {/* Icon */}
              <div className="h-9 w-9 bg-gray-100 rounded-lg shrink-0" />
              {/* Text */}
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-gray-200/70 rounded" style={{ width: `${40 + (i % 3) * 15}%` }} />
                <div className="h-3 bg-gray-100 rounded" style={{ width: `${55 + (i % 4) * 10}%` }} />
              </div>
              {/* Arrow */}
              <div className="h-4 w-4 bg-gray-100 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Locked modules section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-32 bg-gray-200/60 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-4 animate-pulse"
            style={{ opacity: 1 - i * 0.15 }}
          >
            {/* Icon */}
            <div className="h-9 w-9 bg-gray-100 rounded-lg shrink-0" />
            {/* Text */}
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200/60 rounded" style={{ width: `${35 + (i % 3) * 12}%` }} />
              <div className="h-3 bg-gray-100 rounded" style={{ width: `${50 + (i % 4) * 8}%` }} />
            </div>
            {/* Lock badge */}
            <div className="h-7 w-20 bg-gray-100 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
