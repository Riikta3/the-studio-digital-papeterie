import {
  Libre_Caslon_Display,
  Urbanist,
} from "next/font/google";

import { headers } from "next/headers";

import { routing } from "@/navigation";

// The locale lives in the URL, but a root layout gets no params — Next does
// not forward a child segment's params upward. `proxy.ts` already sets
// `x-pathname` for the root not-found page; the first segment of it is the
// locale whenever the request went through next-intl's prefixing.
async function resolveLocale() {
  const headerList = await headers();
  const pathname =
    headerList.get("x-pathname") ?? headerList.get("x-invoke-path") ?? "";
  const segment = pathname.split("/").filter(Boolean)[0];

  return (routing.locales as readonly string[]).includes(segment ?? "")
    ? (segment as (typeof routing.locales)[number])
    : routing.defaultLocale;
}

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await resolveLocale();

  return (
    <html
      // Read from the path the proxy forwards, so the SSR markup itself
      // carries the right language. A client script used to patch these after
      // hydration, which crawlers and screen readers never see: every locale
      // was served announcing itself as French, and Arabic was laid out LTR.
      // headers() costs no static rendering here — `proxy.ts` already makes
      // every page in this app render on demand.
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={`${urbanist.variable} ${libreCaslonDisplay.variable}`}
    >
      <head>
        {/* Marks JS as available before first paint, so the scroll-reveal rules
            in globals.css can hide their targets. Without this flag the reveal
            would have to start hidden in the SSR markup, and a slow or failed
            hydration would leave the page blank. Inline and synchronous on
            purpose: it must win the race against first paint, so it lives in
            the root <head> rather than floating as a child of <html>. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js-ready')`,
          }}
        />
      </head>
      <body
        className='w-full overflow-x-hidden bg-studio-jaune text-foreground'
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
