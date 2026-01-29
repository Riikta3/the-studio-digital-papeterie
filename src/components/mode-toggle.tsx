"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className='rounded-full w-10 h-10 border border-primary/20 flex items-center justify-center text-primary'>
        <Sun className='h-[1.2rem] w-[1.2rem]' />
      </button>
    );
  }

  const isDark = theme === "theme-royal";

  return (
    <button
      onClick={() => setTheme(isDark ? "theme-floral" : "theme-royal")}
      className='rounded-full w-10 h-10 shrink-0 border border-primary/20 flex items-center justify-center text-primary bg-background/50 backdrop-blur-sm transition-colors hover:bg-primary/10'
      aria-label='Toggle theme'
    >
      {isDark ? (
        <Moon className='h-[1.2rem] w-[1.2rem] transition-all' />
      ) : (
        <Sun className='h-[1.2rem] w-[1.2rem] transition-all' />
      )}
    </button>
  );
}
