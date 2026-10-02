import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { resolve } from "path";

import { editorPreviewUrl } from "./src/lib/editor-preview-url";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/**
 * Where the invitation editor's live preview is framed from — the landing app,
 * a different origin. The editor builds its iframe from the same function, so
 * the frame it renders is always one this policy allows.
 */
const previewOrigin = editorPreviewUrl();

/**
 * The Supabase project the app talks to, allowed as a media source: the music
 * screen previews files from its Storage. In production it is already covered
 * by `https:`; a local stack serves Storage over plain http
 * (http://127.0.0.1:54321), which `media-src … https:` refused — every
 * « Écouter » failed with « Lecture impossible. ».
 */
const supabaseMediaOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-src 'self' ${previewOrigin} https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://open.spotify.com https://www.youtube.com https://player.vimeo.com https://maps.google.com; media-src 'self' blob: ${supabaseMediaOrigin} https://*.supabase.co https:;`,
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    root: resolve(process.cwd(), ".."),
  },
  // Explicitly transpile shared code if it's a local package
  transpilePackages: ["@shared"],
  webpack: (config) => {
    // Ensure webpack resolves the alias correctly if automatic resolution fails
    config.resolve.alias = {
      ...config.resolve.alias,
      "@shared": resolve(process.cwd(), "../shared"),
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
