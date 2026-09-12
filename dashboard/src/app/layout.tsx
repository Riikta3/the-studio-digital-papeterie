/**
 * The root layout, which this app did not have.
 *
 * Next requires every page to sit under one, and `update-password` lives
 * outside `[locale]` on purpose — Supabase's recovery link lands there before
 * any locale is known — so it inherited nothing. The production build refused
 * outright: "update-password/page.tsx doesn't have a root layout". It has
 * failed that way since the page was added in February; only the dev server,
 * which is more forgiving, kept working.
 *
 * It is a pass-through and must stay one. `[locale]/layout.tsx` renders its
 * own `<html>` and `<body>` (with the fonts, the toaster, the next-intl
 * provider and `suppressHydrationWarning`), so emitting them here too would
 * nest one document inside another for every localized route — which is most
 * of the app. The pages that do not live under `[locale]` supply their own
 * document instead; see `update-password/layout.tsx`.
 *
 * Next does warn that a root layout "should" contain html and body tags. That
 * warning is the price of the `[locale]` layout owning the document, and the
 * alternative — duplicating it — is a real bug rather than a lint note.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
