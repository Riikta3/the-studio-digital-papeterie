import { create } from "zustand";
import { persist } from "zustand/middleware";

import { computeOrderTotal } from "@/lib/pricing";

export type PlanType = "experience" | "premium" | null;

export interface WeddingInfo {
  partner1: string;
  partner2: string;
  day: string;
  month: string;
  year: string;
  venue: string;
  email: string;
  password: string;
}

export interface OrderState {
  plan: PlanType;
  animation: string;
  theme: string;
  modules: string[];
  primaryLanguage: string;
  languages: string[];
  adultsOnly: boolean;
  extras: string[];
  weddingInfo: WeddingInfo;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  emailExists: boolean;
  setEmailExists: (value: boolean) => void;

  setPlan: (plan: PlanType) => void;
  setAnimation: (animation: string) => void;
  setTheme: (theme: string) => void;
  toggleModule: (module: string) => void;
  setPrimaryLanguage: (code: string) => void;
  toggleLanguage: (code: string) => void;
  setAdultsOnly: (value: boolean) => void;
  toggleExtra: (extra: string) => void;
  setWeddingInfo: (info: Partial<WeddingInfo>) => void;
  resetStore: () => void;
}

// Prices live in lib/pricing.ts so the server can charge exactly what the
// client displays. Re-exported here to keep existing imports working.
export { EXTRA_PRICES, LANGUAGE_PRICE } from "@/lib/pricing";

const DEFAULT_WEDDING_INFO: WeddingInfo = {
  partner1: "",
  partner2: "",
  day: "",
  month: "",
  year: "",
  venue: "",
  email: "",
  password: "",
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      plan: null,
      animation: "",
      theme: "Amalfi",
      modules: [],
      primaryLanguage: "fr",
      languages: [],
      adultsOnly: false,
      extras: [],
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      emailExists: false,
      setEmailExists: (value) => set({ emailExists: value }),
      weddingInfo: DEFAULT_WEDDING_INFO,
      setPlan: (plan) => set({ plan }),
      setPrimaryLanguage: (code) => set({ primaryLanguage: code }),
      setAnimation: (animation) => set({ animation }),
      setTheme: (theme) => set({ theme }),
      toggleModule: (module) =>
        set((state) => ({
          modules: state.modules.includes(module)
            ? state.modules.filter((m) => m !== module)
            : [...state.modules, module],
        })),
      toggleLanguage: (code) =>
        set((state) => ({
          languages: state.languages.includes(code)
            ? state.languages.filter((l) => l !== code)
            : [...state.languages, code],
        })),
      setAdultsOnly: (value) => set({ adultsOnly: value }),
      toggleExtra: (extra) =>
        set((state) => ({
          extras: state.extras.includes(extra)
            ? state.extras.filter((e) => e !== extra)
            : [...state.extras, extra],
        })),
      setWeddingInfo: (info) =>
        set((state) => ({
          weddingInfo: { ...state.weddingInfo, ...info },
        })),
      resetStore: () =>
        set({
          plan: null,
          animation: "",
          theme: "Amalfi",
          modules: [],
          primaryLanguage: "fr",
          languages: [],
          adultsOnly: false,
          extras: [],
          emailExists: false,
          weddingInfo: DEFAULT_WEDDING_INFO,
        }),
    }),
    {
      name: "order-store-v2",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const selectTotalPrice = (state: OrderState) =>
  computeOrderTotal({
    plan: state.plan,
    modules: state.modules,
    languages: state.languages,
    extras: state.extras,
  }) ?? 0;
