import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { dayMonth } from "./event-day";
import { Section } from "./Section";
import { RhythmTitle, SectionTitle } from "./SectionTitle";

/**
 * The menu, set as the designer drew it: a framed card of numbered courses over
 * a scatter of embroidered tableware.
 *
 * A course is its title in small capitals over its dishes, each on its own line
 * with the couple's description under it. The crest at the top of the card and
 * the line at its foot are drawn by the stylesheet from custom properties the
 * root sets (the couple's monogram; the venue and the day, or their own lines).
 *
 * The title is the designer's ("Le menu / du 19 juin"): the wording is a slot,
 * the day is the wedding's, appended in the page's language by a pattern each
 * language orders its own way (spec D2: a slot's default takes no argument). The
 * sentence under it is a slot too, empty by default: the designer's named the
 * region of the demo wedding, so it lives in the demo's `texts`.
 *
 * Renders nothing when no course has a dish.
 */
export function MenuSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.menu");
  const locale = useLocale();

  const courses = (data.menu?.sections ?? []).filter((course) => course.items.some((item) => item.title.trim()));
  if (courses.length === 0) return null;

  const wording = slot(data, "menu.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`;
  const day = dayMonth(data.event.startsAt, locale);
  const intro = slot(data, "menu.intro") ?? (t("intro") || undefined);

  return (
    // Without the sentence under the title the card rides up by its height, and the embroidered
    // tableware (placed from the top of the section) with it: `ma-menu-bare` lifts the tableware too.
    <Section id="ma-menu" className={intro ? "menu coral-section" : "menu coral-section ma-menu-bare"} editorSection="menu">
      <SectionTitle
        rhythm
        // The wording is the theme's; the place is the couple's, so it is added here.
        eyebrow={slot(data, "menu.eyebrow") ?? [data.venue.name, t("eyebrow")].filter(Boolean).join(" · ")}
        title={
          <RhythmTitle
            text={day ? t("titleWithDate", { wording, date: day }) : wording}
            firstClass="title-sans"
            secondClass="title-serif"
          />
        }
        intro={intro}
      />
      <div className="menu-scatter" role="img" aria-label={t("scatterLabel")}>
        <i className="menu-piece plate" />
        <i className="menu-piece lemon" />
        <i className="menu-piece glass" />
        <i className="menu-piece napkin" />
        <i className="menu-piece fork" />
        <i className="menu-piece knife" />
      </div>
      <div className="menu-list restaurant-menu">
        {courses.map((course, index) => (
          <div key={`${index}-${course.title ?? ""}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>
              {course.title ? <small>{course.title}</small> : null}
              {course.items
                .filter((item) => item.title.trim())
                .map((item, dish) => (
                  <Fragment key={`${dish}-${item.title}`}>
                    {dish > 0 ? <br /> : null}
                    {item.title}
                    {item.description ? (
                      <>
                        <br />
                        <i className="ma-dish-note">{item.description}</i>
                      </>
                    ) : null}
                  </Fragment>
                ))}
            </p>
          </div>
        ))}
      </div>
      {data.menu?.note ? <p className="chef-note">{data.menu.note}</p> : null}
    </Section>
  );
}
