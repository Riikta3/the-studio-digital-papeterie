"use client";

import { usePathname, useRouter } from "@/navigation";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleCreate = (nextLocale: string) => {
    startTransition(() => {
      // @ts-ignore -- next-intl types can be tricky
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
  ];

  return (
    <Select
      defaultValue={locale}
      onValueChange={handleCreate}
      disabled={isPending}
    >
      <SelectTrigger className='w-full bg-transparent border-transparent text-muted-foreground hover:bg-gray-50 hover:text-foreground focus:ring-0 focus:ring-offset-0 px-3 h-10'>
        <div className='flex items-center gap-3'>
          <Globe size={18} />
          <SelectValue placeholder={t("select_language")} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem
            key={lang.code}
            value={lang.code}
          >
            <span className='mr-2'>{lang.flag}</span> {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
