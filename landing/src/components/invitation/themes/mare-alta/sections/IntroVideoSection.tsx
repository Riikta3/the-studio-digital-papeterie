import { useTranslations } from "next-intl";

import { Reveal } from "../../reveal";
import { Lines, slot } from "../../text";
import type { InvitationData } from "../../types";
import { videoEmbedUrl } from "../../video";

import { Section } from "./Section";
import { SectionTitle } from "./SectionTitle";

/**
 * The couple's welcome film, mounted like a piece of needlework: an ivory silk
 * mat on the linen, a running stitch in gold thread around the screen and a
 * pearl knotted at each corner. The designer drew no film; this follows the
 * grammar of their other framed pieces (the venue's picture, the menu card).
 *
 * As the section comes into view the stitch sews itself around the screen, one
 * side after the other, and each pearl appears as the thread reaches its corner
 * (`modules.css`). The four `<i>` are the four sides.
 *
 * An embed link the theme cannot frame (not YouTube or Vimeo) renders nothing
 * rather than a broken player: `videoEmbedUrl` returns null for it.
 */
export function IntroVideoSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.mareAlta.introVideo");
  const video = data.introVideo;
  if (!video) return null;

  const embed = video.kind === "embed" ? videoEmbedUrl(video.url) : null;
  if (video.kind === "embed" && !embed) return null;

  return (
    <Section id="ma-film" className="ma-film coral-section" editorSection="intro-video">
      <SectionTitle
        eyebrow={slot(data, "intro-video.eyebrow") ?? t("eyebrow")}
        title={video.title}
        intro={video.subtitle}
      />
      {/* The frame watches itself: the stitch is sewn once half of it is on screen, not when the top of
          the section is, which would play it before a guest has scrolled down to the film. */}
      <Reveal className="ma-film-frame" revealedClass="ma-sewn" threshold={0.5}>
        <span className="ma-stitch" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <div className="ma-film-screen">
          {embed ? (
            <iframe
              src={embed}
              title={video.title || t("frameTitle")}
              loading="lazy"
              // `fullscreen` in `allow` is the modern form; adding `allowFullScreen`
              // too only earns a console warning about which one wins.
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            />
          ) : (
            <video
              src={video.url}
              controls
              playsInline
              preload="metadata"
              aria-label={video.title || t("frameTitle")}
            />
          )}
        </div>
      </Reveal>
      {video.body ? (
        <p className="ma-film-body">
          <Lines text={video.body} />
        </p>
      ) : null}
    </Section>
  );
}
