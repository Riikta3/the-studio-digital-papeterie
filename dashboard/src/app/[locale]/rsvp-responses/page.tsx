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

  // Bounded: `rsvp_responses` accepts anonymous inserts (its policy is
  // `with check (true)`), so the row count is not something the couple
  // controls. Without a limit one flood makes this screen — their only view of
  // who is coming — unusable.
  //
  // The stats below must still describe every response, so they are counted in
  // the database rather than derived from this page of rows.
  const MAX_ROWS = 500;

  const responses = wedding
    ? await supabase
        .from("rsvp_responses")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("submitted_at", { ascending: false })
        .limit(MAX_ROWS)
        .then(({ data }) => data ?? [])
    : [];

  const totalCount = wedding
    ? await supabase
        .from("rsvp_responses")
        .select("id", { count: "exact", head: true })
        .eq("wedding_id", wedding.id)
        .then(({ count }) => count ?? 0)
    : 0;

  /** True when older responses exist beyond the ones listed below. */
  const isTruncated = totalCount > responses.length;

  // Stats — counted in the database, not derived from `responses`, which holds
  // at most MAX_ROWS. Deriving them would quietly under-report the moment a
  // couple passes that many responses.
  const countByAttendance = async (
    attendance: boolean | null,
  ): Promise<number> => {
    if (!wedding) return 0;

    const base = supabase
      .from("rsvp_responses")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", wedding.id);

    const { count } =
      attendance === null
        ? await base.is("attendance", null)
        : await base.eq("attendance", attendance);

    return count ?? 0;
  };

  const [attending, declined, pending] = await Promise.all([
    countByAttendance(true),
    countByAttendance(false),
    countByAttendance(null),
  ]);

  const total = totalCount;
  // Total persons = 1 respondent + actual participants list (or guest_count if list not filled yet)
  //
  // Unlike the counters above this one sums a jsonb array, so it is computed
  // over the rows actually loaded. When the list is truncated the banner below
  // says so rather than presenting a short total as the full one.
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

      {/* Only ever shown past MAX_ROWS responses, which no real wedding
          reaches — it exists so a flood of anonymous submissions is visible as
          a truncated list rather than as a silently short one. */}
      {isTruncated && (
        <div className="rounded-2xl border border-studio-jaune bg-studio-jaune/20 p-4">
          <p className="text-sm text-studio-pourpre">
            {t("truncated_notice", {
              shown: responses.length,
              total: totalCount,
            })}
          </p>
        </div>
      )}

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
