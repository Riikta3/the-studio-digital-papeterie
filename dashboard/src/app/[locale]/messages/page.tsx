import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { MessageSquare, Quote } from "lucide-react";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale: "fr" });
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
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto space-y-10 bg-[#FDFBF7]">
      {/* Header */}
      <header className="flex flex-col gap-1 pb-4 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-heading font-light text-foreground">
          Messages
        </h1>
        <p className="text-muted-foreground">
          Les mots que vos invités vous ont laissés.
        </p>
      </header>

      {responses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">
            Aucun message pour le moment.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground -mt-4">
            {responses.length} message{responses.length > 1 ? "s" : ""}
          </p>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {responses.map((r) => {
              const name =
                r.respondent_first_name && r.respondent_last_name
                  ? `${r.respondent_first_name} ${r.respondent_last_name}`
                  : r.name;

              const date = new Intl.DateTimeFormat("fr-FR", {
                day: "numeric",
                month: "long",
              }).format(new Date(r.submitted_at));

              return (
                <div
                  key={r.id}
                  className="break-inside-avoid bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4"
                >
                  <Quote className="w-5 h-5 text-primary/30 shrink-0" />
                  <p className="text-foreground font-light leading-relaxed italic text-sm flex-1">
                    {r.message}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary uppercase">
                        {name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {name}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground/60">
                      {date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
