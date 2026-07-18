import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { TextureOverlay } from "./TextureOverlay";

// FinalCta and the Footer share one continuous violet background (texture
// overlay), split by a hairline border — so they're wrapped in a single
// section rather than two separate ones.
export function FinalCtaAndFooter() {
  return (
    <div className="relative overflow-hidden bg-studio-violet">
      <TextureOverlay />

      <div className="relative">
        <FinalCta />
        <Footer />
      </div>
    </div>
  );
}
