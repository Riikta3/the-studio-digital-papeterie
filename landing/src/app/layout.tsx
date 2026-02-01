import {
  Cinzel,
  Cormorant_Garamond,
  Epilogue,
  Inter,
  Playfair_Display,
} from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-cinzel",
});

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-epilogue",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "fr";

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${cormorant.variable} ${cinzel.variable} ${epilogue.variable}`}
    >
      <body
        className='min-h-screen bg-background text-foreground bg-noise'
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
