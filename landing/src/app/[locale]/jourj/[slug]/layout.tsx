import { GuestNav } from "@/components/jourj/GuestNav";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import { notFound } from "next/navigation";

/**
 * The page a guest lands on after scanning the QR code. Phone-only in
 * practice — laid out for a thumb, capped at a readable width beyond that.
 *
 * Step 2 of the spec resolves `slug` through
 * `sites.slug → weddings → sites.theme_id → resolveTheme()` so the page wears
 * the couple's own art direction. Until then it uses the studio palette.
 */
export default async function JourJLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== JOUR_J_MOCK.settings.qrSlug) notFound();
  if (!JOUR_J_MOCK.settings.enabled) notFound();

  return (
    <div className='flex min-h-[100svh] flex-col bg-studio-creme'>
      <main className='mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-8'>
        {children}
      </main>
      <GuestNav slug={slug} />
    </div>
  );
}
