"use client";

import {
  type SendingData,
  type SendingHousehold,
  markHouseholdSent,
  saveHouseholdPhone,
  saveSendingMessages,
  unmarkHouseholdSent,
} from "@/actions/invitation-sending-actions";
import { Link } from "@/navigation";
import {
  DEFAULT_INVITATION_MESSAGE,
  DEFAULT_REMINDER_MESSAGE,
  type SendChannel,
  awaitsAnswer,
  fillMessage,
  joinFirstNames,
  sendingQueue,
  smsLink,
  smsNumber,
  whatsappLink,
  whatsappNumber,
} from "@shared/lib/invitation-sending";
import { cn } from "@shared/lib/utils";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  MessageCircle,
  MessageSquareText,
  Phone,
  RotateCcw,
  Save,
  SkipForward,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";

type Tab = "invite" | "remind" | "all";

/**
 * Sending the invitation to every household, from the couple's own phone.
 *
 * "Envoi en série" walks through the households still to invite (or to
 * remind): one tap opens WhatsApp or the SMS app with the message written for
 * that household, the couple presses send there, and the next household comes
 * up. The list below shows where everyone stands — sent, reminded, answered.
 */
export function InvitationSendingBoard({ data }: { data: SendingData }) {
  const t = useTranslations("InvitationSending");
  const format = useFormatter();
  const locale = useLocale();

  const [households, setHouseholds] = useState(data.households);
  const [tab, setTab] = useState<Tab>("invite");
  const [channel, setChannel] = useState<SendChannel>("whatsapp");
  const [invitationMessage, setInvitationMessage] = useState(data.invitationMessage ?? DEFAULT_INVITATION_MESSAGE);
  const [reminderMessage, setReminderMessage] = useState(data.reminderMessage ?? DEFAULT_REMINDER_MESSAGE);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [savingMessages, setSavingMessages] = useState(false);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const inviteQueue = useMemo(() => sendingQueue(households, "invite"), [households]);
  const remindQueue = useMemo(() => sendingQueue(households, "remind"), [households]);
  const sentCount = households.filter((h) => h.invitation_sent_at).length;
  const answeredCount = households.filter((h) => (h.status ?? "pending") !== "pending").length;

  const mode: "invite" | "remind" = tab === "remind" ? "remind" : "invite";
  const queue = mode === "invite" ? inviteQueue : remindQueue;
  // Households without a usable number cannot be sent from here; the series
  // skips them and the list below asks for their number.
  const series = queue.filter((h) => !skipped.has(h.id) && numberFor(h, channel));
  const current = series[0] ?? null;

  const listed = tab === "invite" ? inviteQueue : tab === "remind" ? remindQueue : households;

  function numberFor(household: SendingHousehold, via: SendChannel) {
    return via === "whatsapp" ? whatsappNumber(household.phone) : smsNumber(household.phone);
  }

  function messageFor(household: SendingHousehold, kind: "invite" | "remind") {
    return fillMessage(kind === "invite" ? invitationMessage : reminderMessage, {
      prenoms: joinFirstNames(household.firstNames, locale) || household.name,
      foyer: household.name,
      lien: data.invitationUrl ?? "",
      couple: data.coupleNames,
    });
  }

  function linkFor(household: SendingHousehold, via: SendChannel, kind: "invite" | "remind") {
    const number = numberFor(household, via);
    if (!number) return null;
    const text = messageFor(household, kind);
    return via === "whatsapp" ? whatsappLink(number, text) : smsLink(number, text);
  }

  /**
   * Runs on the tap that opens WhatsApp/SMS. The link itself does the opening
   * (a real `<a href>`, so phones hand it to the app); this records the send
   * and moves the series on.
   */
  async function recordSend(household: SendingHousehold, via: SendChannel, kind: "invite" | "remind") {
    const previous = households;
    const now = new Date().toISOString();
    setHouseholds((list) =>
      list.map((h) =>
        h.id !== household.id
          ? h
          : kind === "invite"
            ? { ...h, invitation_sent_at: h.invitation_sent_at ?? now, invitation_channel: via }
            : { ...h, last_relance_at: now, reminder_count: h.reminder_count + 1, invitation_channel: via },
      ),
    );
    if (kind === "remind") setSkipped((set) => new Set(set).add(household.id));

    const result = await markHouseholdSent(household.id, via, kind);
    if (!result.success) {
      setHouseholds(previous);
      toast.error(result.error);
    }
  }

  async function undoSend(household: SendingHousehold) {
    const previous = households;
    setHouseholds((list) =>
      list.map((h) =>
        h.id === household.id
          ? { ...h, invitation_sent_at: null, invitation_channel: null, last_relance_at: null, reminder_count: 0 }
          : h,
      ),
    );
    const result = await unmarkHouseholdSent(household.id);
    if (!result.success) {
      setHouseholds(previous);
      toast.error(result.error);
    } else {
      toast.success(t("undone"));
    }
  }

  async function savePhone(household: SendingHousehold, phone: string) {
    if (!whatsappNumber(phone)) {
      toast.error(t("phone_invalid"));
      return false;
    }
    const result = await saveHouseholdPhone(household.id, phone);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }
    setHouseholds((list) => list.map((h) => (h.id === household.id ? { ...h, phone } : h)));
    toast.success(t("phone_saved"));
    return true;
  }

  async function saveMessages() {
    setSavingMessages(true);
    const result = await saveSendingMessages({ invitation: invitationMessage, reminder: reminderMessage });
    setSavingMessages(false);
    if (result.success) toast.success(t("messages_saved"));
    else toast.error(result.error);
  }

  const dateOf = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "short" });

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-5xl space-y-5'>
        <header>
          <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
          <p className='mt-1 text-sm text-studio-violet/70'>{t("subtitle")}</p>
        </header>

        {/* Where the couple stands, at a glance */}
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          <Stat label={t("stats.households")} value={households.length} />
          <Stat label={t("stats.sent")} value={sentCount} />
          <Stat label={t("stats.answered")} value={answeredCount} />
          <Stat label={t("stats.to_remind")} value={remindQueue.length} highlight={remindQueue.length > 0} />
        </div>

        {!data.invitationUrl ? (
          <p className='flex items-start gap-2 rounded-xl border border-studio-jaune bg-studio-jaune/20 p-4 text-sm text-studio-pourpre'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
            {t("no_link")}
          </p>
        ) : null}

        {/* The wording, with a live preview on the next household */}
        <section className='rounded-2xl border border-studio-lavande/40 bg-white'>
          <button
            type='button'
            onClick={() => setMessagesOpen((open) => !open)}
            className='flex w-full items-center justify-between gap-3 p-4 text-left'
            aria-expanded={messagesOpen}
          >
            <span className='flex items-center gap-2 font-medium text-studio-violet'>
              <MessageSquareText className='h-4 w-4' />
              {t("messages.title")}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-studio-violet/60 transition-transform", messagesOpen && "rotate-180")} />
          </button>
          {messagesOpen ? (
            <div className='space-y-4 border-t border-studio-lavande/30 p-4'>
              <p className='text-xs text-studio-violet/70'>{t("messages.help")}</p>
              <MessageField
                label={t("messages.invitation")}
                value={invitationMessage}
                onChange={setInvitationMessage}
                onReset={() => setInvitationMessage(DEFAULT_INVITATION_MESSAGE)}
                resetLabel={t("messages.reset")}
              />
              <MessageField
                label={t("messages.reminder")}
                value={reminderMessage}
                onChange={setReminderMessage}
                onReset={() => setReminderMessage(DEFAULT_REMINDER_MESSAGE)}
                resetLabel={t("messages.reset")}
              />
              <div className='flex justify-end'>
                <button
                  type='button'
                  onClick={saveMessages}
                  disabled={savingMessages}
                  className='inline-flex min-h-11 items-center gap-2 rounded-lg bg-studio-violet px-4 text-sm font-medium text-white disabled:opacity-60'
                >
                  {savingMessages ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
                  {t("messages.save")}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Tabs */}
        <div className='flex gap-2 overflow-x-auto pb-1'>
          {(
            [
              ["invite", inviteQueue.length],
              ["remind", remindQueue.length],
              ["all", households.length],
            ] as const
          ).map(([key, count]) => (
            <button
              key={key}
              type='button'
              onClick={() => {
                setTab(key);
                setSkipped(new Set());
              }}
              className={cn(
                "min-h-11 shrink-0 rounded-full px-4 text-sm transition-colors",
                tab === key ? "bg-studio-violet text-white" : "bg-white text-studio-violet",
              )}
            >
              {t(`tabs.${key}`)} ({count})
            </button>
          ))}
        </div>

        {/* The series: one household at a time */}
        {tab !== "all" ? (
          <section className='rounded-2xl border border-studio-lavande/40 bg-white p-4 md:p-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <h2 className='font-heading text-h4 text-studio-violet'>
                {mode === "invite" ? t("series.title_invite") : t("series.title_remind")}
              </h2>
              <ChannelToggle channel={channel} onChange={setChannel} t={t} />
            </div>

            {current ? (
              <div className='mt-4 space-y-4'>
                <p className='text-xs uppercase tracking-wide text-studio-violet/50'>
                  {t("series.progress", { left: series.length })}
                </p>
                <div>
                  <p className='text-lg font-medium text-studio-violet'>{current.name}</p>
                  <p className='text-sm text-studio-violet/70'>
                    {joinFirstNames(current.firstNames, locale)} · {current.phone}
                  </p>
                </div>
                <pre className='whitespace-pre-wrap rounded-xl bg-studio-lavande/10 p-3 font-sans text-sm text-studio-violet/90'>
                  {messageFor(current, mode)}
                </pre>
                <div className='flex flex-wrap gap-2'>
                  <a
                    href={linkFor(current, channel, mode) ?? undefined}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={() => recordSend(current, channel, mode)}
                    className={cn(
                      "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white md:flex-none",
                      channel === "whatsapp" ? "bg-[#1f9d55] hover:bg-[#1a8a4a]" : "bg-studio-violet hover:bg-studio-violet/90",
                    )}
                  >
                    {channel === "whatsapp" ? <MessageCircle className='h-4 w-4' /> : <Phone className='h-4 w-4' />}
                    {channel === "whatsapp" ? t("series.send_whatsapp") : t("series.send_sms")}
                  </a>
                  <button
                    type='button'
                    onClick={() => setSkipped((set) => new Set(set).add(current.id))}
                    className='inline-flex min-h-12 items-center gap-2 rounded-xl border border-studio-lavande/50 px-4 text-sm text-studio-violet'
                  >
                    <SkipForward className='h-4 w-4' />
                    {t("series.skip")}
                  </button>
                </div>
                <p className='text-xs text-studio-violet/60'>{t("series.how")}</p>
              </div>
            ) : (
              <p className='mt-4 text-sm text-studio-violet/70'>
                {queue.length === 0
                  ? mode === "invite"
                    ? t("series.done_invite")
                    : t("series.done_remind")
                  : t("series.done_rest")}
              </p>
            )}
          </section>
        ) : null}

        {/* Everyone, with where they stand */}
        <section className='overflow-hidden rounded-2xl border border-studio-lavande/40 bg-white'>
          {listed.length === 0 ? (
            <p className='p-6 text-center text-sm text-studio-violet/60'>
              {households.length === 0 ? (
                <>
                  {t("list.empty")}{" "}
                  <Link href='/guests' className='underline'>
                    {t("list.empty_link")}
                  </Link>
                </>
              ) : (
                t("list.nothing_here")
              )}
            </p>
          ) : (
            <ul className='divide-y divide-studio-lavande/30'>
              {listed.map((household) => (
                <HouseholdRow
                  key={household.id}
                  household={household}
                  locale={locale}
                  kind={awaitsAnswer(household) ? "remind" : "invite"}
                  links={{
                    whatsapp: linkFor(household, "whatsapp", awaitsAnswer(household) ? "remind" : "invite"),
                    sms: linkFor(household, "sms", awaitsAnswer(household) ? "remind" : "invite"),
                  }}
                  onSend={recordSend}
                  onUndo={undoSend}
                  onSavePhone={savePhone}
                  dateOf={dateOf}
                  t={t}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

type T = ReturnType<typeof useTranslations>;

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        highlight ? "border-studio-jaune bg-studio-jaune/20" : "border-studio-lavande/40 bg-white",
      )}
    >
      <p className='text-xs text-studio-violet/60'>{label}</p>
      <p className='font-heading text-2xl text-studio-violet'>{value}</p>
    </div>
  );
}

function ChannelToggle({ channel, onChange, t }: { channel: SendChannel; onChange: (c: SendChannel) => void; t: T }) {
  return (
    <div className='inline-flex rounded-full bg-studio-lavande/15 p-1' role='group' aria-label={t("channel.label")}>
      {(["whatsapp", "sms"] as const).map((option) => (
        <button
          key={option}
          type='button'
          aria-pressed={channel === option}
          onClick={() => onChange(option)}
          className={cn(
            "min-h-9 rounded-full px-4 text-sm",
            channel === option ? "bg-white text-studio-violet shadow-sm" : "text-studio-violet/60",
          )}
        >
          {t(`channel.${option}`)}
        </button>
      ))}
    </div>
  );
}

function MessageField({
  label,
  value,
  onChange,
  onReset,
  resetLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  resetLabel: string;
}) {
  return (
    <label className='block'>
      <span className='mb-1 flex items-center justify-between text-sm font-medium text-studio-violet'>
        {label}
        <button type='button' onClick={onReset} className='text-xs font-normal text-studio-violet/60 underline'>
          {resetLabel}
        </button>
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        maxLength={2000}
        className='w-full rounded-lg border border-studio-lavande/50 bg-white p-3 text-sm text-studio-violet'
      />
    </label>
  );
}

function HouseholdRow({
  household,
  locale,
  kind,
  links,
  onSend,
  onUndo,
  onSavePhone,
  dateOf,
  t,
}: {
  household: SendingHousehold;
  locale: string;
  kind: "invite" | "remind";
  links: { whatsapp: string | null; sms: string | null };
  onSend: (household: SendingHousehold, via: SendChannel, kind: "invite" | "remind") => void;
  onUndo: (household: SendingHousehold) => void;
  onSavePhone: (household: SendingHousehold, phone: string) => Promise<boolean>;
  dateOf: (iso: string) => string;
  t: T;
}) {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const status = household.status ?? "pending";
  const answered = status !== "pending";

  return (
    <li className='flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between'>
      <div className='min-w-0'>
        <p className='font-medium text-studio-violet'>{household.name}</p>
        <p className='truncate text-sm text-studio-violet/60'>
          {joinFirstNames(household.firstNames, locale)}
          {household.phone ? ` · ${household.phone}` : ""}
        </p>
        <div className='mt-1 flex flex-wrap gap-1.5 text-xs'>
          {household.invitation_sent_at ? (
            <Badge tone='violet'>
              <Check className='h-3 w-3' />
              {t("badge.sent", {
                date: dateOf(household.invitation_sent_at),
                channel: household.invitation_channel ? t(`channel.${household.invitation_channel}`) : "",
              })}
            </Badge>
          ) : (
            <Badge tone='muted'>{t("badge.not_sent")}</Badge>
          )}
          {household.reminder_count > 0 && household.last_relance_at ? (
            <Badge tone='muted'>
              {t("badge.reminded", { count: household.reminder_count, date: dateOf(household.last_relance_at) })}
            </Badge>
          ) : null}
          {answered ? <Badge tone='teal'>{t(`status.${status}`)}</Badge> : null}
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {household.phone && (links.whatsapp || links.sms) ? (
          <>
            {links.whatsapp ? (
              <a
                href={links.whatsapp}
                target='_blank'
                rel='noopener noreferrer'
                onClick={() => onSend(household, "whatsapp", kind)}
                className='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#1f9d55]/40 px-3 text-sm text-[#16794a]'
              >
                <MessageCircle className='h-4 w-4' />
                {kind === "remind" ? t("row.remind") : t("channel.whatsapp")}
              </a>
            ) : null}
            {links.sms ? (
              <a
                href={links.sms}
                onClick={() => onSend(household, "sms", kind)}
                className='inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-studio-lavande/60 px-3 text-sm text-studio-violet'
              >
                <Phone className='h-4 w-4' />
                {t("channel.sms")}
              </a>
            ) : null}
          </>
        ) : (
          <form
            className='flex items-center gap-2'
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              if (await onSavePhone(household, phone)) setPhone("");
              setSaving(false);
            }}
          >
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type='tel'
              inputMode='tel'
              placeholder={household.phone ? t("row.phone_fix") : t("row.phone_placeholder")}
              aria-label={t("row.phone_placeholder")}
              className='min-h-10 w-44 rounded-lg border border-studio-lavande/50 px-3 text-sm'
            />
            <button
              type='submit'
              disabled={saving || !phone.trim()}
              className='min-h-10 rounded-lg bg-studio-violet px-3 text-sm text-white disabled:opacity-50'
            >
              {t("row.phone_save")}
            </button>
          </form>
        )}
        {household.invitation_sent_at ? (
          <button
            type='button'
            onClick={() => onUndo(household)}
            title={t("row.undo")}
            aria-label={t("row.undo")}
            className='inline-flex min-h-10 items-center rounded-lg px-2 text-studio-violet/50 hover:text-studio-violet'
          >
            <RotateCcw className='h-4 w-4' />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function Badge({ tone, children }: { tone: "violet" | "teal" | "muted"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        tone === "violet" && "bg-studio-lavande/20 text-studio-violet",
        tone === "teal" && "bg-teal-50 text-teal-700",
        tone === "muted" && "bg-studio-violet/5 text-studio-violet/60",
      )}
    >
      {children}
    </span>
  );
}
