import type { LucideIcon } from "lucide-react";

export type KpiTile = {
  key: string;
  label: string;
  value: string | number;
};

type Props = {
  title: string;
  icon: LucideIcon;
  tiles: KpiTile[];
};

/**
 * One KPI group (Invités, Événements, Repas, Jour J): a white card with a
 * heading and a 2-up/4-up grid of small figures. Kept intentionally lighter
 * than `StatCard` — four groups of full-size stat cards would run the page
 * long again, which is exactly what this rebuild removes.
 */
export function KpiGroupCard({ title, icon: Icon, tiles }: Props) {
  return (
    <section className='rounded-2xl border border-studio-lavande/40 bg-white p-4 shadow-studio-card md:p-6'>
      <div className='flex items-center gap-2 text-studio-violet'>
        <Icon className='h-4 w-4 shrink-0' />
        <h2 className='font-heading text-h4'>{title}</h2>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-3 md:grid-cols-4'>
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className='rounded-xl bg-studio-creme p-3'
          >
            <div className='font-heading text-2xl font-light text-studio-violet'>
              {tile.value}
            </div>
            <div className='mt-1 text-xs text-studio-violet/60'>{tile.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
