import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NotFoundView } from "@/components/dashboard/NotFoundView";
import { routing } from "@/navigation";
import { Toaster } from "@shared/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { Libre_Caslon_Display, Urbanist } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";

import "./globals.css";

const libreCaslonDisplay = Libre_Caslon_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400"],
  display: "swap",
});

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Next falls back to this file for any URL matching no route, including
// localized ones, so it renders outside the `[locale]` segment: no locale
// param, and no layout around it. The locale therefore comes from the path
// the proxy forwards.
//
// Next supplies a bare <html>/<body> here rather than the locale layout's, so
// the fonts, background and `lang`/`dir` have to be re-applied. They go on a
// wrapper rather than a second <html> element: nesting one inside Next's own
// shell hydrates as a mismatch that strips the attributes right back off.
export default async function RootNotFound() {
  const headerList = await headers();
  const segment = headerList.get("x-pathname")?.split("/").filter(Boolean)[0];
  const locale = (routing.locales as readonly string[]).includes(segment ?? "")
    ? (segment as string)
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <div
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${libreCaslonDisplay.variable} ${urbanist.variable} font-body min-h-screen bg-studio-creme text-studio-violet antialiased`}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Suspense>
          <DashboardLayout>
            <NotFoundView />
          </DashboardLayout>
        </Suspense>
        <Toaster />
      </NextIntlClientProvider>
    </div>
  );
}
