import { getTranslations } from "next-intl/server";

export type EventAttendanceRow = {
  id: string;
  name: string;
  confirmed: number;
  total: number;
};

type Props = {
  rows: EventAttendanceRow[];
};

/**
 * Confirmed attendance per event, as a thin single-hue bar row — magnitude,
 * not identity, so one hue at varying share is correct per the dataviz
 * skill (no rainbow across events).
 */
export async function EventAttendanceList({ rows }: Props) {
  const t = await getTranslations("Stats");

  return (
    <section className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card'>
      <h2 className='font-heading text-h4 text-studio-violet'>{t("events.title")}</h2>

      {rows.length === 0 ? (
        <p className='mt-3 text-sm text-studio-violet/60'>{t("events.empty")}</p>
      ) : (
        <ul className='mt-4 space-y-4'>
          {rows.map((row) => {
            const pct = row.total > 0 ? Math.round((row.confirmed / row.total) * 100) : 0;
            return (
              <li key={row.id}>
                <div className='flex items-baseline justify-between gap-3'>
                  <span className='truncate text-sm font-medium text-studio-violet'>
                    {row.name}
                  </span>
                  <span className='shrink-0 text-xs text-studio-violet/60'>
                    {t("events.count", { confirmed: row.confirmed, total: row.total })}
                  </span>
                </div>
                <div className='mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-studio-creme'>
                  <div
                    className='h-full rounded-full bg-studio-violet'
                    style={{ width: `${pct}%` }}
                    role='img'
                    aria-label={`${row.name}: ${pct}%`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
