import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"],
  defaultLocale: "fr",
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
