"use client";

import { usePathname, useRouter } from "@/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { useLocale } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";

const languages = [
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

  const handleLanguageChange = (value: string) => {
    router.replace(pathname, { locale: value });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className='w-[80px] justify-between rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-accent/50 hover:text-accent-foreground px-3'
        >
          {locale.toUpperCase()}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-[150px] rounded-xl bg-card border-border/50 z-[200] max-h-[300px] overflow-y-auto'>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onSelect={() => handleLanguageChange(language.value)}
            className='cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                locale === language.value ? "opacity-100" : "opacity-0",
              )}
            />
            <span className='font-medium'>{language.value.toUpperCase()}</span>
            <span className='ml-2 text-muted-foreground text-xs'>
              {language.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
