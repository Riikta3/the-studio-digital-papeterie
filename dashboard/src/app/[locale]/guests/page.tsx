import { AddHouseholdDialog } from "@/components/dashboard/AddHouseholdDialog";
import { GuestStats } from "@/components/dashboard/GuestStats";
import { GuestsTable } from "@/components/dashboard/GuestsTable";
import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function GuestsPage() {
  const t = await getTranslations("Guests");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale: "fr" });
  }

  // Fetch households with their guests to count them
  const { data: households, error } = await supabase
    .from("households")
    .select(
      "*, guests(id, first_name, last_name, email, status, is_child, is_plus_one, dietary_requirements)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "Error fetching households detailed:",
      JSON.stringify(error, null, 2),
    );
  }

  // Transform data
  const displayHouseholds = (households || []).map((h: any) => ({
    id: h.id,
    name: h.name,
    email: h.email,
    phone: h.phone,
    status: h.status,
    guests: h.guests || [],
    guestCount: h.guests ? h.guests.length : 0,
  }));

  // Calculate Stats
  const totalGuests = displayHouseholds.reduce(
    (acc: number, h: any) => acc + h.guestCount,
    0,
  );
  const confirmedGuests = displayHouseholds
    .filter((h: any) => h.status === "confirmed")
    .reduce((acc: number, h: any) => acc + h.guestCount, 0);
  const pendingGuests = displayHouseholds
    .filter((h: any) => h.status === "pending")
    .reduce((acc: number, h: any) => acc + h.guestCount, 0);
  const declinedGuests = displayHouseholds
    .filter((h: any) => h.status === "declined")
    .reduce((acc: number, h: any) => acc + h.guestCount, 0);

  return (
    <div className='min-h-screen p-6 md:p-12 max-w-7xl mx-auto space-y-8 bg-studio-creme'>
      {/* Header */}
      <header className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-studio-lavande/30'>
        <div className='space-y-1'>
          <h1 className='font-heading text-h1 text-studio-violet'>
            {t("title")}
          </h1>
          <p className='text-studio-violet/60'>{t("subtitle")}</p>
        </div>
        <div className='flex gap-3'>
          <AddHouseholdDialog />
        </div>
      </header>

      {/* Stats Overview */}
      <GuestStats
        totalGuests={totalGuests}
        confirmedGuests={confirmedGuests}
        pendingGuests={pendingGuests}
        declinedGuests={declinedGuests}
      />

      {/* Main Content: Table Search & List */}
      <GuestsTable households={displayHouseholds} />
    </div>
  );
}
