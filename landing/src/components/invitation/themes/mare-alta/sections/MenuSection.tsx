import { Fragment } from "react";
import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

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
 * Renders nothing when no course has a dish.
 */
export function MenuSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.menu");

  const courses = (data.menu?.sections ?? []).filter((course) => course.items.some((item) => item.title.trim()));
  if (courses.length === 0) return null;

  return (
    <Section id="ma-menu" className="menu coral-section" editorSection="menu">
      <SectionTitle
        rhythm
        // The wording is the theme's; the place is the couple's, so it is added here.
        eyebrow={slot(data, "menu.eyebrow") ?? [data.venue.name, t("eyebrow")].filter(Boolean).join(" · ")}
        title={
          <RhythmTitle
            text={slot(data, "menu.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`}
            firstClass="title-sans"
            secondClass="title-serif"
          />
        }
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
