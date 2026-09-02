import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { HomeQuickActions } from "@/components/home/HomeQuickActions";
import { InvitationPreviewCard } from "@/components/home/InvitationPreviewCard";
import { KpiGroupCard, type KpiTile } from "@/components/home/KpiGroupCard";
import { Link, redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@shared/components/ui/button";
import { INVITATION_MOCK } from "@shared/data/invitation-mock";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
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

  // The greeting and countdown need the couple's own profile, which already
  // works against Supabase — kept as-is. Every figure below reads
  // INVITATION_MOCK / JOUR_J_MOCK instead, like every other screen: step 2
  // of the spec swaps the mock for real guests/households/tables queries and
  // nothing else on this page changes.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // wedding_date is on public.weddings, not on profiles — reading it off
  // `profile` returned undefined and the countdown silently fell back.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("wedding_date")
    .eq("user_id", user.id)
    .maybeSingle();

  const { guests, events } = INVITATION_MOCK;
  const { tables, media, settings } = JOUR_J_MOCK;

  const totalGuests = guests.length;
  const confirmedGuests = guests.filter((g) => g.status === "confirmed").length;
  const pendingGuests = guests.filter((g) => g.status === "pending").length;
  const childrenGuests = guests.filter((g) => g.isChild).length;

  const seatedIds = new Set(tables.flatMap((table) => table.guestIds));
  const seatedCount = seatedIds.size;
  const confirmedGuestIds = new Set(
    guests.filter((g) => g.status === "confirmed").map((g) => g.id),
  );
  const toSeatCount = [...confirmedGuestIds].filter((id) => !seatedIds.has(id)).length;

  const weddingDate = wedding?.wedding_date
    ? new Date(`${wedding.wedding_date}T00:00:00`)
    : // The mock's own ceremony date, so the hero countdown always has
      // something real to show rather than hiding the block.
      new Date(events.find((e) => e.key === "wedding-day")?.date ?? "2027-06-19");

  const guestsTiles: KpiTile[] = [
    { key: "total", label: t("kpi.guests.total"), value: totalGuests },
    { key: "confirmed", label: t("kpi.guests.confirmed"), value: confirmedGuests },
    { key: "pending", label: t("kpi.guests.pending"), value: pendingGuests },
    { key: "children", label: t("kpi.guests.children"), value: childrenGuests },
  ];

  const jourJTiles: KpiTile[] = [
    { key: "seated", label: t("kpi.jour_j.seated"), value: seatedCount },
    { key: "to_seat", label: t("kpi.jour_j.to_seat"), value: toSeatCount },
    { key: "tables", label: t("kpi.jour_j.tables"), value: tables.length },
    { key: "media", label: t("kpi.jour_j.media"), value: media.length },
  ];

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-5xl space-y-6'>
        <header className='flex flex-col items-start justify-between gap-4 border-b border-studio-lavande/30 pb-6 md:flex-row md:items-center'>
          <h1 className='font-heading text-h3 text-studio-violet'>
            {t("greeting", {
              name: `${profile?.first_name || "Mariés"} & ${profile?.partner_name || "Partenaire"}`,
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

        <HomeQuickActions noAnswerCount={pendingGuests} toSeatCount={toSeatCount} />

        <InvitationPreviewCard slug={settings.qrSlug} enabled={settings.enabled} />
      </div>
    </div>
  );
}
