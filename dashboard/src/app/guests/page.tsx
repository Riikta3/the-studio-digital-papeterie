import { AddHouseholdDialog } from "@/components/dashboard/AddHouseholdDialog";
import { GuestCard } from "@/components/dashboard/GuestCard";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function GuestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch households with their guests to count them
  const { data: households, error } = await supabase
    .from("households")
    .select("*, guests(id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Error fetching households detailed:",
      JSON.stringify(error, null, 2),
    );
    // You might want to show an error UI here
  }

  // Transform data to include guest count
  // The query returns guests as an array of objects with just IDs if we select guests(id)
  // We need to verify exactly what Supabase returns for the join.
  // Assuming standard Supabase join behavior.
  const displayHouseholds = (households || []).map((h: any) => ({
    id: h.id,
    name: h.name,
    email: h.email,
    phone: h.phone,
    status: h.status,
    guests: h.guests || [],
    guestCount: h.guests ? h.guests.length : 0,
  }));

  return (
    <div className='min-h-screen p-8 md:p-12 max-w-7xl mx-auto space-y-8'>
      {/* Header */}
      <header className='flex justify-between items-center pb-8 border-b border-border'>
        <div className='space-y-1'>
          <Link
            href='/'
            className='text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors mb-2'
          >
            <ArrowLeft className='w-4 h-4' /> Retour à l&apos;accueil
          </Link>
          <h1 className='text-4xl font-heading font-light text-foreground'>
            Vos Invités
          </h1>
          <p className='text-muted-foreground'>
            Gérez votre liste et suivez les réponses.
          </p>
        </div>
        <div className='flex gap-3'>
          <AddHouseholdDialog />
        </div>
      </header>

      {/* Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {displayHouseholds.length === 0 ? (
          <div className='col-span-full text-center py-20 text-muted-foreground bg-card rounded-xl border border-dashed border-border'>
            <p>Aucun invité pour le moment.</p>
            <p className='text-sm mt-2'>
              Commencez par ajouter un foyer ou partagez votre code mariage.
            </p>
          </div>
        ) : (
          displayHouseholds.map((household) => (
            <GuestCard
              key={household.id}
              id={household.id}
              name={household.name}
              email={household.email}
              phone={household.phone}
              guestCount={household.guestCount}
              guests={household.guests}
              status={household.status}
            />
          ))
        )}
      </div>
    </div>
  );
}
