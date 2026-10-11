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

/**
 * The custom domain the couple is choosing at the options step
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D3). Only read
 * when `extras` contains "custom-domain".
 */
export interface DomainChoice {
  /**
   * What the couple typed, kept as typed: the field normalises on blur only,
   * so a trailing hyphen can still be typed. Readers normalise it
   * (`normalizeLabel`); the server does too, and decides.
   */
  label: string;
  /** « Je choisirai plus tard »: the name is chosen from the dashboard. */
  later: boolean;
  /**
   * Years of registration, from `domainYearsFor` — for the running total
   * only. The store holds no wedding date, just a translated month label, so
   * the pages that have the localised months compute it (`useDomainYears`).
   * The server computes its own before charging.
   */
  years: number;
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
  domain: DomainChoice;
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
  setDomain: (domain: Partial<DomainChoice>) => void;
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
const VALID_THEME_IDS = [
  "ciao-amore",
  "blanc-couture",
  "belle-rive",
  "mare-alta",
  "chateau-royal",
  "cabo-verde",
];

/**
 * Plan ids the studio can price. Mirrors `PLAN_PRICES` in `lib/pricing.ts`,
 * kept as a literal list so the store stays free of that import cycle.
 */
const VALID_PLAN_IDS: string[] = ["signature", "sur-mesure", "prestige"];

export const DEFAULT_DOMAIN: DomainChoice = { label: "", later: false, years: 1 };

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
      domain: DEFAULT_DOMAIN,
      /*
       * Picking an offer starts a new order, so the previous one stops being
       * "just completed".
       *
       * `completedAt` is persisted and nothing used to clear it. A couple who
       * bought once and came back to buy again — a second invitation, or
       * simply a new test — carried the flag forever, and the checkout showed
       * them "Votre commande est finalisée" over a basket they had just
       * filled. Worse, the stale `paymentIntentId` went back to
       * /api/create-payment-intent, which found that intent `succeeded` and
       * answered 409 "Cette commande a déjà été réglée" — on an order that
       * had never been paid for.
       *
       * Cleared here rather than in `resetStore` because this is the single
       * door every order goes through: /studio/start cannot be passed without
       * choosing a plan.
       */
      setPlan: (plan) => set({ plan, completedAt: null }),
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
      setDomain: (domain) =>
        set((state) => ({ domain: { ...state.domain, ...domain } })),
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
          domain: DEFAULT_DOMAIN,
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
          domain: DEFAULT_DOMAIN,
          completedAt: null,
        }),
    }),
    {
      name: "order-store-v2",
      version: 4,
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

        /*
         * v3 — clear a `completedAt` left over from an order that finished
         * before `setPlan` learned to reset it.
         *
         * The flag is persisted, so the fix that stops it being stranded does
         * nothing for a browser that is already carrying one: the couple would
         * keep seeing "Votre commande est finalisée" over a fresh basket, and
         * the checkout would keep refusing the order with "Cette commande a
         * déjà été réglée". A version bump is what reaches those browsers
         * without asking anyone to clear site data by hand.
         *
         * Only the flag is dropped. A basket in progress survives, because
         * this must not empty the cart of someone mid-purchase.
         */
        if (version < 3) {
          state.completedAt = null;
        }

        /*
         * v4 — the custom domain's choice (`domain`). A basket from before it
         * gets the default: no name yet, so the options panel pre-fills one,
         * and one year until the page that knows the wedding date recomputes
         * it.
         */
        if (version < 4 || !state.domain) {
          state.domain = { ...DEFAULT_DOMAIN };
        }

        return state as OrderState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/**
 * The running total the studio shows, from the same rules the server charges
 * with (`computeOrderTotal`).
 *
 * The languages go in default-first, as the checkout sends them: the rule
 * bills every entry after the first, so passing only the paid extras (as this
 * did) showed 15 € less per extra language than the payment route charged.
 */
export const selectTotalPrice = (state: OrderState) =>
  computeOrderTotal({
    plan: state.plan,
    modules: state.modules,
    languages: [
      state.primaryLanguage,
      ...state.languages.filter((code) => code !== state.primaryLanguage),
    ],
    extras: state.extras,
    domainYears: state.domain.years,
  }) ?? 0;
