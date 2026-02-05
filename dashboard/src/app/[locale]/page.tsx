import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatCard } from "@/components/dashboard/StatCard";
import { Link, redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@shared/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Settings,
  Users,
} from "lucide-react";
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

  // Fetch Profile (Names & Date)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch Guests Stats
  const { data: guests } = await supabase.from("guests").select("status");

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

  // Fetch Households Stats (for pending/to validate)
  const { count: pendingHouseholdsCount } = await supabase
    .from("households")
    .select("*", { count: "exact" })
    .eq("status", "pending");

  // Countdown Logic
  const today = new Date();
  const weddingDate = profile?.wedding_date
    ? new Date(profile.wedding_date)
    : null;

  let daysRemaining = null;
  if (weddingDate) {
    const diffTime = weddingDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className='min-h-screen p-6 md:p-12 max-w-7xl mx-auto space-y-10 bg-[#FDFBF7]/50'>
      <header className='flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200/60 pb-8 gap-4'>
        <div className='space-y-3'>
          <div className='flex flex-col'>
            <h1 className='text-4xl md:text-5xl font-heading font-light text-gray-900'>
              {t("greeting", {
                name: `${profile?.first_name || "Mariés"} & ${profile?.partner_name || "Partenaire"}`,
              })}
            </h1>
            {weddingDate && (
              <p className='text-muted-foreground font-light mt-2 flex items-center gap-2'>
                <Calendar
                  size={14}
                  className='text-primary/70'
                />
                {weddingDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
        <div className='hidden md:block'>
          <Link href='/settings'>
            <Button
              variant='outline'
              className='border-border bg-white text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors'
            >
              <Settings className='w-4 h-4 mr-2' />
              {t("settings")}
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI Cards Section */}
      <section className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
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

        {/* Card 4: Compte à rebours */}
        <div className='bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between h-auto relative overflow-hidden group hover:border-primary/30 transition-all'>
          <div className='absolute -right-4 -top-4 text-primary opacity-[0.04] group-hover:scale-110 transition-transform duration-700 rotate-12 pointer-events-none'>
            <HeartHandshake size={60} />
          </div>

          <div className='flex justify-between items-start mb-4 relative z-10'>
            <span className='text-muted-foreground uppercase tracking-wider text-xs font-medium'>
              {t("countdown")}
            </span>
            <div className='p-2 bg-primary/5 text-primary rounded-full'>
              <HeartHandshake size={18} />
            </div>
          </div>

          <div className='relative z-10'>
            {daysRemaining !== null ? (
              <>
                <div className='text-5xl font-heading font-light text-gray-900'>
                  {daysRemaining > 0 ? daysRemaining : "J-0"}
                  <span className='text-lg ml-2 font-normal text-muted-foreground'>
                    jours
                  </span>
                </div>
                <div className='text-sm text-muted-foreground mt-2 font-light'>
                  {daysRemaining > 0 ? t("almost_there") : t("big_day")}
                </div>
              </>
            ) : (
              <>
                <div className='text-3xl font-heading text-gray-400'>
                  {t("date_missing")}
                </div>
                <Link
                  href='/settings'
                  className='text-sm text-primary underline mt-2 block hover:text-primary/80'
                >
                  {t("add_date")}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12'>
        {/* Left Column: Activity Feed (2/3 width) */}
        <div className='lg:col-span-2'>
          <RecentActivity />
        </div>

        {/* Right Column: Quick Actions & Alerts (1/3 width) */}
        <div className='space-y-8'>
          {/* Pending Validation Alert Card */}
          {(pendingHouseholdsCount ?? 0) > 0 && (
            <div className='bg-orange-50 border border-orange-100 rounded-xl p-6 relative overflow-hidden'>
              <div className='absolute top-0 right-0 bg-orange-100 w-16 h-16 rounded-bl-full -mr-8 -mt-8'></div>
              <div className='relative z-10'>
                <div className='flex items-center gap-3 mb-3 text-orange-800'>
                  <CheckCircle2 size={20} />
                  <h3 className='font-heading text-lg'>
                    Validations en attente
                  </h3>
                </div>
                <p className='text-sm text-orange-700 mb-4 font-light'>
                  Vous avez <strong>{pendingHouseholdsCount} foyers</strong> qui
                  ont répondu et sont en attente de votre validation.
                </p>
                <Link href='/guests'>
                  <Button
                    size='sm'
                    className='bg-orange-600 hover:bg-orange-700 text-white border-none w-full'
                  >
                    Examiner les réponses
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <QuickActions />
        </div>
      </div>
    </div>
  );
}
