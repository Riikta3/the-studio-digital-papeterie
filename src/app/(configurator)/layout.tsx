import Link from "next/link";
import type { ReactNode } from "react";

export default function ConfiguratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-luxe">
            Meet My Weeding
          </Link>
          <span className="text-xs uppercase tracking-supertitle text-muted-foreground">
            Configurateur
          </span>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
}
