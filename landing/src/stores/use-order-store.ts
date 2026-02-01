import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlanType = "experience" | "premium" | null;

export interface OrderState {
  plan: PlanType;
  theme: string;
  modules: string[];
  extras: string[];
  setPlan: (plan: PlanType) => void;
  toggleModule: (module: string) => void;
  setTheme: (theme: string) => void;
}

const EXTRA_PRICES: Record<string, number> = {
  "custom-music": 10,
  "custom-illustration": 45,
  "animated-video": 55,
  "custom-domain": 65,
  "express-delivery": 85,
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      plan: null,
      theme: "theme-floral",
      modules: [],
      extras: [],
      setPlan: (plan) => set({ plan }),
      setTheme: (theme) => set({ theme }),
      toggleModule: (module) =>
        set((state) => ({
          modules: state.modules.includes(module)
            ? state.modules.filter((item) => item !== module)
            : [...state.modules, module],
        })),
    }),
    { name: "order-store" }
  )
);

export const selectTotalPrice = (state: OrderState) => {
  const basePrice =
    state.plan === "experience"
      ? 175
      : state.plan === "premium"
        ? 575
        : 0;

  const moduleSurcharge =
    state.plan === "experience"
      ? Math.max(0, state.modules.length - 4) * 5
      : 0;

  const extrasTotal = state.extras.reduce(
    (sum, extra) => sum + (EXTRA_PRICES[extra] ?? 0),
    0
  );

  return basePrice + moduleSurcharge + extrasTotal;
};
