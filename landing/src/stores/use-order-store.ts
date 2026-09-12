import { create } from "zustand";
import { persist } from "zustand/middleware";

import { computeOrderTotal } from "@/lib/pricing";

/** Ids match `Pricing.plans` in the message files and `PLAN_PRICES`. */
export type PlanType = "signature" | "sur-mesure" | "prestige" | null;

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
  /**
   * When the last order was provisioned, or null if none was.
   *
   * Survives `completeOrder()` clearing the basket so the checkout can tell
   * "this couple just bought" apart from "this couple has not started yet" —
   * the two look identical once the store is empty.
   */
  completedAt: number | null;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  emailExists: boolean;
  setEmailExists: (value: boolean) => void;

  setPlan: (plan: PlanType) => void;
  setAnimation: (animation: string) => void;
  setTheme: (theme: string) => void;
  toggleModule: (module: string) => void;
  /** Replaces the whole module selection (used by the home theme dialog). */
  setModules: (modules: string[]) => void;
  setPrimaryLanguage: (code: string) => void;
  toggleLanguage: (code: string) => void;
  setAdultsOnly: (value: boolean) => void;
  toggleExtra: (extra: string) => void;
  setWeddingInfo: (info: Partial<WeddingInfo>) => void;
  /** Clears the basket and records that an order was provisioned. */
  completeOrder: () => void;
  resetStore: () => void;
}

// Prices live in lib/pricing.ts so the server can charge exactly what the
// client displays. Re-exported here to keep existing imports working.
export { EXTRA_PRICES, LANGUAGE_PRICE } from "@/lib/pricing";

/**
 * Theme ids the configurator can actually render. Kept as a plain list rather
 * than importing the catalogue so the store stays free of React/component
 * imports; `studio/themes.ts` is the source of truth for the cards themselves.
 */
const VALID_THEME_IDS = ["ciao-amore", "blanc-couture", "belle-rive"];

/**
 * Plan ids the studio can price. Mirrors `PLAN_PRICES` in `lib/pricing.ts`,
 * kept as a literal list so the store stays free of that import cycle.
 */
const VALID_PLAN_IDS: string[] = ["signature", "sur-mesure", "prestige"];

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
      theme: "",
      modules: [],
      primaryLanguage: "fr",
      languages: [],
      adultsOnly: false,
      extras: [],
      completedAt: null,
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
      setModules: (modules) => set({ modules }),
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
      completeOrder: () =>
        set({
          plan: null,
          animation: "",
          theme: "",
          modules: [],
          primaryLanguage: "fr",
          languages: [],
          adultsOnly: false,
          extras: [],
          emailExists: false,
          weddingInfo: DEFAULT_WEDDING_INFO,
          // Outlives the basket on purpose: it is what tells the checkout to
          // show "your order is complete" instead of a blank configurator when
          // the couple navigates back from the dashboard.
          completedAt: Date.now(),
        }),
      resetStore: () =>
        set({
          plan: null,
          animation: "",
          theme: "",
          modules: [],
          primaryLanguage: "fr",
          languages: [],
          adultsOnly: false,
          extras: [],
          emailExists: false,
          weddingInfo: DEFAULT_WEDDING_INFO,
          completedAt: null,
        }),
    }),
    {
      name: "order-store-v2",
      version: 2,
      // Each bump clears values that name something the app no longer renders.
      // A stale id is worse than an empty one: the card comes back unselected
      // while the guard still waves the user through, and here the price shown
      // would not match any offer on the page.
      //
      //  v1 — theme ids from the retired catalogue ("Amalfi", "theme-*").
      //  v2 — plan ids from the two-tier pricing ("experience", "premium"),
      //       replaced by the homepage's "signature"/"sur-mesure"/"prestige".
      migrate: (persisted, version) => {
        const state = { ...(persisted as Partial<OrderState>) };

        if (version < 1 && state.theme && !VALID_THEME_IDS.includes(state.theme)) {
          state.theme = "";
        }

        if (
          version < 2 &&
          state.plan &&
          !VALID_PLAN_IDS.includes(state.plan)
        ) {
          // Cleared rather than mapped: the old tiers priced differently, so
          // guessing an equivalent would quietly change what the couple pays.
          // An empty plan re-runs the preselect on /studio/start.
          state.plan = null;
        }

        return state as OrderState;
      },
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
