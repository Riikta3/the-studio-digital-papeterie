import { CountdownTimer } from "@/components/dashboard/CountdownTimer";
import { DashboardInsights } from "@/components/dashboard/DashboardInsights";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatCard } from "@/components/dashboard/StatCard";
import { Link, redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@shared/components/ui/button";
import { CheckCircle2, Clock, Settings, Users } from "lucide-react";
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

  // Parallel Data Fetching to eliminate waterfalls
  const [profileResponse, guestsResponse, householdsResponse] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("guests").select("status"),
      supabase
        .from("households")
        .select("*", { count: "exact" })
        .eq("status", "pending"),
    ]);

  const profile = profileResponse.data;
  const guests = guestsResponse.data;
  const pendingHouseholdsCount = householdsResponse.count;

  // Calculate specific stats
  const totalGuests = guests?.length || 0;
  const confirmedGuests =
    guests?.filter((g) => g.status === "confirmed").length || 0;
  const declinedGuests =
    guests?.filter((g) => g.status === "declined").length || 0;
  const pendingGuests =
    guests?.filter((g) => g.status === "pending" || !g.status).length || 0;

  // Response rate
  const responseRate =
    totalGuests > 0
      ? Math.round(((confirmedGuests + declinedGuests) / totalGuests) * 100)
      : 0;

  const weddingDate = profile?.wedding_date
    ? new Date(profile.wedding_date)
    : null;

  return (
    <div className='min-h-screen p-4 md:p-8 lg:p-12 max-w-6xl mx-auto space-y-6 bg-studio-creme'>
      <header className='flex flex-col md:flex-row justify-between items-start md:items-center border-b border-studio-lavande/30 pb-6 gap-4'>
        <div className='space-y-3 w-full md:w-auto'>
          <div className='flex flex-col'>
            <h1 className='font-heading text-h1 text-studio-violet'>
              {t("greeting", {
                name: `${profile?.first_name || "Mariés"} & ${profile?.partner_name || "Partenaire"}`,
              })}
            </h1>
            {weddingDate && (
              <div className='mt-4 flex flex-col items-start justify-start w-full'>
                <div className='pt-2'>
                  <CountdownTimer date={weddingDate} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className='hidden md:block self-start md:self-center'>
          <Link href='/settings'>
            <Button
              variant='outline'
              className='border-studio-lavande/50 bg-white text-studio-violet/70 hover:bg-studio-lavande/10 hover:text-studio-violet transition-colors'
            >
              <Settings className='w-4 h-4 mr-2' />
              {t("settings")}
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI Cards Section */}
      <section className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Card 1: Total & Taux de réponse */}
        <StatCard
          label={t("total_guests")}
          value={totalGuests}
          icon={Users}
          description={`${responseRate}% de taux de réponse`}
          variant='primary'
          action={{
            label: t("see_list"),
            href: "/guests",
          }}
        />

        {/* Card 2: Confirmés */}
        <StatCard
          label={t("confirmed")}
          value={confirmedGuests}
          icon={CheckCircle2}
          description='Invités confirmés'
          variant='success'
        />

        {/* Card 3: En attente / À valider */}
        <StatCard
          label={t("pending")}
          value={pendingGuests}
          icon={Clock}
          description='En attente de réponse'
          variant='warning'
          action={{
            label: t("manage_requests"),
            href: "/guests?filter=pending",
          }}
        />
      </section>

      {/* Main Content Grid - 3 Equal Columns */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Column 1: Activity Feed */}
        <div>
          <RecentActivity />
        </div>

        {/* Column 2: Pending Validation */}
        <div>
          {/* Pending Validation Alert Card */}
          {(pendingHouseholdsCount ?? 0) > 0 ? (
            <div className='bg-white border border-studio-jaune rounded-2xl p-6 relative overflow-hidden h-[420px] flex flex-col'>
              <div className='absolute top-0 right-0 bg-studio-jaune/60 w-16 h-16 rounded-bl-full -mr-8 -mt-8'></div>
              <div className='relative z-10 flex flex-col h-full'>
                <div className='flex items-center gap-3 mb-3 text-studio-violet'>
                  <CheckCircle2 size={20} />
                  <h3 className='font-heading text-lg'>
                    Validations en attente
                  </h3>
                </div>
                <p className='text-sm text-studio-violet/70 mb-4 font-light'>
                  Vous avez <strong>{pendingHouseholdsCount} foyers</strong> qui
                  ont répondu et sont en attente de votre validation.
                </p>
                <div className='mt-auto'>
                  <Link href='/guests'>
                    <Button
                      size='sm'
                      className='bg-studio-violet hover:bg-studio-violet-fonce text-white border-none w-full'
                    >
                      Examiner les réponses
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className='bg-white border border-studio-lavande/40 rounded-2xl p-6 h-[420px] flex items-center justify-center'>
              <p className='text-studio-violet/50 text-center italic'>
                Aucune validation en attente
              </p>
            </div>
          )}
        </div>

        {/* Column 3: Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Insights Section - Full Width */}
      <DashboardInsights />
    </div>
  );
}
