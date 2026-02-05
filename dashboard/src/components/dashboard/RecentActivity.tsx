import { Household } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { Check, Clock, UserPlus, X } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function RecentActivity() {
  const t = await getTranslations("Dashboard");
  const supabase = await createClient();

  // Fetch recent households (last 5)
  // We fetch a bit more to filter if needed
  const { data: households } = await supabase
    .from("households")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(5);

  if (!households || households.length === 0) {
    return (
      <div className='space-y-6'>
        <h2 className='text-2xl font-heading font-light text-foreground'>
          {t("recent_activity")}
        </h2>
        <div className='p-8 text-center border border-dashed border-border rounded-xl bg-muted/20'>
          <p className='text-muted-foreground italic'>{t("no_activity")}</p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (status: string, source: string) => {
    if (status === "confirmed") return <Check size={16} />;
    if (status === "declined") return <X size={16} />;
    if (source === "public") return <Clock size={16} />;
    return <UserPlus size={16} />;
  };

  const getActivityColor = (status: string, source: string) => {
    if (status === "confirmed")
      return "bg-emerald-100 text-emerald-600 border-emerald-200";
    if (status === "declined") return "bg-red-100 text-red-600 border-red-200";
    if (source === "public")
      return "bg-amber-100 text-amber-600 border-amber-200"; // Pending public
    return "bg-blue-100 text-blue-600 border-blue-200"; // Created manual
  };

  const getActivityText = (household: Household) => {
    if (household.status === "confirmed") return t("activity_confirmed");
    if (household.status === "declined") return t("activity_declined");
    if (household.source === "public") return t("activity_rsvp_received");
    return t("activity_added");
  };

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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-heading font-light text-foreground'>
          {t("recent_activity")}
        </h2>
      </div>

      <div className='relative border-l border-border ml-3 space-y-8 py-2'>
        {(households as Household[]).map((household) => (
          <div
            key={household.id}
            className='relative pl-8 group'
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ring-border transition-all duration-300 group-hover:scale-125 group-hover:ring-primary/50 ${
                household.status === "confirmed"
                  ? "bg-emerald-500"
                  : household.status === "declined"
                    ? "bg-red-500"
                    : "bg-amber-500"
              }`}
            />

            <div className='flex items-start justify-between gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300'>
              <div className='flex items-start gap-3'>
                <div
                  className={`p-2 rounded-full border shrink-0 mt-0.5 ${getActivityColor(household.status, household.source)}`}
                >
                  {getActivityIcon(household.status, household.source)}
                </div>
                <div>
                  <p className='font-medium text-foreground'>
                    {household.name}
                  </p>
                  <p className='text-sm text-muted-foreground mt-0.5'>
                    {getActivityText(household)}
                  </p>
                  <div className='flex items-center gap-2 mt-2'>
                    <span className='text-xs text-muted-foreground/70 font-light flex items-center gap-1'>
                      <Clock size={10} />
                      {formatDate(household.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
