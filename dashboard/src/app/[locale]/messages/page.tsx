import { MessageCard } from "@/components/dashboard/MessageCard";
import { Link, redirect } from "@/navigation";
import { createClient } from "@/utils/supabase/server";
import { addableModules } from "@shared/lib/addable-modules";
import { BookHeart, MessageSquare } from "lucide-react";
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

  const [responses, guestbook, site] = wedding
    ? await Promise.all([
        supabase
          .from("rsvp_responses")
          .select("id, respondent_first_name, respondent_last_name, name, message, attendance, submitted_at")
          .eq("wedding_id", wedding.id)
          .not("message", "is", null)
          .neq("message", "")
          .order("submitted_at", { ascending: false })
          .then(({ data }) => data ?? []),
        supabase
          .from("guestbook_messages")
          .select("id, guest_name, message, submitted_at")
          .eq("wedding_id", wedding.id)
          .order("submitted_at", { ascending: false })
          .then(({ data }) => data ?? []),
        supabase
          .from("sites")
          .select("theme_id, modules, pending_modules")
          .eq("wedding_id", wedding.id)
          .maybeSingle()
          .then(({ data }) => data),
      ])
    : [[], [], null];

  const owned: string[] = site?.modules ?? [];
  const pending: string[] = site?.pending_modules ?? [];
  const hasGuestbook = owned.includes("guestbook");
  // Saved in the editor but not paid yet: it opens to guests once paid.
  const guestbookPending = !hasGuestbook && pending.includes("guestbook");
  const canAddGuestbook =
    !hasGuestbook && !guestbookPending && addableModules(site?.theme_id, owned, pending).includes("guestbook");

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(new Date(iso));

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto space-y-12 bg-studio-creme">
      {/* Header */}
      <header className="flex flex-col gap-1 pb-4 border-b border-studio-lavande/30">
        <h1 className="font-heading text-h1 text-studio-violet">
          {t("title")}
        </h1>
        <p className="text-studio-violet/70">
          {t("description")}
        </p>
      </header>

      {/* Guestbook — private: only the couple reads these. */}
      <section aria-labelledby="guestbook-heading" className="space-y-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="guestbook-heading" className="font-heading text-h3 text-studio-violet">
              {t("guestbook_title")}
            </h2>
            {guestbook.length > 0 && (
              <span className="text-xs text-studio-violet/60 shrink-0">
                {t("message_count", { count: guestbook.length })}
              </span>
            )}
          </div>
          <p className="text-sm text-studio-violet/70">{t("guestbook_description")}</p>
        </div>

        {guestbook.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {guestbook.map((m) => (
              <MessageCard
                key={m.id}
                id={m.id}
                name={m.guest_name}
                message={m.message}
                date={formatDate(m.submitted_at)}
                source="guestbook"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 rounded-2xl border border-dashed border-studio-lavande/60 px-6 py-12">
            <div className="w-14 h-14 rounded-full bg-studio-lavande/20 flex items-center justify-center">
              <BookHeart className="w-6 h-6 text-studio-violet/40" aria-hidden="true" />
            </div>
            <p className="text-sm text-studio-violet/70 max-w-md">
              {hasGuestbook
                ? t("guestbook_empty")
                : guestbookPending
                  ? t("guestbook_pending")
                  : t("guestbook_not_owned")}
            </p>
            {!hasGuestbook && (
              <Link
                href={canAddGuestbook ? "/invitation?add=guestbook" : guestbookPending ? "/invitation?section=guestbook" : "/modules"}
                className="inline-flex min-h-11 items-center rounded-full bg-studio-violet px-5 text-sm font-medium text-white transition-colors hover:bg-studio-violet/90"
              >
                {guestbookPending ? t("guestbook_open_editor") : t("guestbook_add")}
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Messages left with an RSVP answer. */}
      <section aria-labelledby="rsvp-messages-heading" className="space-y-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="rsvp-messages-heading" className="font-heading text-h3 text-studio-violet">
              {t("rsvp_title")}
            </h2>
            {responses.length > 0 && (
              <span className="text-xs text-studio-violet/60 shrink-0">
                {t("message_count", { count: responses.length })}
              </span>
            )}
          </div>
          <p className="text-sm text-studio-violet/70">{t("rsvp_description")}</p>
        </div>

        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-studio-lavande/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-studio-violet/40" aria-hidden="true" />
            </div>
            <p className="text-studio-violet/70 text-sm">
              {t("no_messages")}
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {responses.map((r) => {
              const name =
                r.respondent_first_name && r.respondent_last_name
                  ? `${r.respondent_first_name} ${r.respondent_last_name}`
                  : r.name;

              return (
                <MessageCard
                  key={r.id}
                  id={r.id}
                  name={name}
                  message={r.message}
                  date={formatDate(r.submitted_at)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
