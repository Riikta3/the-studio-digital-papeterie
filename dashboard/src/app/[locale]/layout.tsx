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
  // Same icon set as the landing app: this is the couple's back-office, so a
  // shared identity is the point. The bordeaux monogram that used to sit in
  // public/ predated the current palette.
  //
  // The .ico is NOT listed here: `src/app/favicon.ico` already exists, and
  // Next emits a <link> for it from the file convention — declaring it again
  // shipped two competing icon tags.
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    title: "The Studio",
    capable: true,
    statusBarStyle: "default",
  },
  // The back-office is private: never index it, whatever links to it.
  robots: { index: false, follow: false },
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
