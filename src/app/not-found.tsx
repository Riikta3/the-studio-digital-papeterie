import Link from "next/link";

export default function NotFound() {
  return (
    <main className='container flex min-h-screen flex-col items-center justify-center gap-6 py-16 text-center'>
      <p className='text-xs uppercase tracking-supertitle text-muted-foreground'>
        404
      </p>
      <h1 className='text-4xl font-heading md:text-5xl'>Page introuvable</h1>
      <p className='max-w-md text-sm text-muted-foreground md:text-base'>
        Cette page n'existe pas ou a ete deplacee.
      </p>
      <Link
        href='/'
        className='rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:shadow-xl'
      >
        Retour a l'accueil
      </Link>
    </main>
  );
}
