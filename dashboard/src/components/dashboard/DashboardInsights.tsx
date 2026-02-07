import { createClient } from "@/utils/supabase/server";
import { CheckCircle2, TrendingUp, Users } from "lucide-react";

export async function DashboardInsights() {
  const supabase = await createClient();

  // Fetch recent confirmations (last 3)
  const { data: recentConfirmations } = await supabase
    .from("households")
    .select("name, updated_at")
    .eq("status", "confirmed")
    .order("updated_at", { ascending: false })
    .limit(3);

  // Fetch all guests for response rate calculation
  const { data: guests } = await supabase.from("guests").select("status");

  const totalGuests = guests?.length || 0;
  const confirmedGuests =
    guests?.filter((g) => g.status === "confirmed").length || 0;
  const declinedGuests =
    guests?.filter((g) => g.status === "declined").length || 0;

  const responseRate =
    totalGuests > 0
      ? Math.round(((confirmedGuests + declinedGuests) / totalGuests) * 100)
      : 0;

  const confirmationRate =
    totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className='bg-white rounded-xl border border-border p-6 shadow-sm'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-heading font-light text-foreground'>
          Statistiques & Insights
        </h2>
        <TrendingUp
          size={20}
          className='text-primary'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Response Rate */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 text-muted-foreground text-sm'>
            <Users size={16} />
            <span>Taux de réponse</span>
          </div>
          <div className='flex items-baseline gap-2'>
            <span className='text-4xl font-heading font-light text-gray-900'>
              {responseRate}%
            </span>
          </div>
          <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500'
              style={{ width: `${responseRate}%` }}
            />
          </div>
          <p className='text-xs text-muted-foreground font-light'>
            {confirmedGuests + declinedGuests} sur {totalGuests} invités ont
            répondu
          </p>
        </div>

        {/* Confirmation Rate */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 text-muted-foreground text-sm'>
            <CheckCircle2 size={16} />
            <span>Taux de confirmation</span>
          </div>
          <div className='flex items-baseline gap-2'>
            <span className='text-4xl font-heading font-light text-emerald-600'>
              {confirmationRate}%
            </span>
          </div>
          <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500'
              style={{ width: `${confirmationRate}%` }}
            />
          </div>
          <p className='text-xs text-muted-foreground font-light'>
            {confirmedGuests} confirmations sur {totalGuests} invités
          </p>
        </div>

        {/* Recent Confirmations */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 text-muted-foreground text-sm'>
            <CheckCircle2 size={16} />
            <span>Dernières confirmations</span>
          </div>
          <div className='space-y-2'>
            {recentConfirmations && recentConfirmations.length > 0 ? (
              recentConfirmations.map((household, index) => (
                <div
                  key={index}
                  className='flex items-start justify-between gap-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50'
                >
                  <div className='flex items-center gap-2'>
                    <div className='w-1.5 h-1.5 bg-emerald-500 rounded-full' />
                    <span className='text-sm font-medium text-foreground truncate'>
                      {household.name}
                    </span>
                  </div>
                  <span className='text-xs text-muted-foreground whitespace-nowrap'>
                    {formatDate(household.updated_at)}
                  </span>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground italic'>
                Aucune confirmation récente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
