import {
  Libre_Caslon_Display,
  Urbanist,
} from "next/font/google";
import { headers } from "next/headers";

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

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = await params;
  // On the root `not-found.tsx` there is no locale param, so fall back to the
  // path forwarded by the proxy to keep `lang`/`dir` correct (RTL for `ar`).
  const headerLocale = (await headers())
    .get("x-pathname")
    ?.split("/")
    .filter(Boolean)[0];
  const locale =
    resolvedParams?.locale ||
    ((routing.locales as readonly string[]).includes(headerLocale ?? "")
      ? headerLocale
      : routing.defaultLocale);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${urbanist.variable} ${libreCaslonDisplay.variable}`}
    >
      <body
        className='w-full overflow-x-hidden bg-studio-jaune text-foreground'
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
