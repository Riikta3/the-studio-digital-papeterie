import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { videoEmbedUrl } from "../../video";

import { Section } from "./Section";
import { Title } from "./Title";

/**
 * The couple's welcome film, right after their announcement: a band of deep
 * sea — the programme's night blue — with the film in an ivory mat, the
 * painted card's rounded corners and a gold hairline around it. On arrival the
 * frame opens from its middle like a curtain (`modules.css`).
 *
 * An embed link the theme cannot frame (not YouTube or Vimeo) renders nothing
 * rather than a broken player: `videoEmbedUrl` returns null for it. An uploaded
 * file plays in the browser's own player.
 */
export function IntroVideoSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.caboVerde.introVideo");
  const video = data.introVideo;
  if (!video?.url) return null;

  const embed = video.kind === "embed" ? videoEmbedUrl(video.url) : null;
  if (video.kind === "embed" && !embed) return null;

  return (
    <Section className="cv-film" editorSection="intro-video">
      <p className="eyebrow light">{slot(data, "intro-video.eyebrow") ?? t("eyebrow")}</p>
      {video.title ? <Title text={video.title} /> : null}
      {video.subtitle ? <p className="cv-film-subtitle">{video.subtitle}</p> : null}

      <div className="cv-film-frame">
        <div className="cv-film-screen">
          {embed ? (
            <iframe
              src={embed}
              title={video.title ?? t("frameTitle")}
              loading="lazy"
              // `fullscreen` in `allow` is the modern form; adding `allowFullScreen`
              // too only earns a console warning about which one wins.
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            />
          ) : (
            <video src={video.url} controls playsInline preload="metadata" />
          )}
        </div>
      </div>

      {video.body ? <p className="intro cv-film-body">{video.body}</p> : null}
    </Section>
  );
}
