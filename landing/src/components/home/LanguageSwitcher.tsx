"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { cn } from "@shared/lib/utils";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/navigation";

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "it", label: "Italiano" },
  { value: "ar", label: "العربية" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 font-body text-sm text-white"
        >
          <Globe className="h-4 w-4" />
          {locale.toUpperCase()}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[300px] overflow-y-auto rounded-xl border-studio-lavande/40 bg-white"
      >
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onSelect={() => router.replace(pathname, { locale: language.value })}
            className="cursor-pointer gap-2 font-body text-studio-violet focus:bg-studio-creme"
          >
            <Check
              className={cn(
                "h-4 w-4 shrink-0",
                locale === language.value ? "opacity-100" : "opacity-0",
              )}
            />
            <span className="font-medium">{language.value.toUpperCase()}</span>
            <span className="text-xs text-studio-violet/60">
              {language.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
