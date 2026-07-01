"use client";

import { useEffect, useState } from "react";
import { useOrderStore } from "@/stores/use-order-store";
import { LivePreviewDrawer } from "./LivePreviewDrawer";
import { LivePreviewSidebar } from "./LivePreviewSidebar";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function toIsoDate(day: string, month: string, year: string): string {
  const m = MONTHS.indexOf(month) + 1;
  if (!day || !m || !year) return "";
  return `${year}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function LivePreviewPanel() {
  const theme       = useOrderStore((s) => s.theme);
  const animation   = useOrderStore((s) => s.animation);
  const modules     = useOrderStore((s) => s.modules);
  const weddingInfo = useOrderStore((s) => s.weddingInfo);
  const weddingDate = toIsoDate(weddingInfo.day, weddingInfo.month, weddingInfo.year);

  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted) return null;

  const props = {
    theme, animation, modules,
    partner1: weddingInfo.partner1,
    partner2: weddingInfo.partner2,
    weddingDate,
    venue: weddingInfo.venue,
  };

  return isDesktop ? <LivePreviewSidebar {...props} /> : <LivePreviewDrawer {...props} />;
}
