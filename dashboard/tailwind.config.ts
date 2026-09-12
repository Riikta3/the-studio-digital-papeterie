import { createRequire } from "node:module";
import type { Config } from "tailwindcss";

/*
 * The shared preset is a CommonJS file, and this one is an ES module — it uses
 * `import`, so Node treats it as ESM, where bare `require` does not exist.
 * Calling it directly threw `ReferenceError: require is not defined` at line 4
 * and the dashboard's dev server would not start at all.
 *
 * `createRequire` is the supported way to reach a CJS module from ESM. The
 * landing's copy of this config sidesteps the problem by being a `.js` file in
 * CommonJS (`module.exports`), which is why only the dashboard broke.
 */
const require = createRequire(import.meta.url);

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
