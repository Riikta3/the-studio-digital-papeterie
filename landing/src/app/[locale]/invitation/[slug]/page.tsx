import type { Viewport } from "next";
import {
  getInvitationGate,
  getInvitationPage,
} from "@/actions/invitation-page-actions";
import { GuestGate } from "@/components/invitation/GuestGate";
import { InvitationMusic } from "@/components/invitation/InvitationMusic";
import { OpeningIntro } from "@/components/invitation/OpeningIntro";
import { hasGuestPass } from "@/lib/guest-gate";
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
  // The phone's own width, same as the demo route: a fixed `width: 390` let
  // guests on narrower phones drag the invitation sideways.
  return { width: "device-width", initialScale: 1 };
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  /*
   * The door, before anything else.
   *
   * `getInvitationPage` loads the couple's names, their events, their venue,
   * their guest-facing FAQ. Fetching that and then rendering a gate over it
   * would put the whole wedding in the HTML, one "view source" away — so the
   * decision is made from `getInvitationGate`, which reads nothing but the
   * slug, the theme and whether a code is required.
   *
   * A wedding with no code set is untouched: `isGated` is false and the
   * invitation renders exactly as it always has.
   */
  const gate = await getInvitationGate(slug);
  if (!gate) notFound();

  if (
    gate.isGated &&
    !(await hasGuestPass(gate.weddingId, gate.codeFingerprint ?? ""))
  ) {
    const theme = resolveTheme(gate.themeId);

    return (
      <GuestGate
        weddingId={gate.weddingId}
        scopeClass={theme.scopeClass}
        fontVars={theme.fontVars}
        accentColor={theme.accentColor}
      />
    );
  }

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
  const theme = resolveTheme(page.themeId);
  const { Root } = theme;

  return (
    <>
      {/* The theme's opening film, over the page while it renders underneath. */}
      {theme.opening ? <OpeningIntro {...theme.opening} storageKey={`opening:${page.weddingId}`} /> : null}
      {/* First in the DOM, though fixed on screen: a keyboard or screen-reader
          user reaches the mute button before the whole invitation. */}
      {page.music ? (
        <InvitationMusic
          src={page.music.src}
          weddingKey={page.weddingId}
          accentColor={theme.accentColor}
          themeId={theme.id}
        />
      ) : null}
      <Root data={toInvitationData(page)} />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  /*
   * A gated invitation gives away nothing here either.
   *
   * This runs independently of the render above, so without this check a
   * locked wedding still announced "Michelle & Michel — Faire-part" in the
   * browser tab, in the bookmark, and in the link preview of any messaging
   * app the URL was pasted into. The door would have been shut on a page
   * whose own title said who was behind it.
   */
  const gate = await getInvitationGate(slug);
  if (
    gate?.isGated &&
    !(await hasGuestPass(gate.weddingId, gate.codeFingerprint ?? ""))
  ) {
    return { title: "Faire-part", robots: { index: false, follow: false } };
  }

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
