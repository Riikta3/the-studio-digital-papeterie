import type { Viewport } from "next";
import { getInvitationPage } from "@/actions/invitation-page-actions";
import { notFound, redirect } from "next/navigation";
import { resolveTheme } from "@/components/invitation/themes/registry";
import { toInvitationData } from "@/lib/to-invitation-data";

/**
 * The couple's real invitation, at their own public slug, in their own theme.
 *
 * Two halves of the product meet here. `getInvitationPage` reads the wedding
 * out of Supabase; `resolveTheme` turns the `sites.theme_id` they chose and
 * paid for at checkout into the art direction that renders it. Until this
 * route resolved the theme, every couple got the same generic page regardless
 * of what they bought — the id was written, read, and then ignored.
 *
 * An unknown slug, an unpublished site and a wedding with no enabled event all
 * 404 identically: this page must not be usable to discover which couples
 * exist.
 *
 * ## Language
 *
 * The locale in the URL decides what the invitation is rendered in, but only
 * among the languages the couple bought (`sites.languages`, their default
 * first). A locale they did not buy redirects to that default rather than
 * 404ing — a guest who opens a link with their own locale prefix should see
 * the invitation, not an error, and half-translating it would be worse than
 * serving the language the couple chose.
 */
export async function generateViewport(): Promise<Viewport> {
  // The themes are drawn mobile-first around a ~390-520px frame, same as the
  // demo route.
  return { width: 390, initialScale: 1 };
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const page = await getInvitationPage(slug);
  if (!page) notFound();

  // An empty list means a wedding bought before languages were recorded;
  // those render in whatever locale is asked for, as they always did.
  const [fallback] = page.languages;
  if (fallback && !page.languages.includes(locale)) {
    redirect(`/${fallback}/invitation/${slug}`);
  }

  // Falls back to the first registered theme rather than throwing: a stale or
  // mistyped id should still produce an invitation, not a 500 on a page a
  // couple has already paid for.
  // A theme's Root applies its own scope class and font variables, exactly as
  // on the demo route — this passes it the data and nothing else.
  const { Root } = resolveTheme(page.themeId);

  return <Root data={toInvitationData(page)} />;
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
