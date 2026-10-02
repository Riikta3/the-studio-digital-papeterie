/**
 * One of the designer's painted decorations: an image the stylesheet positions
 * and animates, hidden from assistive technology. `file` is the asset's name
 * under `public/themes/cabo-verde/`, without the extension.
 *
 * Lazy by default; the hero's boats are the first view and pass `eager`.
 */
export function Art({ file, className, eager = false }: { file: string; className: string; eager?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative, positioned and animated by CSS.
    <img
      className={className}
      src={`/themes/cabo-verde/${file}.webp`}
      alt=""
      aria-hidden="true"
      loading={eager ? undefined : "lazy"}
    />
  );
}
