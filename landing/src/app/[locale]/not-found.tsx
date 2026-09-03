import type { Metadata } from "next";

import { NotFoundView } from "@/components/home/NotFoundView";

export const metadata: Metadata = {
  title: "Page introuvable — The Studio Papeterie Digitale",
  robots: { index: false, follow: false },
};

export default function LocaleNotFound() {
  return <NotFoundView />;
}
