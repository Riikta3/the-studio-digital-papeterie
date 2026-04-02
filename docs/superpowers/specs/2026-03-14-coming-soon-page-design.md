# Coming Soon Page — Design Spec

**Date:** 2026-03-14
**Branch:** `prod`

---

## Context

A production branch (`prod`) will be deployed for real users. While the site is not ready for public access, all routes must redirect to a "Work in Progress" page. The feature activates via an environment variable so the toggle is deployable without a code change (requires a redeploy to take effect — see note below).

---

## Behaviour

- All routes redirect to `/{locale}/coming-soon` when `MAINTENANCE_MODE=true`
- The following paths are **exempt** from the redirect:
  - `/{locale}/coming-soon` itself (no infinite loop)
  - `/api/**` (Stripe webhooks and other API routes must remain reachable in production)
  - `/_next/**`, `/favicon.ico`, static assets
- On `main` branch, `MAINTENANCE_MODE` is absent or `false` — site behaves normally
- On `prod` branch, `MAINTENANCE_MODE=true` is set in Vercel environment variables

**Note on variable naming:** Using a plain server-side `MAINTENANCE_MODE` (without `NEXT_PUBLIC_` prefix) is correct here. Next.js middleware runs at Edge runtime and environment variables are baked in at build time regardless of prefix. Using `NEXT_PUBLIC_` would be semantically misleading (it implies browser exposure). A plain `MAINTENANCE_MODE` variable sets correct expectations: changing it in Vercel requires a redeploy.

---

## Implementation

### 1. Middleware (`landing/src/middleware.ts`)

No middleware exists yet — create from scratch.

In next-intl 4.x, only one `middleware` function can be exported. The maintenance logic must be embedded as a wrapper around the next-intl middleware. The pattern:

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./navigation"; // routing object exported from navigation.ts
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exempt API routes, static files, _next internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Maintenance mode redirect
  if (process.env.MAINTENANCE_MODE === "true") {
    // Detect locale from first path segment (fallback to 'fr')
    const segments = pathname.split("/").filter(Boolean);
    const locales = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];
    const locale = locales.includes(segments[0]) ? segments[0] : "fr";
    const target = `/${locale}/coming-soon`;

    if (pathname !== target && !pathname.endsWith("/coming-soon")) {
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 2. Route group for isolated layout

Place the page in a dedicated route group so it does not inherit `[locale]/layout.tsx` (which loads i18n messages, ThemeProvider, Analytics, CookieConsent, etc.):

```
landing/src/app/[locale]/(maintenance)/coming-soon/page.tsx
landing/src/app/[locale]/(maintenance)/layout.tsx   ← minimal layout (html/body only)
```

The `(maintenance)/layout.tsx` provides only the bare minimum: font variables on `<html>`, `bg-background` on `<body>`, no providers.

### 3. Page (`landing/src/app/[locale]/(maintenance)/coming-soon/page.tsx`)

Server component. Static, no client interactivity.

**Visual design:**

- Background: `#FDFBF7` crème chaud (`bg-background`)
- Grain texture overlay (`bg-noise`)
- Radial gradient halo crème centré (inline style)
- Ornements floraux SVG aux coins (top-left, bottom-right) — couleur `primary` à 7% d'opacité
- Typographie heading: Cormorant Garamond (`font-heading`)
- Typographie body: Inter (`font-body`)

**Content:**

- Logo: `<Image src="/images/logo.png">` — `h-10 w-auto opacity-80`
- Eyebrow: `"Faire-part digital haut de gamme"` — `text-[0.6rem] uppercase tracking-[0.28em] text-primary`
- Séparateur: deux traits `h-px w-14 bg-primary/30` + losange `rotate-45 w-1.5 h-1.5 bg-primary/50`
- Titre H1: `"Quelque chose de beau arrive."` — `font-heading text-[clamp(3rem,8vw,5.5rem)] font-medium leading-[0.95]`, le mot "beau" en `<em>` avec `italic text-primary font-semibold`
- Sous-titre: `"L'art du faire-part repensé pour l'ère digitale — bientôt disponible."` — `font-heading italic text-muted-foreground`
- Contact: `"Une question ? contact@thestudiopapeteriedigitale.com"` — `text-xs text-muted-foreground`, lien `mailto:` avec `text-primary`
- Footer: `"© The Studio Papeterie Digital"` — `absolute bottom-8 text-[0.65rem] uppercase tracking-widest text-muted-foreground/50`

**Layout:** `min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden`

### 4. No i18n translation keys

Copy is minimal and French-only. No `messages/*.json` entries required.

---

## Out of Scope

- Email capture / newsletter signup
- Countdown timer
- Multi-language copy
- Framer Motion animations

---

## Environment Variables

| Variable           | `main`          | `prod` (Vercel) |
| ------------------ | --------------- | --------------- |
| `MAINTENANCE_MODE` | unset / `false` | `true`          |

> Changing this variable in Vercel requires a **redeploy** to take effect (Edge middleware values are baked at build time).
