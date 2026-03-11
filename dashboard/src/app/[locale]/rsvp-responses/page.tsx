import { RsvpResponsesTable } from "@/components/dashboard/RsvpResponsesTable";
import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function RsvpResponsesPage() {
  const t = await getTranslations("RsvpResponses");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale: "fr" });
  }

  // Get the user's wedding_id
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const responses = wedding
    ? await supabase
        .from("rsvp_responses")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("submitted_at", { ascending: false })
        .then(({ data }) => data ?? [])
    : [];

  // Stats
  const total = responses.length;
  const attending = responses.filter((r: any) => r.attendance).length;
  const declined = responses.filter((r: any) => !r.attendance).length;
  const totalGuests = responses
    .filter((r: any) => r.attendance)
    .reduce((acc: number, r: any) => acc + (r.guest_count ?? 0), 0);

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto space-y-8 bg-[#FDFBF7]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-heading font-light text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white/50 border border-gray-100 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-muted-foreground mb-1">{t("stats.total")}</p>
          <p className="text-2xl font-bold font-heading">{total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("stats.responses_received")}</p>
        </div>
        <div className="bg-green-50/50 border border-green-100 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-green-700 mb-1">{t("stats.attending")}</p>
          <p className="text-2xl font-bold font-heading text-green-700">{attending}</p>
          <p className="text-xs text-green-600/80 mt-0.5">{t("stats.will_be_present")}</p>
        </div>
        <div className="bg-red-50/50 border border-red-100 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-red-700 mb-1">{t("stats.declined")}</p>
          <p className="text-2xl font-bold font-heading text-red-700">{declined}</p>
          <p className="text-xs text-red-600/80 mt-0.5">{t("stats.wont_come")}</p>
        </div>
        <div className="bg-primary/5 border border-primary/10 shadow-sm rounded-xl p-5">
          <p className="text-sm font-medium text-primary mb-1">{t("stats.total_guests")}</p>
          <p className="text-2xl font-bold font-heading text-primary">{totalGuests + attending}</p>
          <p className="text-xs text-primary/70 mt-0.5">{t("stats.persons_expected")}</p>
        </div>
      </div>

      {/* Table */}
      <RsvpResponsesTable responses={responses} />
    </div>
  );
}
