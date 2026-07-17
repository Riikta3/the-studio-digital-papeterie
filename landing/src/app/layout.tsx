import {
  Libre_Caslon_Display,
  Urbanist,
} from "next/font/google";

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
  const locale = resolvedParams?.locale || "fr";

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
