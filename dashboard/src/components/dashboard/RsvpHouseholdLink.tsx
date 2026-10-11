"use client";

import { Home, Link2, Loader2, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { linkRsvpResponseToHousehold, unlinkRsvpResponse } from "@/actions/rsvp-link-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rankHouseholds } from "@shared/lib/household-rsvp";

export type HouseholdOption = {
  id: string;
  name: string;
  guests: { first_name: string | null; last_name: string | null }[];
};

type LinkableResponse = {
  id: string;
  name: string;
  household_id: string | null;
  respondent_first_name: string | null;
  respondent_last_name: string | null;
  participants: { first_name: string; last_name: string }[] | null;
};

/** The pill next to a respondent's name: their household, or "à rattacher". */
export function HouseholdPill({
  householdId,
  households,
}: {
  householdId: string | null;
  households: HouseholdOption[];
}) {
  const t = useTranslations("RsvpResponses.household");
  const household = householdId ? households.find((h) => h.id === householdId) : null;

  return household ? (
    <span className='inline-flex items-center gap-1 rounded-full border border-studio-lavande/50 bg-studio-lavande/10 px-2 py-0.5 text-[11px] font-normal text-studio-violet/80'>
      <Home className='h-3 w-3' />
      {household.name}
    </span>
  ) : (
    <span className='inline-flex items-center rounded-full border border-studio-jaune bg-studio-jaune/20 px-2 py-0.5 text-[11px] font-normal text-studio-pourpre'>
      {t("to_link")}
    </span>
  );
}

/**
 * Inside a response's panel: which household of the list it belongs to, and
 * — for an answer the invitation did not recognise — a picker that puts the
 * likeliest households first.
 */
export function RsvpHouseholdLink({
  response,
  households,
  onChange,
}: {
  response: LinkableResponse;
  households: HouseholdOption[];
  onChange: (householdId: string | null) => void;
}) {
  const t = useTranslations("RsvpResponses.household");
  const [busy, setBusy] = useState(false);

  const ranked = useMemo(
    () =>
      rankHouseholds(households, {
        respondent:
          [response.respondent_first_name, response.respondent_last_name].filter(Boolean).join(" ") ||
          response.name,
        companions: (response.participants ?? []).map((p) =>
          [p.first_name, p.last_name].filter(Boolean).join(" "),
        ),
      }),
    [households, response],
  );
  const [choice, setChoice] = useState<string>(
    ranked[0] && ranked[0].score > 0 ? ranked[0].household.id : "",
  );

  const linked = response.household_id
    ? households.find((h) => h.id === response.household_id)
    : null;

  async function link() {
    if (!choice) return;
    setBusy(true);
    const result = await linkRsvpResponseToHousehold({ responseId: response.id, householdId: choice });
    setBusy(false);

    if (!result.ok) {
      toast.error(t(result.error === "already_linked" ? "already_linked" : "link_error"));
      return;
    }
    onChange(choice);
    toast.success(t("linked_toast", { count: result.updated }));
    if (result.unmatched.length) {
      toast.info(t("unmatched", { names: result.unmatched.join(", ") }));
    }
  }

  async function unlink() {
    setBusy(true);
    const result = await unlinkRsvpResponse(response.id);
    setBusy(false);
    if (!result.ok) {
      toast.error(t("link_error"));
      return;
    }
    onChange(null);
    toast.success(t("unlinked_toast"));
  }

  const label = 'text-[10px] uppercase tracking-widest font-semibold text-studio-violet/60 mb-2';

  if (linked) {
    return (
      <div>
        <p className={label}>{t("title")}</p>
        <div className='flex flex-wrap items-center gap-3'>
          <span className='inline-flex items-center gap-1.5 text-studio-violet'>
            <Home className='h-4 w-4' />
            {linked.name}
          </span>
          <button
            type='button'
            onClick={unlink}
            disabled={busy}
            className='inline-flex items-center gap-1 text-xs text-studio-violet/60 hover:text-red-600 disabled:opacity-60'
          >
            <Unlink className='h-3.5 w-3.5' />
            {t("unlink")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className={label}>{t("title")}</p>
      {households.length === 0 ? (
        <p className='text-xs text-studio-violet/60'>{t("no_households")}</p>
      ) : (
        <>
          <p className='mb-2 text-xs text-studio-violet/70'>{t("to_link_help")}</p>
          <div className='flex flex-wrap items-center gap-2'>
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger className='h-9 w-64 bg-white'>
                <SelectValue placeholder={t("choose")} />
              </SelectTrigger>
              <SelectContent>
                {ranked.map(({ household, score }) => (
                  <SelectItem key={household.id} value={household.id}>
                    {household.name}
                    {score > 0 ? ` · ${t("suggested")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type='button'
              onClick={link}
              disabled={busy || !choice}
              className='inline-flex items-center gap-2 rounded-lg bg-studio-violet px-3 py-2 text-xs font-medium text-white hover:bg-studio-violet/90 disabled:opacity-60'
            >
              {busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Link2 className='h-3.5 w-3.5' />}
              {t("link")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
