/** The editor's frame while the invitation loads: header, tabs, form, preview. */
export default function InvitationEditorLoading() {
  return (
    <div className="flex h-dvh flex-col bg-studio-creme">
      <div className="border-b border-studio-lavande/40 bg-white">
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-studio-lavande/30 sm:w-40" />
          <div className="h-5 w-40 animate-pulse rounded bg-studio-lavande/30" />
          <div className="ml-auto h-9 w-28 animate-pulse rounded-full bg-studio-lavande/30" />
        </div>
        <div className="flex gap-4 border-t border-studio-lavande/30 px-5 py-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-4 w-20 animate-pulse rounded bg-studio-lavande/25" />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-full space-y-4 p-6 lg:w-[480px] xl:w-[540px]">
          <div className="h-7 w-48 animate-pulse rounded bg-studio-lavande/30" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-white/80" />
          ))}
        </div>
        <div className="hidden flex-1 items-start justify-center pt-6 lg:flex">
          <div className="h-[80%] w-[410px] animate-pulse rounded-[44px] bg-white/70" />
        </div>
      </div>
    </div>
  );
}
