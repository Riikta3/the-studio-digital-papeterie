import createNextIntlPlugin from "next-intl/plugin";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { editorOrigins } from "./src/lib/editor-origins.mjs";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    root: resolve(__dirname, ".."),
  },
  async headers() {
    return [
      {
        // The editor's live preview may be framed by the couple's dashboard and
        // by nothing else. See src/lib/editor-origins.mjs for why that matters.
        source: "/:locale/invitation/apercu",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ["frame-ancestors 'self'", ...editorOrigins()].join(" "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
