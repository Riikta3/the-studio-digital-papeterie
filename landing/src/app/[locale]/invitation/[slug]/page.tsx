import { getInvitationPage } from "@/actions/invitation-page-actions";
import { notFound } from "next/navigation";
import { InvitationView } from "@/components/invitation/InvitationView";

/**
 * The couple's real invitation, at their own public slug.
 *
 * Until this route existed, the only invitation pages were static showcases
 * (`/invitation/demo`, `/invitation/mediterranean-classy`) reading from
 * `src/lib/*-demo-data.ts` — so everything a couple typed into the dashboard
 * had nowhere to appear. This renders it from Supabase.
 *
 * An unknown slug, an unpublished site and a wedding with no enabled event all
 * 404 identically: this page must not be usable to discover which couples
 * exist.
 */
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getInvitationPage(slug);
  if (!data) notFound();

  return <InvitationView data={data} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getInvitationPage(slug);
  if (!data) return { title: "Faire-part" };

  const couple = [data.partner1, data.partner2].filter(Boolean).join(" & ");
  return {
    title: couple ? `${couple} — Faire-part` : "Faire-part",
    description: data.venue?.name
      ? `Retrouvez toutes les informations : ${data.venue.name}.`
      : undefined,
    // A wedding invitation is for the people holding the link, not for search
    // engines.
    robots: { index: false, follow: false },
  };
}
