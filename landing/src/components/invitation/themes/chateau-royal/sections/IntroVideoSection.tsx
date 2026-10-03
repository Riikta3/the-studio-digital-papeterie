import { useTranslations } from "next-intl";

import { Reveal } from "../../reveal";
import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { videoEmbedUrl } from "../../video";

/**
 * The couple's film, screened in the salon at night: a gilt frame on the
 * espresso velvet of the closing page, behind two curtains that part the first
 * time it comes into view. The curtains are drawn only once scripts run and
 * never for a reader who asked for no motion, so the film is never hidden.
 *
 * An embed link the theme cannot frame (not YouTube or Vimeo) renders nothing
 * rather than a broken player: `videoEmbedUrl` returns null for it.
 */
export function IntroVideoSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.chateauRoyal.film");
  const video = data.introVideo;
  if (!video?.url) return null;

  const embed = video.kind === "embed" ? videoEmbedUrl(video.url) : null;
  if (video.kind === "embed" && !embed) return null;

  const title = video.title?.trim();
  const subtitle = video.subtitle?.trim();
  const body = video.body?.trim();

  return (
    <section className="cr-film" id="cr-film" data-editor-section="intro-video">
      <Reveal as="div" className="cr-film-head reveal" revealedClass="visible" threshold={0.2}>
        <span className="section-eyebrow">{slot(data, "intro-video.eyebrow") ?? t("eyebrow")}</span>
        {title ? <h2>{title}</h2> : null}
        {subtitle ? <p className="cr-film-subtitle">{subtitle}</p> : null}
      </Reveal>

      <Reveal as="div" className="cr-film-stage" revealedClass="visible" threshold={0.35}>
        <span className="cr-glow" aria-hidden="true" />
        <div className="cr-film-frame">
          <div className="cr-film-screen">
            {embed ? (
              <iframe
                src={embed}
                title={title ?? t("frameTitle")}
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
      </Reveal>

      {body ? <p className="cr-film-body">{body}</p> : null}
    </section>
  );
}
