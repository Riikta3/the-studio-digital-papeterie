import { createClient } from "@/utils/supabase/server";
import { Button } from "@shared/components/ui/button";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardHome() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Profile (Names & Date)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch Stats (Guests & Households)
  // We fetch minimal data to calculate counts on server
  const { data: guests } = await supabase.from("guests").select("status");

  const { data: households } = await supabase
    .from("households")
    .select("id, name, status, created_at, source")
    .order("created_at", { ascending: false });

  // Calculations
  const totalGuests = guests?.length || 0;
  const confirmedGuests =
    guests?.filter((g) => g.status === "confirmed").length || 0;

  // Pending Validation: Households that are "pending"
  const pendingHouseholds =
    households?.filter((h) => h.status === "pending") || [];
  const pendingCount = pendingHouseholds.length;

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

  // Recent Activity (Last 3 households)
  const recentActivity = households?.slice(0, 3) || [];

  return (
    <div className='min-h-screen p-8 md:p-12 max-w-7xl mx-auto space-y-12 bg-background'>
      {/* Header / Salutation */}
      <header className='flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-8 gap-4'>
        <div className='space-y-2'>
          <h1 className='text-4xl md:text-5xl font-heading font-light text-foreground'>
            Bonjour, {profile?.first_name || "Mariés"} &{" "}
            {profile?.partner_name || "Partenaire"}
          </h1>
        </div>
        <div className='hidden md:block'>
          <Link href='/settings'>
            <Button
              variant='outline'
              className='border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            >
              <Settings className='w-4 h-4 mr-2' />
              Réglages
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI Cards Section */}
      <section className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Card 1: Invités (Priority KPI) */}
        <div className='bg-card p-8 rounded-xl shadow-sm border border-border flex flex-col justify-between h-64 hover:shadow-md transition-shadow duration-300 relative overflow-hidden'>
          <div className='flex justify-between items-start z-10 relative'>
            <span className='text-muted-foreground uppercase tracking-wider text-xs font-medium'>
              Réponses
            </span>
            <div className='p-2 bg-primary/10 rounded-full text-primary'>
              <Users size={18} />
            </div>
          </div>
          <div className='z-10 relative'>
            <div className='text-6xl font-heading text-foreground'>
              {confirmedGuests}
            </div>
            <div className='text-muted-foreground mt-2 font-light'>
              invités confirmés sur {totalGuests > 0 ? totalGuests : "..."}
            </div>
          </div>
          <div className='pt-4 border-t border-border z-10 relative'>
            <Link
              href='/guests'
              className='text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-2 group'
            >
              Voir la liste{" "}
              <ArrowRight
                size={14}
                className='group-hover:translate-x-1 transition-transform'
              />
            </Link>
          </div>
        </div>

        {/* Card 2: Countdown or Date Action */}
        <div className='bg-primary text-primary-foreground p-8 rounded-xl shadow-sm flex flex-col justify-between h-64 relative overflow-hidden group'>
          {/* Decorative */}
          <div className='absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700'></div>

          <div className='flex justify-between items-start relative z-10'>
            <span className='text-primary-foreground/60 uppercase tracking-wider text-xs font-medium'>
              Compte à rebours
            </span>
            <Calendar
              size={18}
              className='text-primary-foreground/60'
            />
          </div>
          <div className='relative z-10'>
            {daysRemaining !== null ? (
              <>
                <div className='text-6xl font-heading'>
                  J-{daysRemaining > 0 ? daysRemaining : "0"}
                </div>
                <div className='text-primary-foreground/70 mt-2 font-light'>
                  {daysRemaining > 0
                    ? "On y est presque !"
                    : "C'est le grand jour !"}
                </div>
              </>
            ) : (
              <>
                <div className='text-4xl font-heading'>Date ?</div>
                <div className='text-primary-foreground/70 mt-2 font-light'>
                  Ajoutez la date du mariage
                </div>
              </>
            )}
          </div>
          <div className='pt-4 border-t border-white/10 relative z-10'>
            {daysRemaining !== null ? (
              <div className='text-sm text-primary-foreground/90'>
                {weddingDate?.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            ) : (
              <Link
                href='/settings'
                className='text-sm underline hover:text-white'
              >
                Configurer maintenant
              </Link>
            )}
          </div>
        </div>

        {/* Card 3: Action Required (Validation Queue) */}
        <div
          className={`p-8 rounded-xl shadow-sm border flex flex-col h-64 ${pendingCount > 0 ? "bg-orange-50 border-orange-100" : "bg-card border-border"}`}
        >
          <div className='flex justify-between items-start mb-6'>
            <span
              className={`${pendingCount > 0 ? "text-orange-600" : "text-muted-foreground"} uppercase tracking-wider text-xs font-medium`}
            >
              À Valider
            </span>
            {pendingCount > 0 ? (
              <div className='p-2 bg-orange-100 rounded-full text-orange-600 animate-pulse'>
                <Bell size={18} />
              </div>
            ) : (
              <div className='p-2 bg-secondary/20 rounded-full text-muted-foreground'>
                <CheckCircle2 size={18} />
              </div>
            )}
          </div>

          <div className='flex-1 flex flex-col justify-center'>
            {pendingCount > 0 ? (
              <>
                <div className='text-5xl font-heading text-orange-900 mb-2'>
                  {pendingCount}
                </div>
                <p className='text-orange-700'>
                  foyers en attente de validation.
                </p>
              </>
            ) : (
              <p className='text-muted-foreground text-center italic'>
                Tout est à jour !<br />
                Aucune action requise.
              </p>
            )}
          </div>

          {pendingCount > 0 && (
            <div className='pt-4 border-t border-orange-200 mt-auto'>
              <Link
                href='/guests'
                className='text-sm font-medium text-orange-700 hover:text-orange-900 flex items-center gap-2'
              >
                Gérer les demandes <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Activity Feed & Modules */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-12'>
        {/* Feed */}
        <div className='lg:col-span-2 space-y-6'>
          <h2 className='text-2xl font-heading font-light text-foreground'>
            Activité Récente
          </h2>
          <div className='space-y-4'>
            {recentActivity.length > 0 ? (
              recentActivity.map((h) => (
                <div
                  key={h.id}
                  className='flex items-center gap-4 p-4 bg-white border border-stone-100 rounded-lg shadow-sm'
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-heading text-lg ${h.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {h.name.charAt(0)}
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>{h.name}</p>
                    <p className='text-xs text-gray-500'>
                      {h.source === "public"
                        ? "Inscription en ligne"
                        : "Ajouté par admin"}{" "}
                      •{" "}
                      {new Date(h.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className='ml-auto'>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${h.status === "confirmed" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
                    >
                      {h.status === "confirmed" ? "Confirmé" : "En attente"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-muted-foreground italic'>
                Aucune activité récente.
              </p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className='space-y-6'>
          <h2 className='text-2xl font-heading font-light text-foreground'>
            Accès Rapide
          </h2>
          <div className='space-y-4'>
            <Link
              href='/guests'
              className='block p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group'
            >
              <div className='flex items-center gap-3 mb-2'>
                <Users className='text-primary group-hover:scale-110 transition-transform' />
                <span className='font-heading text-lg'>Liste Invités</span>
              </div>
              <p className='text-sm text-gray-500'>
                Gérer, ajouter ou supprimer.
              </p>
            </Link>

            <Link
              href='/settings'
              className='block p-4 bg-white border border-border rounded-xl hover:border-secondary hover:shadow-md transition-all group'
            >
              <div className='flex items-center gap-3 mb-2'>
                <Settings className='text-secondary group-hover:scale-110 transition-transform' />
                <span className='font-heading text-lg'>Réglages</span>
              </div>
              <p className='text-sm text-gray-500'>
                Date, code et préférences.
              </p>
            </Link>

            <div className='p-6 bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/20 text-center'>
              <p className='font-heading text-xl mb-2'>Le Site</p>
              <Button
                variant='default'
                className='w-full'
              >
                <ExternalLink className='mr-2 h-4 w-4' /> Voir mon site
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
