import { useTranslations } from "next-intl";

import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Art } from "./Art";
import { Section } from "./Section";
import { Title } from "./Title";

/**
 * Welcome — the couple's announcement under a small island. It belongs to the
 * hero in the editor: the words are the hero tab's ("Nos mots").
 *
 * The island watches itself (`cv-surfaced`) rather than going with the
 * section: it sits at the foot of a tall block, and would otherwise have
 * finished rising out of the water before anyone scrolled down to it.
 */
export function WelcomeSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.welcome");

  return (
    <Section id="cv-welcome" className="welcome decorated" editorSection="hero">
      <p className="eyebrow cobalt">{slot(data, "hero.welcomeEyebrow") ?? t("eyebrow")}</p>
      <Title text={slot(data, "hero.welcomeTitle") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
      <p className="intro">{data.copy?.announcement || t("intro")}</p>
      <Reveal className="cv-island" revealedClass="cv-surfaced" threshold={0.45}>
        <Art className="welcome-island" file="beach-island-v8" />
      </Reveal>
    </Section>
  );
}
