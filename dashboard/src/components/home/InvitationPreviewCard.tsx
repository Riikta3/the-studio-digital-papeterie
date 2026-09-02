import { Link } from "@/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";

type Props = {
  /** e.g. "emilie-jordy" — `JOUR_J_MOCK.settings.qrSlug`. */
  slug: string;
  /** Whether the invitation is live for guests. */
  enabled: boolean;
};

/**
 * The guest-facing invitation lives in the other app (`/jourj/<slug>` on
 * :3010) — the dashboard cannot link there directly in this environment, so
 * the public URL is shown as text to copy, and the only clickable action is
 * editing content in the dashboard's own /modules.
 */
export async function InvitationPreviewCard({ slug, enabled }: Props) {
  const t = await getTranslations("Dashboard.invitation_preview");
  const publicUrl = `thestudio.fr/jourj/${slug}`;

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

      <Link
        href='/modules'
        className='mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-studio-violet px-4 text-sm font-medium text-white transition-colors hover:bg-studio-violet-fonce'
      >
        <Pencil className='h-4 w-4' />
        {t("edit_cta")}
      </Link>
      <p className='mt-2 flex items-center gap-1.5 text-xs text-studio-violet/50'>
        <ExternalLink className='h-3 w-3 shrink-0' />
        {t("public_hint")}
      </p>
    </section>
  );
}
