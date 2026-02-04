import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Toaster } from "@shared/components/ui/sonner";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "../globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
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
        className={`${cormorant.variable} ${dmSans.variable} font-body bg-[#FDFBF7] text-gray-900 antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <DashboardLayout>{children}</DashboardLayout>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
