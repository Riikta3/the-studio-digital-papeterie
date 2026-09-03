import type { InvitationPageData } from "@/actions/invitation-page-actions";

/**
 * Renders a couple's invitation from their own data.
 *
 * Deliberately built on the Mediterranean Classy palette (its `tokens.ts` was
 * transcribed from the Figma board) rather than the studio admin palette: this
 * page is what the guests see, and it should look like stationery, not like a
 * dashboard. Resolving `sites.theme_id` to per-couple art direction is the
 * theme system's job and comes later — this renders every couple in the one
 * theme that exists, from live data, which is the part that was missing.
 *
 * Every section disappears when its data is empty. A couple who has not filled
 * in their accommodations gets no empty "Où dormir" heading.
 */

const CREAM = "#F5F2EB";
const GREEN = "#1F592A";
const BROWN = "#5D4B35";
const BEIGE = "#EADCCD";
const MUTED = "#BABCAB";

export function InvitationView({ data }: { data: InvitationPageData }) {
  const couple = [data.partner1, data.partner2].filter(Boolean);

  return (
    <main style={{ backgroundColor: CREAM }} className='min-h-[100svh] pb-20'>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className='px-6 pt-16 text-center md:pt-24'>
        <p
          className='text-xs uppercase tracking-[0.3em]'
          style={{ color: MUTED }}
        >
          Nous nous marions
        </p>
        {couple.length > 0 && (
          <h1
            className='mt-4 font-heading text-4xl leading-tight md:text-6xl'
            style={{ color: GREEN }}
          >
            {couple.join(" & ")}
          </h1>
        )}
        {data.weddingDateISO && (
          <p className='mt-4 text-sm md:text-base' style={{ color: BROWN }}>
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(
              // Parsed by parts: `new Date("YYYY-MM-DD")` is UTC midnight and
              // renders a day early west of Greenwich.
              (([y, m, d]) => new Date(y, m - 1, d))(
                data.weddingDateISO.split("-").map(Number) as [
                  number,
                  number,
                  number,
                ],
              ),
            )}
          </p>
        )}
      </header>

      {/* ── Events ───────────────────────────────────────────────────── */}
      <Section title='Le programme'>
        <ul className='space-y-4'>
          {data.events.map((event) => (
            <li
              key={event.id}
              className='rounded-2xl bg-white/70 p-5 shadow-sm'
            >
              <h3 className='font-heading text-lg' style={{ color: GREEN }}>
                {event.name}
              </h3>
              <p className='mt-1 text-sm' style={{ color: BROWN }}>
                {[
                  event.date &&
                    new Intl.DateTimeFormat("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).format(
                      (([y, m, d]) => new Date(y, m - 1, d))(
                        event.date.split("-").map(Number) as [
                          number,
                          number,
                          number,
                        ],
                      ),
                    ),
                  event.time,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {event.address && (
                <p className='mt-1 text-sm' style={{ color: BROWN }}>
                  {event.address}
                </p>
              )}
              {event.description && (
                <p className='mt-2 text-sm leading-relaxed' style={{ color: BROWN }}>
                  {event.description}
                </p>
              )}
              {event.dressCode && (
                <p
                  className='mt-3 text-xs uppercase tracking-[0.15em]'
                  style={{ color: MUTED }}
                >
                  {event.dressCode}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Detailed timeline, only where the couple filled one in ───── */}
      {data.programme.length > 0 && (
        <Section title='Le déroulé'>
          <div className='space-y-8'>
            {data.programme.map((day) => (
              <div key={day.title}>
                <h3 className='font-heading text-lg' style={{ color: GREEN }}>
                  {day.title}
                </h3>
                {day.date && (
                  <p className='text-xs uppercase tracking-[0.15em]' style={{ color: MUTED }}>
                    {day.date}
                  </p>
                )}
                <ul className='mt-3 space-y-3'>
                  {day.entries.map((entry, i) => (
                    <li key={`${day.title}-${i}`} className='flex gap-4'>
                      <span
                        className='w-16 shrink-0 text-sm tabular-nums'
                        style={{ color: GREEN }}
                      >
                        {entry.time}
                      </span>
                      <span className='text-sm' style={{ color: BROWN }}>
                        {entry.label}
                        {entry.description && (
                          <span className='mt-0.5 block text-xs' style={{ color: MUTED }}>
                            {entry.description}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Venue ────────────────────────────────────────────────────── */}
      {data.venue && (
        <Section title='Le lieu'>
          <div className='overflow-hidden rounded-2xl bg-white/70 shadow-sm'>
            {data.venue.photoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element -- an
                 arbitrary Supabase storage host the image config does not
                 allowlist. */
              <img
                src={data.venue.photoUrl}
                alt=''
                className='aspect-video w-full object-cover'
              />
            )}
            <div className='p-5'>
              <h3 className='font-heading text-lg' style={{ color: GREEN }}>
                {data.venue.name}
              </h3>
              {(data.venue.address || data.venue.city) && (
                <p className='mt-1 text-sm' style={{ color: BROWN }}>
                  {[data.venue.address, data.venue.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}

              {(data.venue.mapsUrl || data.venue.wazeUrl) && (
                <div className='mt-4 flex flex-wrap gap-2'>
                  {data.venue.mapsUrl && (
                    <MapLink href={data.venue.mapsUrl}>Google Maps</MapLink>
                  )}
                  {data.venue.wazeUrl && (
                    <MapLink href={data.venue.wazeUrl}>Waze</MapLink>
                  )}
                </div>
              )}

              {data.venue.access.length > 0 && (
                <dl className='mt-5 space-y-3'>
                  {data.venue.access.map((entry) => (
                    <div key={entry.mode}>
                      <dt
                        className='text-xs uppercase tracking-[0.15em]'
                        style={{ color: MUTED }}
                      >
                        {entry.mode}
                      </dt>
                      <dd className='mt-1 text-sm' style={{ color: BROWN }}>
                        {entry.details.join(" · ")}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ── Accommodation ────────────────────────────────────────────── */}
      {data.accommodations.length > 0 && (
        <Section title='Où dormir'>
          <ul className='grid gap-4 sm:grid-cols-2'>
            {data.accommodations.map((stay) => (
              <li
                key={stay.id}
                className='overflow-hidden rounded-2xl bg-white/70 shadow-sm'
              >
                {stay.photoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element -- see above */
                  <img
                    src={stay.photoUrl}
                    alt=''
                    className='aspect-video w-full object-cover'
                  />
                )}
                <div className='p-4'>
                  <h3 className='font-heading text-base' style={{ color: GREEN }}>
                    {stay.name}
                  </h3>
                  <p className='mt-0.5 text-sm' style={{ color: BROWN }}>
                    {[stay.city, stay.distance].filter(Boolean).join(" · ")}
                  </p>
                  {stay.offer && (
                    <p className='mt-2 text-xs' style={{ color: GREEN }}>
                      {stay.offer}
                    </p>
                  )}
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {stay.bookingUrl && (
                      <MapLink href={stay.bookingUrl}>Réserver</MapLink>
                    )}
                    {stay.phone && (
                      <MapLink href={`tel:${stay.phone}`}>{stay.phone}</MapLink>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      {data.faq.length > 0 && (
        <Section title='Questions fréquentes'>
          <ul className='space-y-3'>
            {data.faq.map((entry) => (
              <li
                key={entry.id}
                className='rounded-2xl bg-white/70 p-5 shadow-sm'
              >
                <h3 className='font-heading text-base' style={{ color: GREEN }}>
                  {entry.question}
                </h3>
                <p className='mt-2 text-sm leading-relaxed' style={{ color: BROWN }}>
                  {entry.answer}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <footer className='mt-16 px-6 text-center'>
        <p className='text-xs uppercase tracking-[0.3em]' style={{ color: MUTED }}>
          À très bientôt
        </p>
      </footer>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className='mx-auto mt-14 w-full max-w-2xl px-6'>
      <h2
        className='mb-5 text-center text-xs uppercase tracking-[0.3em]'
        style={{ color: MUTED }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function MapLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='inline-flex min-h-11 items-center rounded-full px-4 text-sm transition-opacity hover:opacity-80'
      style={{ backgroundColor: BEIGE, color: GREEN }}
    >
      {children}
    </a>
  );
}
