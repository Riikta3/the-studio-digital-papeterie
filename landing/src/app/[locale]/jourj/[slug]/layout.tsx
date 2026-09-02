import { resolveGuestPage } from "@/actions/guest-page-actions";
import { GuestNav } from "@/components/jourj/GuestNav";
import { notFound } from "next/navigation";

/**
 * The page a guest lands on after scanning the QR code. Phone-only in
 * practice — laid out for a thumb, capped at a readable width beyond that.
 *
 * `resolveGuestPage` resolves `sites.slug → wedding_id` through the ANON
 * client, then requires `day_of_settings.enabled`. An unknown slug and a
 * wedding that has not switched the module on both yield null, and both 404
 * here — deliberately indistinguishable from outside, so this page cannot be
 * used to probe which couples exist. Rendering an empty page instead would
 * confirm the slug.
 *
 * The theme is still the studio palette: wearing the couple's own art
 * direction means resolving `sites.theme_id` through `resolveTheme()`, which
 * belongs with the invitation theme work rather than here.
 */
export default async function JourJLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await resolveGuestPage(slug);
  if (!page) notFound();

  return (
    <div className='flex min-h-[100svh] flex-col bg-studio-creme'>
      <main className='mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-8'>
        {children}
      </main>
      <GuestNav slug={slug} />
    </div>
  );
}
