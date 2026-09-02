import { getDashboardSummary } from "@/actions/dashboard-summary-actions";
import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { HomeQuickActions } from "@/components/home/HomeQuickActions";
import { InvitationPreviewCard } from "@/components/home/InvitationPreviewCard";
import { KpiGroupCard, type KpiTile } from "@/components/home/KpiGroupCard";
import { Link, redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@shared/components/ui/button";
import { PartyPopper, Settings, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function DashboardHome() {
  const t = await getTranslations("Dashboard");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale: "fr" });
    return null;
  }

  const summary = await getDashboardSummary();

  // `weddingDate` is `weddings.wedding_date`, never `profiles.wedding_date`
  // (that column does not exist) — reading it off the profile silently gave
  // the countdown nothing to count. Falls back to a near date rather than
  // hiding the countdown block entirely when a couple hasn't set one yet.
  const weddingDate = summary.weddingDate
    ? new Date(`${summary.weddingDate}T00:00:00`)
    : new Date();

  const guestsTiles: KpiTile[] = [
    { key: "total", label: t("kpi.guests.total"), value: summary.guests.total },
    { key: "confirmed", label: t("kpi.guests.confirmed"), value: summary.guests.confirmed },
    { key: "pending", label: t("kpi.guests.pending"), value: summary.guests.pending },
    { key: "children", label: t("kpi.guests.children"), value: summary.guests.children },
  ];

  const jourJTiles: KpiTile[] = [
    { key: "seated", label: t("kpi.jour_j.seated"), value: summary.seating.seated },
    { key: "to_seat", label: t("kpi.jour_j.to_seat"), value: summary.seating.toSeat },
    { key: "media", label: t("kpi.jour_j.media"), value: summary.media.total },
  ];

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <header className='flex flex-col items-start justify-between gap-4 border-b border-studio-lavande/30 pb-6 md:flex-row md:items-center'>
          <h1 className='font-heading text-h3 text-studio-violet'>
            {t("greeting", {
              name: summary.coupleNames
                ? `${summary.coupleNames.first} & ${summary.coupleNames.second}`
                : "Mariés & Partenaire",
            })}
          </h1>
          <Link href='/settings' className='w-full md:w-auto'>
            <Button
              variant='outline'
              className='min-h-11 w-full border-studio-lavande/50 bg-white text-studio-violet/70 transition-colors hover:bg-studio-lavande/10 hover:text-studio-violet md:w-auto'
            >
              <Settings className='mr-2 h-4 w-4' />
              {t("settings")}
            </Button>
          </Link>
        </header>

        {/* Countdown: the hero of the page, not an afterthought under the title. */}
        <section className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card md:p-8'>
          <p className='text-xs font-medium uppercase tracking-wider text-studio-violet/50'>
            {t("countdown")}
          </p>
          <div className='mt-3'>
            <CountdownTimer date={weddingDate} />
          </div>
        </section>

        {/* Guests and day-of only: per-event attendance and meal breakdowns
            belong on their own pages, not on an overview. */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <KpiGroupCard title={t("kpi.guests.title")} icon={Users} tiles={guestsTiles} />
          <KpiGroupCard title={t("kpi.jour_j.title")} icon={PartyPopper} tiles={jourJTiles} />
        </div>

        <HomeQuickActions
          noAnswerCount={summary.guests.pending}
          toSeatCount={summary.seating.toSeat}
        />

        <InvitationPreviewCard slug={summary.dayOf.qrSlug ?? ""} enabled={summary.dayOf.enabled} />
      </div>
    </div>
  );
}
