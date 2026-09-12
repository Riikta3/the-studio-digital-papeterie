import type { InvitationData } from "../../types";
import { Reveal } from "../Reveal";

/**
 * Gift note.
 *
 * Every word here used to be written into the markup: a heading, a paragraph
 * promising an urn on the day, a second one announcing a bank transfer to
 * come, and a disabled button captioned "Informations à venir". That is a
 * statement about one couple's own arrangements, and it was shown to every
 * wedding that bought the `gift-list` module — including couples who had
 * arranged none of it.
 *
 * It renders only what the couple wrote (`gifts`, filled from the dashboard's
 * gift-list screen) and disappears entirely when they wrote nothing. The
 * heading keeps a default because it names the section rather than making a
 * claim; the sprite stays because it is the theme's own artwork.
 */
export function GiftsSection({ data }: { data: InvitationData }) {
  const gifts = data.gifts;
  if (!gifts?.body && !gifts?.url) return null;

  return (
    <section className="panel gifts pearled">
      <Reveal>
        <p className="eyebrow">Cadeaux</p>
        <h2>{gifts.title ?? "Votre présence est notre plus beau cadeau"}</h2>
      </Reveal>

      {/* Drawn from a two-frame sprite by the theme's CSS, so it is an empty
          element with a label rather than an <img>. */}
      <div className="gift-animation" role="img" aria-label="Paquet cadeau orné de perles" />

      {gifts.body ? (
        <Reveal delay={70}>
          {gifts.body.split("\n").map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Reveal>
      ) : null}

      {/* A real link, never a disabled button: the source shipped one because
          that couple had no details to publish yet, which is a reason to show
          nothing rather than a dead control. */}
      {gifts.url ? (
        <div className="gift-actions">
          <a href={gifts.url} target="_blank" rel="noreferrer">
            {gifts.linkLabel ?? "Participer"}
          </a>
        </div>
      ) : null}
    </section>
  );
}
