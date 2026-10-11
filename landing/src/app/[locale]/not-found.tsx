import type { Metadata } from "next";

import { NotFoundViewLoader } from "@/components/home/NotFoundViewLoader";

export const metadata: Metadata = {
  title: "Page introuvable — The Studio Papeterie Digitale",
  robots: { index: false, follow: false },
};

export default function LocaleNotFound() {
  return <NotFoundViewLoader />;
}
