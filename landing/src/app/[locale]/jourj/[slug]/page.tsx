import { getGuestPageData } from "@/actions/guest-page-actions";
import { Link } from "@/navigation";
import { notFound } from "next/navigation";

/**
 * The couple's names used to be hardcoded ("Émilie & Jordy") because they
 * live on `profiles`, which anon cannot read and must not be opened up — it
 * also holds `stripe_customer_id`. They now come from
 * `get_couple_display_names`, a security-definer RPC returning only the two
 * display strings for a wedding whose day-of module is enabled. Same shape of
 * answer as `search_guest_table` gives for the guest list, and for the same
 * reason.
 *
 * A profile with no name set falls back to a warm but nameless greeting
 * rather than rendering "null & null".
 */
/**
 * `events.date` is a plain `date` column, so it arrives as "2027-06-18". A
 * guest reading their phone at the venue wants "vendredi 18 juin", not an ISO
 * string. Parsed as UTC on purpose: a bare date has no timezone, and letting
 * the runtime apply a local offset can shift it a day.
 */
function frenchDate(iso: string): string {
  const parsed = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parsed);
}

function coupleHeading(first: string | null, partner: string | null): string {
  const names = [first, partner].filter(
    (n): n is string => typeof n === "string" && n.trim().length > 0,
  );
  if (names.length === 0) return "Notre mariage";
  return names.join(" & ");
}

export default async function JourJHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // The layout already 404s an unknown or disabled slug; this repeats the
  // guard because a page must never assume its layout ran the check.
  const data = await getGuestPageData(slug);
  if (!data) notFound();

  const { afterWeddingMode } = data.settings;
  const heading = coupleHeading(data.coupleNames.first, data.coupleNames.partner);

  return (
    <div className='text-center'>
      <p className='text-xs uppercase tracking-[0.2em] text-studio-violet/50'>
        {afterWeddingMode ? "Merci" : "Bienvenue"}
      </p>
      <h1 className='mt-3 font-heading text-3xl text-studio-violet'>
        {heading}
      </h1>
      <p className='mt-4 text-sm text-studio-violet/70'>
        {afterWeddingMode
          ? "Merci d'avoir partagé cette journée avec nous. Vos photos sont toujours les bienvenues."
          : "Retrouvez votre table, le menu du jour et partagez vos photos."}
      </p>

      <div className='mt-8 space-y-2'>
        <Link
          href={`/jourj/${slug}/ma-table`}
          className='flex min-h-14 items-center justify-center rounded-xl bg-studio-violet text-sm font-medium text-white'
        >
          Trouver ma table
        </Link>
        <Link
          href={`/jourj/${slug}/photos`}
          className='flex min-h-14 items-center justify-center rounded-xl border border-studio-violet text-sm font-medium text-studio-violet'
        >
          Partager mes photos
        </Link>
      </div>

      {data.events.length > 0 && (
        <ul className='mt-10 space-y-3 text-left'>
          {data.events.map((event) => (
            <li
              key={event.key}
              className='rounded-xl border border-studio-lavande/40 bg-white p-4'
            >
              <p className='font-heading text-base text-studio-violet'>
                {event.name}
              </p>
              {(event.date || event.time) && (
                <p className='mt-1 text-xs text-studio-violet/60'>
                  {[event.date ? frenchDate(event.date) : null, event.time]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {event.address && (
                <p className='mt-1 text-xs text-studio-violet/60'>
                  {event.address}
                </p>
              )}
              {event.dressCode && (
                <p className='mt-2 text-xs uppercase tracking-[0.15em] text-studio-violet/40'>
                  {event.dressCode}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
