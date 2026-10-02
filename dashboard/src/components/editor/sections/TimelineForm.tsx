"use client";

import { SCHEDULE_ICON_KEYS, type ScheduleIconKey } from "@shared/data/schedule-icons";
import { EVENT_KEYS, type EventKey } from "@shared/types/invitation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { newId, useEditor } from "../EditorProvider";
import { DateField } from "../fields/DateField";
import { FieldGroup } from "../fields/FieldGroup";
import { ImageField } from "../fields/ImageField";
import { ListEditor } from "../fields/ListEditor";
import { SectionIntro } from "../fields/SectionIntro";
import { SelectField } from "../fields/SelectField";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { ToggleField } from "../fields/ToggleField";
import type { EditorEvent, EditorScheduleEntry } from "../types";
import { FormLayout } from "./shared";

/**
 * Replaces one event's moments inside the flat `schedule` list, in place.
 *
 * The list holds every event's moments; positions are counted per event, so
 * the order of the blocks between events means nothing — but keeping it
 * stable means an edit the couple undoes by hand leaves the draft identical to
 * the saved copy, rather than "changed" because a block moved to the end.
 */
function withEventMoments(
  all: EditorScheduleEntry[],
  eventId: string,
  moments: EditorScheduleEntry[],
): EditorScheduleEntry[] {
  const result: EditorScheduleEntry[] = [];
  let placed = false;

  for (const entry of all) {
    if (entry.eventId !== eventId) result.push(entry);
    else if (!placed) {
      result.push(...moments);
      placed = true;
    }
  }
  if (!placed) result.push(...moments);

  return result;
}

/** "12 mai 2027" for a summary line; empty when no date. */
function shortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(year, month - 1, day),
  );
}

/**
 * The programme: the couple's events — the day itself, and a welcome dinner,
 * a brunch or a party around it — and the moments of each.
 *
 * Events are a fixed set of four kinds (the RSVP asks guests about them by
 * kind), so adding one means picking a kind not used yet. The ceremony cannot
 * be deleted: the invitation's date and countdown come from it.
 *
 * The brunch is also the "day after" block some themes draw on its own, and its
 * card carries the three labels that block prints.
 */
export function TimelineForm() {
  const t = useTranslations("Editor");
  const { draft, update, setText } = useEditor();

  const missingKinds = EVENT_KEYS.filter((key) => !draft.events.some((event) => event.key === key));

  const setEvents = (events: EditorEvent[]) => {
    const kept = new Set(events.map((event) => event.id));
    update("events", events);
    // A deleted event takes its moments with it, as the database's cascade will.
    if (draft.schedule.some((entry) => !kept.has(entry.eventId))) {
      update("schedule", (schedule) => schedule.filter((entry) => kept.has(entry.eventId)));
    }
  };

  const addEvent = (key: EventKey) =>
    update("events", (events) => [
      ...events,
      {
        id: newId(),
        key,
        name: t(`eventKinds.${key}`),
        date: "",
        time: "",
        address: "",
        description: "",
        dressCode: "",
        enabled: true,
      },
    ]);

  const iconOptions: Array<{ value: ScheduleIconKey | ""; label: string }> = [
    { value: "", label: t("icons.auto") },
    ...SCHEDULE_ICON_KEYS.map((icon) => ({ value: icon, label: t(`icons.${icon}`) })),
  ];

  return (
    <FormLayout>
      <SectionIntro section="timeline" />

      <FieldGroup title={t("groups.programmeIntro")}>
        <TextField
          label={t("fields.scheduleIntro")}
          value={draft.texts["copy.scheduleIntro"] ?? ""}
          onChange={(value) => setText("copy.scheduleIntro", value)}
          placeholder={t("placeholders.scheduleIntro")}
          multiline
          rows={2}
          maxLength={600}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.events")} description={t("groups.eventsDescription")}>
        <ListEditor<EditorEvent>
          items={draft.events}
          onChange={setEvents}
          emptyLabel={t("empty.events")}
          canRemove={(event) => event.key !== "wedding-day"}
          hasContent={() => true}
          summary={(event) =>
            [
              event.name || t(`eventKinds.${event.key}`),
              shortDate(event.date),
              event.enabled ? "" : t("fields.eventHidden"),
            ]
              .filter(Boolean)
              .join(" · ")
          }
          renderItem={(event, patch) => (
            <EventFields
              event={event}
              patch={patch}
              moments={draft.schedule.filter((entry) => entry.eventId === event.id)}
              setMoments={(moments) =>
                update("schedule", (schedule) => withEventMoments(schedule, event.id, moments))
              }
              iconOptions={iconOptions}
              dayTwo={
                event.key === "brunch"
                  ? {
                      dateLabel: draft.texts["dayTwo.dateLabel"] ?? "",
                      timeLabel: draft.texts["dayTwo.timeLabel"] ?? "",
                      note: draft.texts["dayTwo.note"] ?? "",
                      set: setText,
                    }
                  : undefined
              }
            />
          )}
        />

        {missingKinds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {missingKinds.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => addEvent(key)}
                className="flex min-h-10 items-center gap-1.5 rounded-full border-2 border-dashed border-studio-lavande/60 px-4 text-sm font-medium text-studio-violet/70 transition-colors hover:border-studio-violet/40 hover:bg-studio-card-bg hover:text-studio-violet"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t(`eventKinds.${key}`)}
              </button>
            ))}
          </div>
        ) : null}
      </FieldGroup>

      <SlotFields section="timeline" />
    </FormLayout>
  );
}

function EventFields({
  event,
  patch,
  moments,
  setMoments,
  iconOptions,
  dayTwo,
}: {
  event: EditorEvent;
  patch: (patch: Partial<EditorEvent>) => void;
  moments: EditorScheduleEntry[];
  setMoments: (moments: EditorScheduleEntry[]) => void;
  iconOptions: Array<{ value: ScheduleIconKey | ""; label: string }>;
  dayTwo?: { dateLabel: string; timeLabel: string; note: string; set: (key: string, value: string) => void };
}) {
  const t = useTranslations("Editor");

  return (
    <>
      <ToggleField
        label={t("fields.eventEnabled")}
        checked={event.enabled}
        onChange={(enabled) => patch({ enabled })}
      />
      <TextField
        label={t("fields.eventName")}
        value={event.name}
        onChange={(name) => patch({ name })}
        maxLength={80}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField
          label={t("fields.eventDate")}
          value={event.date}
          onChange={(date) => patch({ date })}
          clearable={event.key !== "wedding-day"}
          clearLabel={t("fields.clearDate")}
        />
        <TextField
          label={t("fields.eventTime")}
          value={event.time}
          onChange={(time) => patch({ time })}
          placeholder="16h00"
          maxLength={20}
        />
      </div>
      <TextField
        label={t("fields.eventAddress")}
        value={event.address}
        onChange={(address) => patch({ address })}
        maxLength={300}
      />
      <TextField
        label={t("fields.eventDescription")}
        value={event.description}
        onChange={(description) => patch({ description })}
        multiline
        rows={2}
        maxLength={2000}
      />
      <TextField
        label={t("fields.eventDressCode")}
        value={event.dressCode}
        onChange={(dressCode) => patch({ dressCode })}
        maxLength={300}
      />

      {dayTwo ? (
        <div className="space-y-4 rounded-xl bg-studio-card-bg p-4">
          <div>
            <p className="text-sm font-semibold text-studio-violet">{t("groups.dayTwo")}</p>
            <p className="mt-0.5 text-xs text-studio-violet/60">{t("groups.dayTwoDescription")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t("fields.dayTwoDateLabel")}
              value={dayTwo.dateLabel}
              onChange={(value) => dayTwo.set("dayTwo.dateLabel", value)}
              maxLength={80}
            />
            <TextField
              label={t("fields.dayTwoTimeLabel")}
              value={dayTwo.timeLabel}
              onChange={(value) => dayTwo.set("dayTwo.timeLabel", value)}
              placeholder={event.time}
              maxLength={80}
            />
          </div>
          <TextField
            label={t("fields.dayTwoNote")}
            value={dayTwo.note}
            onChange={(value) => dayTwo.set("dayTwo.note", value)}
            placeholder={t("placeholders.dayTwoNote")}
            maxLength={200}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-studio-violet/60">
          {t("groups.moments")}
        </p>
        <ListEditor<EditorScheduleEntry>
          items={moments}
          onChange={setMoments}
          emptyLabel={t("empty.moments")}
          addLabel={t("actions.addMoment")}
          max={25}
          createItem={() => ({
            id: newId(),
            eventId: event.id,
            time: "",
            title: "",
            description: "",
            icon: "",
            imageUrl: "",
          })}
          hasContent={(entry) => Boolean(entry.title || entry.time || entry.description || entry.imageUrl)}
          summary={(entry) => [entry.time, entry.title].filter(Boolean).join(" · ")}
          renderItem={(entry, patchEntry) => (
            <>
              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                <TextField
                  label={t("fields.momentTime")}
                  value={entry.time}
                  onChange={(time) => patchEntry({ time })}
                  placeholder="17h00"
                  maxLength={20}
                />
                <TextField
                  label={t("fields.momentTitle")}
                  value={entry.title}
                  onChange={(title) => patchEntry({ title })}
                  placeholder={t("placeholders.momentTitle")}
                  maxLength={120}
                />
              </div>
              <TextField
                label={t("fields.momentDescription")}
                value={entry.description}
                onChange={(description) => patchEntry({ description })}
                multiline
                rows={2}
                maxLength={1000}
              />
              <SelectField<ScheduleIconKey | "">
                label={t("fields.momentIcon")}
                value={entry.icon}
                onChange={(icon) => patchEntry({ icon })}
                options={iconOptions}
              />
              <ImageField
                label={t("fields.momentPhoto")}
                value={entry.imageUrl}
                onChange={(imageUrl) => patchEntry({ imageUrl })}
                folder="schedule"
              />
            </>
          )}
        />
      </div>
    </>
  );
}
