import { Link } from "@/navigation";
import { Eye, ExternalLink, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";

type Props = {
  /** The public slug from `sites.slug`, e.g. "camille-et-leo-demo". */
  slug: string;
  /** Whether the invitation is live for guests. */
  enabled: boolean;
};

/**
 * Two ways in, because they answer different questions: "what do my guests
 * see?" and "let me change it".
 *
 * View opens the guest-facing invitation, which lives in the other app — an
 * absolute URL rather than a next-intl Link, since it is a different origin.
 */
export async function InvitationPreviewCard({ slug, enabled }: Props) {
  const t = await getTranslations("Dashboard.invitation_preview");
  // The invitation, not the Jour J page: this card is about the stationery the
  // couple sends out, and /jourj/ is the day-of page guests reach by scanning
  // the printed QR code. They are different things and this used to link to
  // the wrong one.
  //
  // The base comes from the environment because the landing app is a separate
  // origin; the dev port matches `landing/package.json` (3010).
  const landingBase =
    process.env.NEXT_PUBLIC_LANDING_URL || "https://the-studio.digital";
  const publicUrl = `${landingBase.replace(/^https?:\/\//, "")}/fr/invitation/${slug}`;
  const viewHref = `${landingBase}/fr/invitation/${slug}`;

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
        <a
          href={viewHref}
          target='_blank'
          rel='noopener noreferrer'
          className='flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-studio-violet px-4 text-sm font-medium text-studio-violet transition-colors hover:bg-studio-violet/5'
        >
          <Eye className='h-4 w-4' />
          {t("view_cta")}
        </a>
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
    </section>
  );
}
