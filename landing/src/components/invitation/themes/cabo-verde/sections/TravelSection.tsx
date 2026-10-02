import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Art } from "./Art";
import { Section } from "./Section";

/**
 * Travel notebook — a passport, a boarding pass and a plane, then one numbered
 * card per way of getting there (`venue.access`: the transport tab's modes and
 * the venue tab's practical information alike).
 *
 * A section with nothing to say renders nothing, not an empty notebook.
 */
export function TravelSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.travel");
  const access = data.venue.access ?? [];
  if (access.length === 0) return null;

  return (
    <Section className="practical decorated" editorSection="transport">
      <div className="travel-scene" aria-hidden="true">
        <Art className="travel-passport" file="travel-passport-v12" />
        <Art className="travel-ticket" file="travel-boarding-pass-v12" />
        <Art className="travel-plane" file="travel-plane-v12" />
      </div>
      <p className="eyebrow cobalt">{slot(data, "transport.eyebrow") ?? t("eyebrow")}</p>
      <h2 className="motion-title">{slot(data, "transport.title") ?? t("title")}</h2>

      <div className="practical-grid">
        {access.map((entry, index) => (
          <article key={`${index}-${entry.mode}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{entry.mode}</h3>
            {entry.details.map((detail, detailIndex) => (
              <p key={`${detailIndex}-${detail}`}>
                {/* A couple may paste a link into their directions: it is a link, not raw text. */}
                {/^https?:\/\//.test(detail) ? (
                  <a href={detail} target="_blank" rel="noreferrer">
                    {detail.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  detail
                )}
              </p>
            ))}
            {entry.link ? (
              <p>
                <a href={entry.link.url} target="_blank" rel="noreferrer">
                  {entry.link.label || t("open")}
                </a>
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}
