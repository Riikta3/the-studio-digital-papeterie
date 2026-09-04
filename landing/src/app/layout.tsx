import {
  Libre_Caslon_Display,
  Urbanist,
} from "next/font/google";

import { routing } from "@/navigation";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

const libreCaslonDisplay = Libre_Caslon_Display({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-heading",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      // Defaults for the root `not-found.tsx`, which has no locale segment.
      // Every route under `[locale]/` overwrites both from its own layout —
      // Next does not forward the child segment's params up to here, and
      // reading headers() would cost the whole app its static rendering.
      lang={routing.defaultLocale}
      dir='ltr'
      suppressHydrationWarning
      className={`${urbanist.variable} ${libreCaslonDisplay.variable}`}
    >
      {/* Marks JS as available before first paint, so the scroll-reveal rules
          in globals.css can hide their targets. Without this flag the reveal
          would have to start hidden in the SSR markup, and a slow or failed
          hydration would leave the page blank. Inline and synchronous on
          purpose: it must win the race against first paint. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('js-ready')`,
        }}
      />
      <body
        className='w-full overflow-x-hidden bg-studio-jaune text-foreground'
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
