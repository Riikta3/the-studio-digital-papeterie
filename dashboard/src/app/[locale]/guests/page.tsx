import { AddHouseholdDialog } from "@/components/dashboard/AddHouseholdDialog";
import { GuestStats } from "@/components/dashboard/GuestStats";
import { GuestsTable } from "@/components/dashboard/GuestsTable";
import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";

/**
 * Households loaded on this screen.
 *
 * Above any real wedding — the largest guest lists this product serves are a
 * few hundred people — and explicit so the page never silently inherits
 * PostgREST's default of 1000.
 */
const MAX_HOUSEHOLDS = 2000;

export default async function GuestsPage() {
  const t = await getTranslations("Guests");
  const locale = await getLocale();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  // Fetch households with their guests to count them.
  //
  // The limit is explicit rather than left to PostgREST's default of 1000: a
  // silent default is indistinguishable from "this is the whole list", and the
  // couple would have no way of telling that guests 1001 onwards exist.
  const { data: households, error } = await supabase
    .from("households")
    .select(
      "*, guests(id, first_name, last_name, email, status, is_child, is_plus_one, dietary_requirements)",
    )
    .order("created_at", { ascending: false })
    .limit(MAX_HOUSEHOLDS);

  // Thrown rather than logged. This used to `console.error` and carry on with
  // `households` null, so a failed query rendered a page saying the couple has
  // no guests at all — the most alarming possible way to report a transient
  // database error, and one they cannot tell apart from real data loss.
  if (error) {
    throw new Error(
      `Impossible de charger la liste des invités : ${error.message}`,
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
  //
  // Counted per guest, not per household. These used to filter households on
  // `h.status` and add up their whole guest count, which drops every
  // `partial` household — the status a household gets precisely when some of
  // its guests are coming and others are not — out of all three figures at
  // once. A couple with partial answers saw confirmed + pending + declined
  // come to less than their total, with no hint as to where the rest went.
  //
  // Guests carry their own status ('pending' | 'confirmed' | 'declined',
  // full_db_reset.sql:177), which is the one the couple actually answers.
  const allGuests = displayHouseholds.flatMap(
    (h) => h.guests as { status: string | null }[],
  );

  const totalGuests = allGuests.length;
  const confirmedGuests = allGuests.filter(
    (g) => g.status === "confirmed",
  ).length;
  const declinedGuests = allGuests.filter(
    (g) => g.status === "declined",
  ).length;
  // Anything not yet answered, so the three figures always add up to the total
  // even if a status the schema does not list ever appears.
  const pendingGuests = totalGuests - confirmedGuests - declinedGuests;

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
