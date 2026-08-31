import { RsvpResponsesTable } from "@/components/dashboard/RsvpResponsesTable";
import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";

export default async function RsvpResponsesPage() {
  const t = await getTranslations("RsvpResponses");
  const locale = await getLocale();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
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
  const attending = responses.filter((r: any) => r.attendance === true).length;
  const declined = responses.filter((r: any) => r.attendance === false).length;
  const pending = responses.filter((r: any) => r.attendance === null).length;
  // Total persons = 1 respondent + actual participants list (or guest_count if list not filled yet)
  const totalGuests = responses
    .filter((r: any) => r.attendance === true)
    .reduce((acc: number, r: any) => {
      const count = r.participants && r.participants.length > 0
        ? 1 + r.participants.length
        : 1 + (r.guest_count ?? 0);
      return acc + count;
    }, 0);

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto space-y-8 bg-studio-creme">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-studio-lavande/30">
        <div className="space-y-1">
          <h1 className="font-heading text-h1 text-studio-violet">
            {t("title")}
          </h1>
          <p className="text-studio-violet/60">{t("subtitle")}</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white border border-studio-lavande/40 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-studio-violet/60 mb-1">{t("stats.total")}</p>
          <p className="text-2xl font-bold font-heading text-studio-violet">{total}</p>
          <p className="text-xs text-studio-violet/50 mt-0.5">{t("stats.responses_received")}</p>
        </div>
        <div className="bg-studio-jaune/20 border border-studio-jaune shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-studio-pourpre mb-1">{t("stats.pending")}</p>
          <p className="text-2xl font-bold font-heading text-studio-violet">{pending}</p>
          <p className="text-xs text-studio-pourpre/80 mt-0.5">{t("stats.awaiting_response")}</p>
        </div>
        <div className="bg-teal-50/50 border border-teal-100 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-teal-600 mb-1">{t("stats.attending")}</p>
          <p className="text-2xl font-bold font-heading text-teal-600">{attending}</p>
          <p className="text-xs text-teal-600/80 mt-0.5">{t("stats.will_be_present")}</p>
        </div>
        <div className="bg-red-50/50 border border-red-100 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-red-700 mb-1">{t("stats.declined")}</p>
          <p className="text-2xl font-bold font-heading text-red-700">{declined}</p>
          <p className="text-xs text-red-600/80 mt-0.5">{t("stats.wont_come")}</p>
        </div>
        <div className="bg-primary/5 border border-primary/10 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-primary mb-1">{t("stats.total_guests")}</p>
          <p className="text-2xl font-bold font-heading text-primary">{totalGuests}</p>
          <p className="text-xs text-primary/70 mt-0.5">{t("stats.persons_expected")}</p>
        </div>
      </div>

      {/* Table */}
      <RsvpResponsesTable responses={responses} />
    </div>
  );
}
