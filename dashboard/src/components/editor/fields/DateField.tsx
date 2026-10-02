"use client";

import { DatePicker } from "@/components/ui/date-picker";

import { hintClass, labelClass } from "./styles";

/** `YYYY-MM-DD` → a local-midnight Date. `new Date(iso)` would be UTC midnight, the day before west of Greenwich. */
function toDate(iso: string): Date | undefined {
  const [year, month, day] = iso.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

/** A Date → `YYYY-MM-DD` from its local parts, never through UTC. */
function toIso(date: Date | undefined): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A labelled calendar picker whose value is an ISO day, as the columns store it.
 *
 * `clearable` adds a way back to "no date" — the calendar alone can only pick
 * one, and an event's date is optional.
 */
export function DateField({
  label,
  value,
  onChange,
  hint,
  clearable,
  clearLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  clearable?: boolean;
  clearLabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <span className={labelClass}>{label}</span>
        {clearable && value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] font-medium text-studio-violet/60 hover:text-studio-violet"
          >
            {clearLabel}
          </button>
        ) : null}
      </div>
      <DatePicker
        value={toDate(value)}
        onChange={(date) => onChange(toIso(date))}
        className="h-11 rounded-lg border-studio-lavande/50 text-studio-violet"
      />
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}
