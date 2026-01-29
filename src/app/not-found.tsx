import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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

export default function NotFound() {
  return (
    <html
      lang='fr'
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body className='min-h-screen bg-background text-foreground bg-noise font-body antialiased'>
        <main className='container flex min-h-screen flex-col items-center justify-center gap-6 py-16 text-center mx-auto'>
          <p className='text-xs uppercase tracking-supertitle text-muted-foreground'>
            404
          </p>
          <h1 className='text-4xl font-heading md:text-5xl'>
            Page introuvable
          </h1>
          <p className='max-w-md text-sm text-muted-foreground md:text-base'>
            Cette page n'existe pas ou a été déplacée.
          </p>
          <Link
            href='/'
            className='rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:shadow-xl hover:-translate-y-0.5'
          >
            Retour à l'accueil
          </Link>
        </main>
      </body>
    </html>
  );
}
