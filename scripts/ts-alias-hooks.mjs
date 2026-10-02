/**
 * Resolve hook for `register-ts-aliases.mjs`.
 *
 * - `@shared/x`  → `<repo>/shared/x`
 * - `@/x`        → `<repo>/<app>/src/x`, the app being whichever of `landing/`
 *                  or `dashboard/` the importing file lives in (both apps use
 *                  the same alias for their own `src/`)
 * - `./x`, `@/x` → the first of `x.ts`, `x.tsx`, `x/index.ts` that exists,
 *                  when written without an extension
 */
import { existsSync, statSync } from "node:fs";
import { dirname, resolve as resolvePath, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const APPS = ["landing", "dashboard"];
const CANDIDATES = ["", ".ts", ".tsx", `${sep}index.ts`, `${sep}index.tsx`];
const HAS_EXTENSION = /\.(?:[cm]?[jt]sx?|json)$/;

function appOf(parentURL) {
  if (!parentURL?.startsWith("file:")) return null;
  const parent = fileURLToPath(parentURL);
  return APPS.find((app) => parent.startsWith(resolvePath(ROOT, app) + sep)) ?? null;
}

function existingFile(path) {
  for (const suffix of CANDIDATES) {
    const candidate = path + suffix;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  let target = null;

  if (specifier.startsWith("@shared/")) {
    target = resolvePath(ROOT, "shared", specifier.slice("@shared/".length));
  } else if (specifier.startsWith("@/")) {
    const app = appOf(context.parentURL);
    if (app) target = resolvePath(ROOT, app, "src", specifier.slice(2));
  } else if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:") &&
    !HAS_EXTENSION.test(specifier)
  ) {
    target = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  }

  const file = target && existingFile(target);
  if (file) return nextResolve(pathToFileURL(file).href, context);

  return nextResolve(specifier, context);
}
