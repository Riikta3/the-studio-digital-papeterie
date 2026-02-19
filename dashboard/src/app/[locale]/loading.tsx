export default function Loading() {
  return (
    <div className='min-h-screen p-4 md:p-8 lg:p-12 max-w-6xl mx-auto space-y-6 bg-[#FDFBF7]/50'>
      {/* Header Skeleton */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200/60 pb-6 gap-4'>
        <div className='space-y-3 w-full md:w-auto'>
          <div className='h-12 w-64 bg-gray-200/50 rounded-lg animate-pulse' />
          <div className='mt-4 h-24 w-full md:w-96 bg-gray-200/50 rounded-lg animate-pulse' />
        </div>
        <div className='hidden md:block self-start md:self-center'>
          <div className='h-10 w-32 bg-gray-200/50 rounded-lg animate-pulse' />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <section className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='bg-white rounded-xl border border-border p-6 shadow-sm h-40 animate-pulse'
          >
            <div className='flex justify-between items-start'>
              <div className='space-y-4 w-full'>
                <div className='h-4 w-24 bg-gray-100 rounded' />
                <div className='h-8 w-16 bg-gray-100 rounded' />
                <div className='h-4 w-full bg-gray-100 rounded' />
              </div>
              <div className='h-8 w-8 bg-gray-100 rounded-lg' />
            </div>
          </div>
        ))}
      </section>

      {/* Main Grid Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className='bg-white rounded-xl border border-border p-6 shadow-sm h-[420px] animate-pulse'
          >
            <div className='space-y-4'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='h-5 w-5 bg-gray-100 rounded' />
                <div className='h-6 w-32 bg-gray-100 rounded' />
              </div>
              <div className='space-y-3'>
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    className='h-16 bg-gray-50 rounded-lg'
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
