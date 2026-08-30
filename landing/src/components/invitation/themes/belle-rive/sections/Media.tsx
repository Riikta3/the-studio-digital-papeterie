/**
 * An `.art` slot that is either a still or a silent looping clip.
 *
 * The source decided which to render with a boolean prop at every call site.
 * Here the choice follows the file extension, so a couple swapping a photo for
 * a video in their data does not also need a code change.
 */
export function Media({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const classes = ["art", className].filter(Boolean).join(" ");

  if (/\.(mp4|webm|mov)$/i.test(src)) {
    return (
      <video
        className={classes}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        // Decorative motion, not content: it carries no information a caption
        // would, and it has no controls to announce.
        aria-label={alt}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- the theme's CSS sizes
    // these with `mix-blend-mode` and organic `border-radius`; next/image's
    // wrapper element breaks that layout.
    <img className={classes} src={src} alt={alt} loading="lazy" />
  );
}
