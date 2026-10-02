import { useLocale, useTranslations } from "next-intl";

import { monogramOf } from "../../monogram";
import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { dayHeading } from "../dates";
import { weddingDayOf } from "../programme";

import { CakeScene } from "./CakeScene";
import { Crest } from "./Crest";
import { TitleLines } from "./TitleLines";

/**
 * The royal menu: a printed dinner card — a crest, the courses, and the wedding
 * cake that is nibbled in three states beneath them.
 *
 * Renders nothing when the couple's menu has no dish.
 */
export function MenuSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.menu");
  const locale = useLocale();

  const courses = (data.menu?.sections ?? []).filter((section) => section.items.length > 0);
  if (courses.length === 0) return null;

  const note = data.menu?.note?.trim();
  const footer = (data.menu?.footer ?? []).map((line) => line.trim()).filter(Boolean);
  // "Le dîner · samedi 19 juin": the slot is the wording, the day is appended.
  const eyebrow = [slot(data, "menu.eyebrow") ?? t("eyebrow"), dayHeading(weddingDayOf(data), locale)]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="royal-menu" id="cr-menu" data-editor-section="menu">
      <div className="menu-inner">
        <Reveal as="div" className="menu-card reveal" revealedClass="visible" threshold={0.12}>
          <div className="menu-card-inner">
            <div className="menu-crest" aria-hidden="true">
              <span>✦</span>
              <Crest text={monogramOf(data.couple, " & ")} />
              <span>✦</span>
            </div>
            <span className="section-eyebrow">{eyebrow}</span>
            <h2>
              <TitleLines
                inline
                text={slot(data, "menu.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`}
              />
            </h2>
            <div className="menu-filigree" aria-hidden="true">
              ✧ <span>❧</span> ✧
            </div>
            {courses.map((section, index) => (
              <div className="menu-course" key={`${index}-${section.title ?? ""}`}>
                {section.title ? <span>{section.title}</span> : null}
                {section.items.map((item, position) => (
                  <p key={`${position}-${item.title}`}>
                    {item.title}
                    {item.description ? (
                      <>
                        <br />
                        <small>{item.description}</small>
                      </>
                    ) : null}
                  </p>
                ))}
              </div>
            ))}
            {/* The menu tab's small print: "vegetarian on request", the wines, the coffee. */}
            {note || footer.length > 0 ? (
              <div className="cr-menu-notes">
                {note ? <p>{note}</p> : null}
                {footer.map((line, index) => (
                  <p key={`${index}-${line}`}>{line}</p>
                ))}
              </div>
            ) : null}
            <CakeScene />
            <div className="menu-card-tail" aria-hidden="true">
              ❦
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
