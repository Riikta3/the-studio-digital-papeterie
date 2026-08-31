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
    <html lang={locale}>
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
