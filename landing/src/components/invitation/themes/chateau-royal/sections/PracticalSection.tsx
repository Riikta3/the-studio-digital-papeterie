import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { withChildrenPolicyFaq } from "../../faq";
import { Reveal } from "../../reveal";
import { Lines, slot } from "../../text";
import type { InvitationData, ModuleId } from "../../types";

/** The small ornament that opens each card, one after the other. */
const ORNAMENTS = ["✦", "⌖", "☽", "❦", "✧", "❧"];
const ornamentAt = (index: number) => ORNAMENTS[index % ORNAMENTS.length]!;

/**
 * One of the small details. Each card belongs to the editor tab that writes it —
 * the dress code, a way to get there, a question — so a click on it in the
 * preview opens that tab.
 */
function Card({
  editorSection,
  ornament,
  photo,
  children,
}: {
  editorSection: string;
  ornament: string;
  /** The couple's own picture, which takes the ornament's place. */
  photo?: { src: string; alt: string };
  children: ReactNode;
}) {
  return (
    <Reveal
      as="div"
      className="practical-item reveal"
      revealedClass="visible"
      threshold={0.12}
      data-editor-section={editorSection}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- the couple's own picture, cropped by CSS.
        <img className="cr-card-photo" src={photo.src} alt={photo.alt} loading="lazy" />
      ) : (
        <span className="practical-ornament" aria-hidden="true">
          {ornament}
        </span>
      )}
      {children}
    </Reveal>
  );
}

/** A line of directions that is only a web address becomes a link. */
function Detail({ text }: { text: string }) {
  if (!/^https?:\/\/\S+$/.test(text)) return <p>{text}</p>;
  return (
    <p>
      <a href={text} target="_blank" rel="noreferrer">
        {text.replace(/^https?:\/\//, "")}
      </a>
    </p>
  );
}

/**
 * "Les petits détails": the dress code, the ways to get there and the questions
 * a guest asks, in the designer's grid of ornamented cards.
 *
 * Three modules feed one grid, so the section decides for itself what to draw
 * and renders nothing when there is nothing to say. The directions belong with
 * the place: owning the map is enough to draw them.
 */
export function PracticalSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal");

  const enabled = data.modules;
  const has = (id: ModuleId) => !enabled || enabled.includes(id);

  const dress = has("dress-code") ? data.dressCode : undefined;
  const access = has("transport") || has("map") ? (data.venue.access ?? []) : [];
  // The children question is derived from the RSVP's own setting, so the answer
  // can never contradict the form.
  const faq = has("faq")
    ? withChildrenPolicyFaq(data, {
        question: t("faq.childrenQuestion"),
        adultsOnlyAnswer: t("faq.childrenAdultsOnly"),
        childrenWelcomeAnswer: t("faq.childrenWelcome"),
      })
    : [];

  if (!dress && access.length === 0 && faq.length === 0) return null;

  // The ornaments run on across the three groups.
  const accessFrom = dress ? 1 : 0;
  const faqFrom = accessFrom + access.length;

  return (
    <section className="practical" id="cr-infos">
      <Reveal as="div" className="section-heading reveal" revealedClass="visible" threshold={0.12}>
        <span className="section-eyebrow">{slot(data, "faq.eyebrow") ?? t("practical.eyebrow")}</span>
        <h2>
          <Lines text={slot(data, "faq.title") ?? t("practical.title")} />
        </h2>
      </Reveal>
      <div className="practical-grid">
        {dress ? (
          <Card
            editorSection="dress-code"
            ornament={ornamentAt(0)}
            photo={dress.image ? { src: dress.image, alt: dress.title } : undefined}
          >
            <h3>{dress.title}</h3>
            {dress.body ? <p>{dress.body}</p> : null}
            {dress.note ? <p>{dress.note}</p> : null}
            {dress.colors?.length ? (
              <div className="cr-swatches" aria-hidden="true">
                {/* By position: the editor adds every new swatch in the same colour. */}
                {dress.colors.map((color, index) => (
                  <span key={`${index}-${color}`} style={{ background: color }} />
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}
        {access.map((entry, index) => (
          <Card
            editorSection="transport"
            ornament={ornamentAt(accessFrom + index)}
            key={`${index}-${entry.mode}`}
          >
            <h3>{entry.mode}</h3>
            {entry.details.map((detail, position) => (
              <Detail key={`${position}-${detail}`} text={detail} />
            ))}
            {entry.link ? (
              <a href={entry.link.url} target="_blank" rel="noreferrer">
                {entry.link.label || t("practical.open")}
              </a>
            ) : null}
          </Card>
        ))}
        {faq.map((entry, index) => (
          <Card
            editorSection="faq"
            ornament={ornamentAt(faqFrom + index)}
            key={`${index}-${entry.question}`}
          >
            <h3>{entry.question}</h3>
            <p>{entry.answer}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
