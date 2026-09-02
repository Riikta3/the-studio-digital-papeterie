import { getStatsSummary } from "@/actions/dashboard-summary-actions";
import { StatCard } from "@/components/dashboard/StatCard";
import { EventAttendanceList, type EventAttendanceRow } from "@/components/stats/EventAttendanceList";
import { RsvpBreakdown } from "@/components/stats/RsvpBreakdown";
import { VisitTrendChart } from "@/components/stats/VisitTrendChart";
import { BarChart3, Eye, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

// Visit analytics have no backing table in this schema — there is no
// pageview/session tracking anywhere in the app — so these two figures stay
// hardcoded rather than gaining a real (and out-of-scope) analytics schema.
// This is the one mock this wiring pass deliberately leaves in place; it
// holds no personal data.
const FAKE_VISITS = 1842;
const FAKE_UNIQUE_VISITORS = 214;
const FAKE_VISITS_BY_DAY: Array<{ date: string; visits: number }> = Array.from(
  { length: 30 },
  (_, i) => {
    const d = new Date(Date.UTC(2027, 4, 19 + i));
    const base = 12 + Math.round(i * 1.8);
    const spike = i === 6 ? 140 : i === 7 ? 60 : 0;
    return { date: d.toISOString().slice(0, 10), visits: base + spike };
  },
);

export default async function Page() {
  const t = await getTranslations("Stats");
  const summary = await getStatsSummary();

  const eventRows: EventAttendanceRow[] = summary.events;

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-5xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("subtitle")}</p>

        {/* Invitation block: visits, unique visitors, response rate */}
        <section className='mt-6'>
          <h2 className='font-heading text-h4 text-studio-violet'>{t("invitation.title")}</h2>
          <div className='mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <StatCard
              label={t("invitation.visits")}
              value={FAKE_VISITS}
              icon={Eye}
              variant='default'
            />
            <StatCard
              label={t("invitation.unique_visitors")}
              value={FAKE_UNIQUE_VISITORS}
              icon={Users}
              variant='default'
            />
            <StatCard
              label={t("invitation.response_rate")}
              value={`${summary.responseRate}%`}
              icon={BarChart3}
              description={t("invitation.response_rate_desc", {
                responded: summary.confirmed + summary.declined,
                total: summary.total,
              })}
              variant='primary'
            />
          </div>

          <div className='mt-4 rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card'>
            <h3 className='text-sm font-medium text-studio-violet'>{t("trend.title")}</h3>
            <div className='mt-3'>
              <VisitTrendChart visitsByDay={FAKE_VISITS_BY_DAY} />
            </div>
          </div>
        </section>

        {/* RSVP and Événements blocks */}
        <div className='mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <RsvpBreakdown
            confirmed={summary.confirmed}
            declined={summary.declined}
            pending={summary.pending}
          />
          <EventAttendanceList rows={eventRows} />
        </div>
      </div>
    </div>
  );
}
