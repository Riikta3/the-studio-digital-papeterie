"use client";

import { useRouter, usePathname } from "@/navigation";

const STEPS = [
  "/create/plan",
  "/create/animation",
  "/create/theme",
  "/create/modules",
  "/create/languages",
  "/create/extras",
  "/create/wedding",
  "/create/checkout",
];

export function useConfiguratorStep() {
  const router = useRouter();
  const pathname = usePathname();

  const currentIndex = STEPS.findIndex((step) => pathname.includes(step));
  const nextStep = STEPS[currentIndex + 1] ?? STEPS[STEPS.length - 1];

  const goToNextStep = () => router.push(nextStep);

  return { goToNextStep, currentIndex, nextStep };
}
