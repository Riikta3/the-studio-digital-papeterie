import { Link } from "@/navigation";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default async function JourJHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { afterWeddingMode } = JOUR_J_MOCK.settings;

  return (
    <div className='text-center'>
      <p className='text-xs uppercase tracking-[0.2em] text-studio-violet/50'>
        {afterWeddingMode ? "Merci" : "Bienvenue"}
      </p>
      <h1 className='mt-3 font-heading text-3xl text-studio-violet'>
        Émilie &amp; Jordy
      </h1>
      <p className='mt-4 text-sm text-studio-violet/70'>
        {afterWeddingMode
          ? "Merci d'avoir partagé cette journée avec nous. Vos photos sont toujours les bienvenues."
          : "Retrouvez votre table, le menu du jour et partagez vos photos."}
      </p>

      <div className='mt-8 space-y-2'>
        <Link
          href={`/jourj/${slug}/ma-table`}
          className='flex min-h-14 items-center justify-center rounded-xl bg-studio-violet text-sm font-medium text-white'
        >
          Trouver ma table
        </Link>
        <Link
          href={`/jourj/${slug}/photos`}
          className='flex min-h-14 items-center justify-center rounded-xl border border-studio-violet text-sm font-medium text-studio-violet'
        >
          Partager mes photos
        </Link>
      </div>
    </div>
  );
}
