/**
 * Lets `node --test` load the apps' TypeScript as the apps themselves see it.
 *
 *   node --experimental-strip-types --import ./scripts/register-ts-aliases.mjs \
 *     --test landing/src/lib/invitation-data.test.mjs
 *
 * Node can strip types on its own, but it resolves imports like a browser:
 * `@/lib/x` and `@shared/types/y` mean nothing to it, and neither does a
 * relative import written without its extension — which is how every file in
 * both apps is written, because that is what the bundler expects. This hook
 * teaches Node those three rules and nothing else, so the code under test is
 * the code that ships, unmodified.
 */
import { register } from "node:module";

register("./ts-alias-hooks.mjs", import.meta.url);
