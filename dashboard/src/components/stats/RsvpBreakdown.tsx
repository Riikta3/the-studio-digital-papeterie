import { cn } from "@shared/lib/utils";
import { getTranslations } from "next-intl/server";

type Props = {
  confirmed: number;
  declined: number;
  pending: number;
};

/**
 * Confirmed / declined / no answer as one segmented bar plus a legend.
 * Fixed categorical order and colors so a status is never read as a
 * generated hue — status colors are reserved, per the dataviz skill.
 */
export async function RsvpBreakdown({ confirmed, declined, pending }: Props) {
  const t = await getTranslations("Stats");
  const total = confirmed + declined + pending || 1;

  const segments = [
    {
      key: "confirmed",
      count: confirmed,
      label: t("rsvp.confirmed"),
      bar: "bg-teal-500",
      dot: "bg-teal-500",
      text: "text-teal-700",
    },
    {
      key: "declined",
      count: declined,
      label: t("rsvp.declined"),
      bar: "bg-red-500",
      dot: "bg-red-500",
      text: "text-red-700",
    },
    {
      key: "pending",
      count: pending,
      label: t("rsvp.pending"),
      // Matches the existing "pending" Badge convention used across the
      // guest list (GuestsTable) — kept consistent rather than repurposing
      // studio-jaune, which fails the dataviz palette validator as a data
      // color (too light / low chroma against the card surface).
      bar: "bg-blue-500",
      dot: "bg-blue-500",
      text: "text-blue-700",
    },
  ] as const;

  return (
    <section className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card'>
      <h2 className='font-heading text-h4 text-studio-violet'>{t("rsvp.title")}</h2>

      <div className='mt-4 flex h-3 w-full overflow-hidden rounded-full bg-studio-creme'>
        {segments.map((segment) => {
          const pct = (segment.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={segment.key}
              className={cn(segment.bar, "h-full")}
              style={{ width: `${pct}%` }}
              role='img'
              aria-label={`${segment.label}: ${segment.count}`}
            />
          );
        })}
      </div>

      <ul className='mt-4 space-y-2'>
        {segments.map((segment) => {
          const pct = Math.round((segment.count / total) * 100);
          return (
            <li key={segment.key} className='flex items-center justify-between gap-3'>
              <span className='flex items-center gap-2 text-sm text-studio-violet'>
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", segment.dot)} />
                {segment.label}
              </span>
              <span className={cn("text-sm font-medium", segment.text)}>
                {segment.count} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
