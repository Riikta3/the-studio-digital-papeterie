import { MessageCard } from "@/components/dashboard/MessageCard";
import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { MessageSquare } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

export default async function MessagesPage() {
  const supabase = await createClient();
  const t = await getTranslations("MessagesPage");
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const responses = wedding
    ? await supabase
        .from("rsvp_responses")
        .select("id, respondent_first_name, respondent_last_name, name, message, attendance, submitted_at")
        .eq("wedding_id", wedding.id)
        .not("message", "is", null)
        .neq("message", "")
        .order("submitted_at", { ascending: false })
        .then(({ data }) => data ?? [])
    : [];

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto space-y-10 bg-studio-creme">
      {/* Header */}
      <header className="flex flex-col gap-1 pb-4 border-b border-studio-lavande/30">
        <h1 className="font-heading text-h1 text-studio-violet">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </header>

      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-studio-lavande/20 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">
            {t("no_messages")}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground -mt-4">
            {t("message_count", { count: responses.length })}
          </p>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {responses.map((r) => {
              const name =
                r.respondent_first_name && r.respondent_last_name
                  ? `${r.respondent_first_name} ${r.respondent_last_name}`
                  : r.name;

              const date = new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "long",
              }).format(new Date(r.submitted_at));

              return (
                <MessageCard
                  key={r.id}
                  id={r.id}
                  name={name}
                  message={r.message}
                  date={date}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
