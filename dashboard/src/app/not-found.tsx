"use client";

import Error from "next/error";

// Render the default Next.js 404 page when a route
// is requested that doesn't match the middleware and
// therefore doesn't have a locale associated with it.

export default function NotFound() {
  return (
    /* Same extension-hydration guard as the locale layout. `lang` is French
       because this file sits outside `[locale]` and has no locale to read —
       the product's default. */
    <html lang='fr' suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Error statusCode={404} />
      </body>
    </html>
  );
}
