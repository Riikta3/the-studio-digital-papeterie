import { MessageCard } from "@/components/dashboard/MessageCard";
import { redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { MessageSquare } from "lucide-react";

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
