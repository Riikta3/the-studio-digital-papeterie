import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { resolve } from "path";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
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
