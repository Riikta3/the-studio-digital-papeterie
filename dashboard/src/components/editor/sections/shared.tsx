"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { newId, useEditor } from "../EditorProvider";
import type { EditorEvent, EditorState } from "../types";

/** The column every tab's form sits in. Extra bottom room on phones for the "Aperçu" button. */
export function FormLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-2xl space-y-4 p-4 pb-28 md:p-6 lg:pb-12">{children}</div>;
}

/**
 * The ceremony — the `wedding-day` event — which the hero and the countdown
 * both edit: its date is the date on the invitation and the instant the
 * countdown counts to.
 *
 * A wedding seeded at checkout always has one; for one that does not, the
 * first edit creates it rather than dropping the date on the floor.
 */
export function useCeremony() {
  const t = useTranslations("Editor");
  const { draft, update } = useEditor();
  const ceremony = draft.events.find((event) => event.key === "wedding-day");

  const setCeremony = (patch: Partial<EditorEvent>) =>
    update("events", (events) => {
      if (events.some((event) => event.key === "wedding-day")) {
        return events.map((event) => (event.key === "wedding-day" ? { ...event, ...patch } : event));
      }
      const created: EditorEvent = {
        id: newId(),
        key: "wedding-day",
        name: t("defaults.ceremonyName"),
        date: "",
        time: "",
        address: "",
        description: "",
        dressCode: "",
        enabled: true,
        ...patch,
      };
      return [created, ...events];
    });

  return { ceremony, setCeremony };
}

/* ------------------------------------------------------------------ *
 * What the invitation derives when the couple writes nothing — shown as
 * placeholders, and computed exactly as the landing's mapper computes them so
 * the placeholder is what the preview prints.
 * ------------------------------------------------------------------ */

/** "12 · 05 · 2027" */
export function dottedDate(iso: string | undefined): string {
  const [year, month, day] = (iso ?? "").split("-");
  return year && month && day ? `${day} · ${month} · ${year}` : "";
}

/** "mercredi 12 mai 2027", with "1er" on the first of the month. */
export function spelledDate(iso: string | undefined): string {
  const [year, month, day] = (iso ?? "").split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date(year, month - 1, day))
    .replace(/ 1 /, " 1er ");
}

/** "C & J" */
export function initials(names: EditorState["names"]): string {
  return [names.partner1, names.partner2]
    .map((name) => name.trim().charAt(0).toUpperCase())
    .filter(Boolean)
    .join(" & ");
}
