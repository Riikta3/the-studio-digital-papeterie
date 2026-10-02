import { useTranslations } from "next-intl";
import { Fragment } from "react";

import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";

/**
 * The dinner menu as a trattoria card: courses in the display face, dishes in
 * the serif, a gold star between courses.
 */
export function MenuSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.menu");
  const menu = data.menu;
  if (!menu || menu.sections.length === 0) return null;

  return (
    <section className="paper ca-menu-section" data-editor-section="menu">
      <div className="ca-menu-card">
        <p className="eyebrow">{slot(data, "menu.eyebrow") ?? t("eyebrow")}</p>
        <h2>
          <Lines text={slot(data, "menu.title") ?? t("title")} />
        </h2>

        {menu.sections.map((section, index) => (
          <Fragment key={`${section.title ?? "section"}-${index}`}>
            {index > 0 ? (
              <span className="ca-menu-star" aria-hidden="true">
                ✦
              </span>
            ) : null}
            <div className="ca-menu-course">
              {section.title ? <h3>{section.title}</h3> : null}
              <ul>
                {section.items.map((item, itemIndex) => (
                  <li key={`${item.title}-${itemIndex}`}>
                    <strong>{item.title}</strong>
                    {item.description ? <em>{item.description}</em> : null}
                  </li>
                ))}
              </ul>
            </div>
          </Fragment>
        ))}

        {menu.note ? <p className="ca-menu-note">{menu.note}</p> : null}
        {menu.footer?.length ? (
          <div className="ca-menu-footer">
            {menu.footer.map((line, index) => (
              <small key={`${index}-${line}`}>{line}</small>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
