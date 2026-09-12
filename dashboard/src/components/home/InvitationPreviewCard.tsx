import { Link } from "@/navigation";
import { Eye, ExternalLink, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PublishToggle } from "./PublishToggle";

type Props = {
  /** The public slug from `sites.slug`, e.g. "camille-et-leo-demo". */
  slug: string;
  /**
   * Whether the invitation is live for guests — `sites.status === 'published'`.
   *
   * This used to be fed `day_of_settings.enabled`, the Jour J module's switch,
   * so the card labelled a perfectly published invitation "hors ligne" until
   * the couple turned on a module about the printed QR code. The two were
   * separated in migration 20260912110000.
   */
  enabled: boolean;
  /**
   * The couple's primary language (`sites.languages[0]`), which is the locale
   * their invitation should open in.
   *
   * The two links below were hardcoded to `/fr/`, so a couple who bought
   * English and Spanish was shown a French URL as "their" public address and
   * sent to a French page — a locale they never paid for and which the
   * language guard would bounce them out of.
   */
  locale?: string;
};

/**
 * Two ways in, because they answer different questions: "what do my guests
 * see?" and "let me change it".
 *
 * View opens the guest-facing invitation, which lives in the other app — an
 * absolute URL rather than a next-intl Link, since it is a different origin.
 */
export async function InvitationPreviewCard({ slug, enabled, locale }: Props) {
  const t = await getTranslations("Dashboard.invitation_preview");
  // The invitation, not the Jour J page: this card is about the stationery the
  // couple sends out, and /jourj/ is the day-of page guests reach by scanning
  // the printed QR code. They are different things and this used to link to
  // the wrong one.
  //
  // The base comes from the environment because the landing app is a separate
  // origin; the dev port matches `landing/package.json` (3010).
  const landingBase =
    process.env.NEXT_PUBLIC_LANDING_URL || "https://www.thestudiopapeteriedigitale.com";
  const lang = locale || "fr";
  const publicUrl = `${landingBase.replace(/^https?:\/\//, "")}/${lang}/invitation/${slug}`;
  const viewHref = `${landingBase}/${lang}/invitation/${slug}`;

  return (
    <section className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card md:p-6'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className='font-heading text-h4 text-studio-violet'>{t("title")}</h2>
          <p className='mt-1 truncate text-sm text-studio-violet/70'>{publicUrl}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            enabled
              ? "bg-teal-100 text-teal-700"
              : "bg-studio-beurre text-studio-violet"
          }`}
        >
          {enabled ? t("live") : t("not_live")}
        </span>
      </div>

      {/* Side by side from sm:, stacked on the narrowest phones so neither
          button gets squeezed below a comfortable width. */}
      <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
        {/* Unpublished, the public URL 404s — and the 404 is the guest-facing
            "this address is not on the guest list", which is a strange thing
            to show a couple about their own invitation. The card already knows
            it is offline; the link now says so instead of leading there. */}
        {enabled ? (
          <a
            href={viewHref}
            target='_blank'
            rel='noopener noreferrer'
            className='flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-studio-violet px-4 text-sm font-medium text-studio-violet transition-colors hover:bg-studio-violet/5'
          >
            <Eye className='h-4 w-4' />
            {t("view_cta")}
          </a>
        ) : (
          <span
            aria-disabled='true'
            title={t("view_cta_offline")}
            className='flex min-h-11 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-studio-lavande/50 px-4 text-sm font-medium text-studio-violet/40'
          >
            <Eye className='h-4 w-4' />
            {t("view_cta")}
          </span>
        )}
        <Link
          href='/modules'
          className='flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-studio-violet px-4 text-sm font-medium text-white transition-colors hover:bg-studio-violet-fonce'
        >
          <Pencil className='h-4 w-4' />
          {t("edit_cta")}
        </Link>
      </div>
      <p className='mt-2 flex items-center gap-1.5 text-xs text-studio-violet/50'>
        <ExternalLink className='h-3 w-3 shrink-0' />
        {t("public_hint")}
      </p>

      {/* The switch that makes the link above answer or 404. Kept on this card
          rather than in a card of its own: the URL, its state and the control
          over it are one thought. */}
      <div className='mt-4 border-t border-studio-lavande/30 pt-2'>
        <PublishToggle initialPublished={enabled} />
      </div>
    </section>
  );
}
