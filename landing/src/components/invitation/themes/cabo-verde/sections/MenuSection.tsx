import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Art } from "./Art";
import { Section } from "./Section";
import { Title } from "./Title";

/**
 * Menu — the dinner on a painted card with an arched top, the shape of the
 * hero's frame, standing on the table between a coconut and a glass.
 *
 * Each course is numbered like the theme's other lists (coral figures), its
 * title in the eyebrows' small capitals, its dishes in the heading face with
 * the couple's description under each; a gold wave separates two courses. The
 * couple's note and small print close the card.
 *
 * Renders nothing when no course has a dish.
 */
export function MenuSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.menu");
  const menu = data.menu;

  const courses = (menu?.sections ?? [])
    .map((course) => ({ ...course, items: course.items.filter((item) => item.title.trim()) }))
    .filter((course) => course.items.length > 0);
  if (!menu || courses.length === 0) return null;

  const footer = (menu.footer ?? []).filter((line) => line.trim());

  return (
    <Section className="cv-menu" editorSection="menu">
      <div className="cv-menu-card">
        <p className="eyebrow">{slot(data, "menu.eyebrow") ?? t("eyebrow")}</p>
        <Title text={slot(data, "menu.title") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />

        {courses.map((course, index) => (
          <div
            className="cv-course"
            key={`${index}-${course.title ?? ""}`}
            style={{ "--i": index } as CSSProperties}
          >
            {index > 0 ? <i className="cv-wave" aria-hidden="true" /> : null}
            <span className="cv-course-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            {course.title ? <h3>{course.title}</h3> : null}
            <ul>
              {course.items.map((item, dish) => (
                <li key={`${dish}-${item.title}`}>
                  <strong>{item.title}</strong>
                  {item.description ? <em>{item.description}</em> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {menu.note ? <p className="cv-menu-note">{menu.note}</p> : null}
        {footer.length > 0 ? (
          <div className="cv-menu-footer">
            {footer.map((line, index) => (
              <small key={`${index}-${line}`}>{line}</small>
            ))}
          </div>
        ) : null}
      </div>

      <div className="cv-menu-table" aria-hidden="true">
        <Art className="cv-menu-coconut" file="menu-coconut-v4" />
        <Art className="cv-menu-cocktail" file="menu-cocktail-v4" />
      </div>
    </Section>
  );
}
