/**
 * The editor's field styles, shared by every form so the sixteen tabs read as
 * one screen. Same measurements as the dashboard's other forms (`min-h-11`
 * inputs, lavender borders), with a visible focus ring.
 */

export const labelClass =
  "text-xs font-bold uppercase tracking-[0.15em] text-studio-violet/60";

export const inputClass =
  "min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white px-3 text-sm text-studio-violet " +
  "placeholder:text-studio-violet/35 transition-colors " +
  "focus:border-studio-violet-clair focus:outline-none focus:ring-2 focus:ring-studio-violet-clair/25";

export const textareaClass =
  "w-full rounded-lg border border-studio-lavande/50 bg-white p-3 text-sm leading-relaxed text-studio-violet " +
  "placeholder:text-studio-violet/35 transition-colors " +
  "focus:border-studio-violet-clair focus:outline-none focus:ring-2 focus:ring-studio-violet-clair/25";

export const hintClass = "text-[11px] leading-snug text-studio-violet/55";
