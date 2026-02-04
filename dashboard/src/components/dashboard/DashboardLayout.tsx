"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that occupy full screen (no sidebar)
  const isFullScreen =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/rsvp") ||
    pathname === "/preview";

  if (isFullScreen) {
    return <>{children}</>;
  }

  return (
    <div className='min-h-screen bg-[#FDFBF7]'>
      <Sidebar />
      <main className='md:ml-64 min-h-screen transition-all'>{children}</main>
    </div>
  );
}
