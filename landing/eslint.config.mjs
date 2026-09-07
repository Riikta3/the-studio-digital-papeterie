/**
 * Flat ESLint config for the landing workspace.
 *
 * Next 16 removed `next lint`, and ESLint 9 no longer reads `.eslintrc.json` —
 * between the two, `npm run lint` failed outright ("Invalid project directory
 * provided, no such directory: .../lint"). `eslint-config-next` already ships
 * flat config, so this wires it up and calls `eslint` directly.
 *
 * The `files` scoping matters: the shared configs match on bare `**\/*.ts(x)`
 * globs, and in this npm-workspaces monorepo that reaches `dashboard/`,
 * `landing-deprecated/` and even `.claude/` — 62k findings from code this
 * workspace does not own. Restricting the run keeps `npm run lint` about
 * landing. The script passes `src` explicitly for the same reason.
 */

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/** Everything this workspace actually owns. */
const OWNED = ["src/**/*.{js,mjs,ts,tsx}", "*.{js,mjs,ts}"];

export default [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "public/**"],
  },
  ...[...nextCoreWebVitals, ...nextTypeScript].map((config) =>
    // Leave plugin/parser-only blocks (no `rules`) alone: scoping those would
    // stop the parser and plugins from being registered at all.
    config.rules ? { ...config, files: config.files ?? OWNED } : config,
  ),
  {
    files: OWNED,
    rules: {
      /*
       * Next 16's React plugin turned these on as errors, and they flag
       * patterns this codebase already relies on in ~20 places (the themes'
       * countdown clocks, FadeIn, the language switchers, TableFinder). They
       * are warnings here so `npm run lint` is usable as a gate for new
       * problems instead of failing on day one; the findings stay visible.
       *
       * Two of the set-state-in-effect hits are load-bearing rather than
       * sloppy: ThemeConfigSheet and the animation step seed local state from
       * the persisted (localStorage) order, which cannot be read during render
       * without a hydration mismatch — the effect is the fix, not the bug.
       */
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
];
