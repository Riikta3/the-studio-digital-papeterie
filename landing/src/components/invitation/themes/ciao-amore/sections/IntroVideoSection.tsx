import { useTranslations } from "next-intl";

import { slot } from "../../text";
import type { InvitationData } from "../../types";
import { videoEmbedUrl } from "../../video";

/**
 * The couple's welcome film, on the cobalt band the theme uses for its
 * showpieces, in a sun-gold double frame.
 *
 * An embed link the theme cannot frame (not YouTube or Vimeo) renders nothing
 * rather than a broken player: `videoEmbedUrl` returns null for it.
 */
export function IntroVideoSection({ data }: { data: InvitationData }) {
  const t = useTranslations("Invitation.ciaoAmore.introVideo");
  const video = data.introVideo;
  if (!video) return null;

  const embed = video.kind === "embed" ? videoEmbedUrl(video.url) : null;
  if (video.kind === "embed" && !embed) return null;

  return (
    <section className="ca-video-section" data-editor-section="intro-video">
      <p className="eyebrow">{slot(data, "intro-video.eyebrow") ?? t("eyebrow")}</p>
      {video.title ? <h2>{video.title}</h2> : null}
      {video.subtitle ? <p className="ca-video-subtitle">{video.subtitle}</p> : null}

      <div className="ca-video-frame">
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

      {video.body ? <p className="ca-video-body">{video.body}</p> : null}
    </section>
  );
}
