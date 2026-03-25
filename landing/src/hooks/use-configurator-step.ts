"use client";

import { useRouter, usePathname } from "@/navigation";

const STEPS = [
  "/studio/start",
  "/studio/animation",
  "/studio/theme",
  "/studio/modules",
  "/studio/languages",
  "/studio/extras",
  "/studio/wedding",
  "/studio/checkout",
];

export function useConfiguratorStep() {
  const router = useRouter();
  const pathname = usePathname();

  const currentIndex = STEPS.findIndex((step) => pathname.includes(step));
  const nextStep = STEPS[currentIndex + 1] ?? STEPS[STEPS.length - 1];

  const goToNextStep = () => router.push(nextStep);

  return { goToNextStep, currentIndex, nextStep };
}
