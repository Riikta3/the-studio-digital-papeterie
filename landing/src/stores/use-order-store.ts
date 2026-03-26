// landing/src/stores/use-order-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  animation: string;        // e.g. "envelope-classic"
  theme: string;            // e.g. "theme-floral"
  modules: string[];
  primaryLanguage: string;  // e.g. "fr"
  languages: string[];      // extra language codes e.g. ["en", "es"]
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
}

export const EXTRA_PRICES: Record<string, number> = {
  "custom-music": 10,
  "custom-illustration": 45,
  "animated-video": 55,
  "custom-domain": 65,
};

const LANGUAGE_PRICE = 15;

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      plan: null,
      animation: "",
      theme: "theme-floral",
      modules: [],
      primaryLanguage: "fr",
      languages: [],
      adultsOnly: false,
      extras: [],
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      emailExists: false,
      setEmailExists: (value) => set({ emailExists: value }),
      weddingInfo: {
        partner1: "",
        partner2: "",
        day: "",
        month: "",
        year: "",
        venue: "",
        email: "",
        password: "",
      },
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
    }),
    {
      name: "order-store-v2",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const selectTotalPrice = (state: OrderState) => {
  const basePrice =
    state.plan === "experience" ? 175 : state.plan === "premium" ? 575 : 0;

  const moduleSurcharge =
    state.plan === "experience"
      ? Math.max(0, state.modules.length - 4) * 5
      : 0;

  const languagesTotal = state.languages.length * LANGUAGE_PRICE;

  const extrasTotal = state.extras.reduce(
    (sum, extra) => sum + (EXTRA_PRICES[extra] ?? 0),
    0
  );

  return basePrice + moduleSurcharge + languagesTotal + extrasTotal;
};
