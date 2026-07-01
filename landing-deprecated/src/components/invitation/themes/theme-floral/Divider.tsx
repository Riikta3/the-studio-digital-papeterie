export function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="h-px w-16 bg-[#c97a90]/20" />
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#c97a90]/40">
        <path d="M8 1 C8 1 10 4 8 8 C6 4 8 1 8 1Z" fill="currentColor" />
        <path d="M8 15 C8 15 10 12 8 8 C6 12 8 15 8 15Z" fill="currentColor" />
        <path d="M1 8 C1 8 4 6 8 8 C4 10 1 8 1 8Z" fill="currentColor" />
        <path d="M15 8 C15 8 12 6 8 8 C12 10 15 8 15 8Z" fill="currentColor" />
      </svg>
      <div className="h-px w-16 bg-[#c97a90]/20" />
    </div>
  );
}
