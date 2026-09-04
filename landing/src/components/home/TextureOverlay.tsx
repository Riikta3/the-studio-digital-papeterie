// Soft paper-grain texture laid over the violet section backgrounds.
// Parent must be `relative` (and usually `overflow-hidden`).
export function TextureOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light"
      style={{
        backgroundImage: "url(/images/hero-texture.webp)",
        backgroundRepeat: "repeat",
        backgroundSize: "512px 512px",
      }}
    />
  );
}
