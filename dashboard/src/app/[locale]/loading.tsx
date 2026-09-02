/**
 * Loading skeleton for the home page.
 *
 * It has to mirror the real layout or the page jumps when data arrives: one
 * hero countdown, two KPI groups, a to-do list and the invitation card. The
 * previous version still described the old three-column layout with 420px
 * fixed-height panels, which no longer exists.
 */
export default function Loading() {
  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-5xl space-y-6'>
        {/* Greeting + settings button */}
        <div className='flex flex-col items-start justify-between gap-4 border-b border-studio-lavande/30 pb-6 md:flex-row md:items-center'>
          <div className='h-8 w-64 animate-pulse rounded-lg bg-studio-lavande/20' />
          <div className='h-11 w-full animate-pulse rounded-lg bg-studio-lavande/20 md:w-32' />
        </div>

        {/* Countdown hero */}
        <div className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card md:p-8'>
          <div className='h-3 w-32 animate-pulse rounded bg-studio-lavande/20' />
          <div className='mt-4 flex gap-6'>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className='space-y-2'>
                <div className='h-8 w-10 animate-pulse rounded bg-studio-lavande/20' />
                <div className='h-3 w-10 animate-pulse rounded bg-studio-lavande/10' />
              </div>
            ))}
          </div>
        </div>

        {/* Two KPI groups, four tiles each */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {[0, 1].map((card) => (
            <div
              key={card}
              className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card'
            >
              <div className='h-5 w-28 animate-pulse rounded bg-studio-lavande/20' />
              <div className='mt-4 grid grid-cols-2 gap-3'>
                {[0, 1, 2, 3].map((tile) => (
                  <div
                    key={tile}
                    className='h-20 animate-pulse rounded-xl bg-studio-beurre'
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* To-do list */}
        <div className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card'>
          <div className='h-5 w-20 animate-pulse rounded bg-studio-lavande/20' />
          <div className='mt-4 space-y-2'>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className='h-16 animate-pulse rounded-xl bg-studio-beurre'
              />
            ))}
          </div>
        </div>

        {/* Invitation card */}
        <div className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card md:p-6'>
          <div className='h-5 w-24 animate-pulse rounded bg-studio-lavande/20' />
          <div className='mt-2 h-4 w-48 animate-pulse rounded bg-studio-lavande/10' />
          <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
            <div className='h-11 flex-1 animate-pulse rounded-lg bg-studio-lavande/20' />
            <div className='h-11 flex-1 animate-pulse rounded-lg bg-studio-lavande/20' />
          </div>
        </div>
      </div>
    </div>
  );
}
