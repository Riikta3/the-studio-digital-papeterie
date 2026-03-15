# Coming Soon Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a maintenance-mode coming-soon page that redirects all routes when `MAINTENANCE_MODE=true`, activated by an env var (requires redeploy to toggle).

**Architecture:** A Next.js middleware wraps next-intl's `createMiddleware` and short-circuits to a redirect before locale handling when maintenance mode is on. The coming-soon page lives in a `(maintenance)` route group with its own minimal layout so it doesn't inherit the full locale layout (ThemeProvider, Analytics, etc.).

**Tech Stack:** Next.js 14 App Router, next-intl 4.x, Tailwind CSS, Cormorant Garamond + Inter (already loaded via root layout font variables).

---

## Chunk 1: Middleware + Route Group Layout + Coming Soon Page

### Task 1: Create the middleware

**Files:**

- Create: `landing/src/middleware.ts`

- [ ] **Step 1: Create the middleware file**

```ts
// landing/src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./navigation";

const intlMiddleware = createMiddleware(routing);

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exempt: API routes, _next internals, static files (contain a dot)
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Maintenance mode redirect
  if (process.env.MAINTENANCE_MODE === "true") {
    const segments = pathname.split("/").filter(Boolean);
    const locale = LOCALES.includes(segments[0]) ? segments[0] : "fr";
    const target = `/${locale}/coming-soon`;

    if (!pathname.endsWith("/coming-soon")) {
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Verify lint passes**

```bash
cd landing && npm run lint
```

Expected: no errors on `src/middleware.ts`.

- [ ] **Step 3: Commit**

```bash
git add landing/src/middleware.ts
git commit -m "feat: add maintenance mode middleware with next-intl coexistence"
```

---

### Task 2: Create the minimal maintenance layout

**Files:**

- Create: `landing/src/app/[locale]/(maintenance)/layout.tsx`

- [ ] **Step 1: Create the layout file**

This layout sits inside the `(maintenance)` route group. It does NOT call `getMessages()` or mount any providers. It only forwards children.

**Intentional deviation from spec:** The spec says this layout should "provide font variables on `<html>`, `bg-background` on `<body>`." In Next.js App Router, the root layout at `landing/src/app/layout.tsx` is always active and already provides `<html>`, `<body>`, all font CSS variables, and `bg-background bg-noise`. Adding those here would produce invalid nested `<html>`/`<body>`. The passthrough layout is the correct implementation — `bg-background` and `bg-noise` are inherited from the root body.

```tsx
// landing/src/app/[locale]/(maintenance)/layout.tsx
export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Verify lint passes**

```bash
cd landing && npm run lint
```

Expected: no errors on the new file.

- [ ] **Step 3: Commit**

```bash
git add "landing/src/app/[locale]/(maintenance)/layout.tsx"
git commit -m "feat: add minimal maintenance route group layout"
```

---

### Task 3: Create the coming-soon page

**Files:**

- Create: `landing/src/app/[locale]/(maintenance)/coming-soon/page.tsx`

- [ ] **Step 1: Create the page file**

```tsx
// landing/src/app/[locale]/(maintenance)/coming-soon/page.tsx
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Bientôt disponible — The Studio Digital Papeterie",
  description: "L'art du faire-part repensé pour l'ère digitale.",
};

export default function ComingSoonPage() {
  // Note: `bg-background` and `bg-noise` are inherited from root layout's <body>.
  // They do not need to be repeated here.
  return (
    <main className='relative min-h-screen overflow-hidden flex flex-col items-center justify-center text-center px-4'>
      {/* Radial halo crème */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 40%, transparent 20%, rgba(253,251,247,0.7) 80%)",
        }}
        aria-hidden='true'
      />

      {/* Ornement coin haut-gauche */}
      <OrnamentSvg
        className='absolute -top-10 -left-10 w-64 h-64 -rotate-[15deg] opacity-[0.07] pointer-events-none'
        aria-hidden='true'
      />

      {/* Ornement coin bas-droit */}
      <OrnamentSvg
        className='absolute -bottom-10 -right-10 w-60 h-60 rotate-[165deg] opacity-[0.07] pointer-events-none'
        aria-hidden='true'
      />

      {/* Contenu */}
      <div className='relative z-10 flex flex-col items-center gap-8 max-w-lg'>
        {/* Logo */}
        <div className='relative h-10 w-auto min-w-[7rem]'>
          <Image
            src='/images/logo.png'
            alt='The Studio Digital Papeterie'
            fill
            className='object-contain opacity-80'
            priority
          />
        </div>

        <Divider />

        {/* Eyebrow */}
        <p className='text-[0.6rem] uppercase tracking-[0.28em] text-primary font-medium'>
          Faire-part digital haut de gamme
        </p>

        {/* Titre */}
        <h1 className='font-heading text-[clamp(3rem,8vw,5.5rem)] font-medium leading-[0.95] tracking-tight'>
          Quelque chose <br />
          de <em className='italic text-primary font-semibold'>beau</em>
          <br />
          arrive.
        </h1>

        {/* Sous-titre */}
        <p className='font-heading italic text-muted-foreground text-[clamp(1rem,2.5vw,1.3rem)] leading-relaxed max-w-sm'>
          L&apos;art du faire-part repensé pour l&apos;ère digitale — bientôt
          disponible.
        </p>

        <Divider />

        {/* Contact */}
        <p className='text-xs text-muted-foreground'>
          Une question ?{" "}
          <a
            href='mailto:contact@thestudiopapeteriedigitale.com'
            className='text-primary border-b border-primary/30 hover:opacity-70 transition-opacity'
          >
            contact@thestudiopapeteriedigitale.com
          </a>
        </p>
      </div>

      {/* Footer */}
      <p className='absolute bottom-8 left-1/2 -translate-x-1/2 text-[0.65rem] uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap'>
        © The Studio Digital Papeterie
      </p>
    </main>
  );
}

function Divider() {
  return (
    <div className='flex items-center justify-center gap-3 w-full'>
      <div className='h-px w-14 bg-primary/30' />
      <div className='w-1.5 h-1.5 bg-primary/50 rotate-45 shrink-0' />
      <div className='h-px w-14 bg-primary/30' />
    </div>
  );
}

function OrnamentSvg({
  className,
  "aria-hidden": ariaHidden,
}: {
  className?: string;
  "aria-hidden"?: boolean | "true";
}) {
  return (
    <svg
      className={className}
      aria-hidden={ariaHidden}
      viewBox='0 0 300 300'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M150 20 C90 20 20 90 20 150 C20 210 90 280 150 280 C210 280 280 210 280 150 C280 90 210 20 150 20Z'
        stroke='hsl(344,53%,35%)'
        strokeWidth='1'
      />
      <path
        d='M150 50 C100 50 50 100 50 150 C50 200 100 250 150 250 C200 250 250 200 250 150 C250 100 200 50 150 50Z'
        stroke='hsl(344,53%,35%)'
        strokeWidth='0.5'
      />
      <line
        x1='150'
        y1='0'
        x2='150'
        y2='300'
        stroke='hsl(344,53%,35%)'
        strokeWidth='0.3'
        opacity='0.5'
      />
      <line
        x1='0'
        y1='150'
        x2='300'
        y2='150'
        stroke='hsl(344,53%,35%)'
        strokeWidth='0.3'
        opacity='0.5'
      />
      <circle
        cx='150'
        cy='150'
        r='8'
        stroke='hsl(344,53%,35%)'
        strokeWidth='1'
      />
      <path
        d='M150 30 C150 30 178 80 150 120 C122 80 150 30 150 30Z'
        fill='hsl(344,53%,35%)'
        opacity='0.6'
      />
      <path
        d='M150 270 C150 270 178 220 150 180 C122 220 150 270 150 270Z'
        fill='hsl(344,53%,35%)'
        opacity='0.6'
      />
      <path
        d='M30 150 C30 150 80 122 120 150 C80 178 30 150 30 150Z'
        fill='hsl(344,53%,35%)'
        opacity='0.6'
      />
      <path
        d='M270 150 C270 150 220 122 180 150 C220 178 270 150 270 150Z'
        fill='hsl(344,53%,35%)'
        opacity='0.6'
      />
    </svg>
  );
}
```

- [ ] **Step 2: Verify lint passes**

```bash
cd landing && npm run lint
```

Expected: no errors on the new file.

- [ ] **Step 3: Smoke test locally**

Create or edit `landing/.env.local` and add:

```
MAINTENANCE_MODE=true
```

Then start the dev server:

```bash
npm run dev:landing
```

- Open `http://localhost:3002/fr` → should redirect to `http://localhost:3002/fr/coming-soon` (expected: coming-soon page renders)
- Open `http://localhost:3002/fr/coming-soon` directly → should render the page **without** redirecting again (no infinite loop)
- Open `http://localhost:3002/en` → should redirect to `http://localhost:3002/en/coming-soon`
- Open `http://localhost:3002/api/check-email` → should **not** redirect (returns JSON or 405, not HTML redirect)

After smoke test, remove `MAINTENANCE_MODE=true` from `landing/.env.local` (or set it to `false`) and verify the site loads normally.

- [ ] **Step 4: Commit**

```bash
git add "landing/src/app/[locale]/(maintenance)/coming-soon/page.tsx"
git commit -m "feat: add coming-soon page with floral ornament design"
```

---

### Task 4: Add `.superpowers/` to `.gitignore`

**Files:**

- Modify: `.gitignore` (root)

- [ ] **Step 1: Check if `.superpowers/` is already ignored**

```bash
grep -n "superpowers" .gitignore
```

If not present, continue.

- [ ] **Step 2: Add the entry**

Add `.superpowers/` to the root `.gitignore`.

- [ ] **Step 3: Verify it works**

```bash
git status
```

Expected: `.superpowers/` no longer appears as an untracked directory.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers/ brainstorm session files"
```
