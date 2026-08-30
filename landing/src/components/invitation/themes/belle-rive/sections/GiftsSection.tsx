import { Reveal } from "../Reveal";

/**
 * Gift note.
 *
 * The bank-transfer button is disabled in the source too: the couple had no
 * details to publish yet, and the "Informations à venir" caption below it says
 * so. It is kept disabled rather than dropped so the section still reads as
 * finished.
 */
export function GiftsSection() {
  return (
    <section className="panel gifts pearled">
      <Reveal>
        <p className="eyebrow">Cadeaux</p>
        <h2>
          Votre présence est
          <br />
          notre plus beau cadeau
        </h2>
      </Reveal>

      {/* Drawn from a two-frame sprite by the theme's CSS, so it is an empty
          element with a label rather than an <img>. */}
      <div className="gift-animation" role="img" aria-label="Paquet cadeau orné de perles" />

      <Reveal delay={70}>
        <p>
          Si vous souhaitez malgré tout nous laisser une attention, une urne sera délicatement
          mise à votre disposition le jour du mariage.
        </p>
        <p className="gift-online">
          Vous pourrez également nous accompagner dans cette belle aventure par virement bancaire.
        </p>
      </Reveal>

      <div className="gift-actions">
        <button type="button" disabled>
          Virement bancaire
        </button>
      </div>
      <small>Informations à venir</small>
    </section>
  );
}
