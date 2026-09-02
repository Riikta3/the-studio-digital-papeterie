import { StatCard } from "@/components/dashboard/StatCard";
import { EventAttendanceList, type EventAttendanceRow } from "@/components/stats/EventAttendanceList";
import { RsvpBreakdown } from "@/components/stats/RsvpBreakdown";
import { VisitTrendChart } from "@/components/stats/VisitTrendChart";
import { INVITATION_MOCK } from "@shared/data/invitation-mock";
import { BarChart3, Eye, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("Stats");
  const { guests, guestEvents, events, stats } = INVITATION_MOCK;

  const confirmed = guests.filter((g) => g.status === "confirmed").length;
  const declined = guests.filter((g) => g.status === "declined").length;
  const pending = guests.filter((g) => g.status === "pending").length;
  const totalGuests = guests.length;

  // The response rate reads the guest data, not the visit stats: a pending
  // guest has not answered, so only confirmed + declined count as a response.
  const responseRate = totalGuests > 0
    ? Math.round(((confirmed + declined) / totalGuests) * 100)
    : 0;

  const eventRows: EventAttendanceRow[] = events
    .filter((event) => event.enabled)
    .sort((a, b) => a.position - b.position)
    .map((event) => {
      const rows = guestEvents.filter((row) => row.eventId === event.id);
      return {
        id: event.id,
        name: event.name,
        confirmed: rows.filter((row) => row.status === "confirmed").length,
        total: rows.length,
      };
    });

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
              value={stats.visits}
              icon={Eye}
              variant='default'
            />
            <StatCard
              label={t("invitation.unique_visitors")}
              value={stats.uniqueVisitors}
              icon={Users}
              variant='default'
            />
            <StatCard
              label={t("invitation.response_rate")}
              value={`${responseRate}%`}
              icon={BarChart3}
              description={t("invitation.response_rate_desc", {
                responded: confirmed + declined,
                total: totalGuests,
              })}
              variant='primary'
            />
          </div>

          <div className='mt-4 rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card'>
            <h3 className='text-sm font-medium text-studio-violet'>{t("trend.title")}</h3>
            <div className='mt-3'>
              <VisitTrendChart visitsByDay={stats.visitsByDay} />
            </div>
          </div>
        </section>

        {/* RSVP and Événements blocks */}
        <div className='mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <RsvpBreakdown confirmed={confirmed} declined={declined} pending={pending} />
          <EventAttendanceList rows={eventRows} />
        </div>
      </div>
    </div>
  );
}
