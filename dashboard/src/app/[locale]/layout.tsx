import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Toaster } from "@shared/components/ui/sonner";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Libre_Caslon_Display, Urbanist } from "next/font/google";
import { Suspense } from "react";
import "../globals.css";

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

export const metadata: Metadata = {
  title: "The Studio | Digital Papeterie",
  description: "L'élégance de la papeterie, la puissance du digital.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    /* `suppressHydrationWarning` on <html>, not only on <body>: browser
       extensions (LanguageTool adds `data-lt-installed`, translators and dark
       -mode add their own) mutate the <html> element before React hydrates, and
       React reports the mismatch as an error the couple sees in the console.
       There is nothing to patch up — the markup we render is correct.
       `landing/src/app/layout.tsx` already does this; the dashboard had it on
       <body> alone.

       `dir` was missing entirely here, so Arabic rendered left-to-right in the
       admin while the public site got it right. */
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className={`${libreCaslonDisplay.variable} ${urbanist.variable} font-body bg-studio-creme text-studio-violet antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Suspense><DashboardLayout>{children}</DashboardLayout></Suspense>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
