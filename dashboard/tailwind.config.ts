import type { Config } from "tailwindcss";

const config: Config = {
  presets: [require("../shared/tailwind-preset.js")],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../shared/components/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
