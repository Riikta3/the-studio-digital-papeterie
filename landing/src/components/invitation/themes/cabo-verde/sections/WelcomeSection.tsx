import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";

import { Art } from "./Art";
import { Section } from "./Section";
import { Title } from "./Title";

/**
 * Welcome — the couple's announcement under a small island. It belongs to the
 * hero in the editor: the words are the hero tab's ("Nos mots").
 */
export function WelcomeSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.welcome");

  return (
    <Section id="cv-welcome" className="welcome decorated" editorSection="hero">
      <p className="eyebrow cobalt">{slot(data, "hero.welcomeEyebrow") ?? t("eyebrow")}</p>
      <Title text={slot(data, "hero.welcomeTitle") ?? `${t("titleLine1")}\n${t("titleLine2")}`} />
      <p className="intro">{data.copy?.announcement || t("intro")}</p>
      <Art className="welcome-island" file="beach-island-v8" />
    </Section>
  );
}
