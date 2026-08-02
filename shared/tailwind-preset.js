/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        studio: {
          violet: "#4B3F72",
          lavande: "#B7AFD1",
          jaune: "#F2E5AA",
          pourpre: "#8C6E8C",
          beige: "#E6DCC6",
          beurre: "#FFF9D6",
          creme: "#FFFDE8",
          "violet-clair": "#7560B1",
          "violet-fonce": "#584984",
          "card-bg": "#FAF8FC",
          "card-selected": "#F2EEF8",
          "card-border-start": "#F1EBF6",
          "card-border-end": "#BFB0CF",
          "card-shadow": "#BFB0CF",
        },
        // "Mediterranean Classy" invitation theme — see
        // landing/src/components/invitation/theme-mediterranean-classy/tokens.ts
        mc: {
          green: "#1F592A",
          olive: "#42452A",
          brown: "#5D4B35",
          cream: "#F5F2EB",
          beige: "#EADCCD",
          // Surfaces sampled off the mock: textured paper (arch cards) and
          // the plain card body used by FAQ / accommodation tiles.
          paper: "#EFEAE3",
          card: "#F8F6F3",
          sage: "#BABCAB",
          "warm-gray": "#C7BDB0",
          border: "#C9B8A8",
          ink: "#181818",
        },
      },
      boxShadow: {
        // "Ombre violette" from the studio card spec: 0 22px 53.9px #BFB0CF @ 24%
        "studio-card": "0 22px 53.9px 0 rgba(191, 176, 207, 0.24)",
        // "Mediterranean Classy" shadows (section 03 of the design system)
        "mc-card": "0 8px 23.2px 0 rgba(229, 213, 185, 0.33)",
        "mc-card-dark": "0 8px 23.2px 0 rgba(159, 132, 85, 0.33)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        // "Mediterranean Classy" — loaded by the theme, not the root layout.
        "mc-script": ["var(--font-mc-script)", "cursive"],
        "mc-serif": ["var(--font-mc-serif)", "serif"],
        "mc-numeric": ["var(--font-mc-numeric)", "serif"],
        "mc-sans": ["var(--font-mc-sans)", "sans-serif"],
      },
      // Type scale from the "Typographie" design-system reference:
      // H1-H3 use font-heading (Libre Caslon Display), H4-H5/p use
      // font-body (Urbanist) with the matching weight baked in.
      // Sizes fluidly scale up on wider viewports via clamp() instead of
      // fixed px, keeping the same ratios defined in the reference (54/40/32/16/14/14).
      fontSize: {
        h1: [
          "clamp(2.5rem, 2rem + 2.2vw, 3.375rem)",
          { lineHeight: "1.1", fontWeight: "400" },
        ], // 40px → 54px
        h2: [
          "clamp(1.875rem, 1.5rem + 1.6vw, 2.5rem)",
          { lineHeight: "1.15", fontWeight: "400" },
        ], // 30px → 40px
        h3: [
          "clamp(1.5rem, 1.25rem + 1.1vw, 2rem)",
          { lineHeight: "1.2", fontWeight: "400" },
        ], // 24px → 32px
        h4: [
          "clamp(0.9375rem, 0.875rem + 0.25vw, 1rem)",
          { lineHeight: "1.4", fontWeight: "600" },
        ], // 15px → 16px, SemiBold
        h5: [
          "clamp(0.8125rem, 0.75rem + 0.25vw, 0.875rem)",
          { lineHeight: "1.4", fontWeight: "400" },
        ], // 13px → 14px, Regular
        "body-p": [
          "clamp(0.8125rem, 0.75rem + 0.25vw, 0.875rem)",
          { lineHeight: "1.5", fontWeight: "300" },
        ], // 13px → 14px, Light
      },
      letterSpacing: {
        supertitle: "0.2em",
        luxe: "0.12em",
      },
      lineHeight: {
        luxury: "1.35",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
        // Scroll affordance: a slow bob, not a bounce.
        "scroll-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s ease-out both",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        marquee: "marquee 12s linear infinite",
        "scroll-bob": "scroll-bob 2.4s ease-in-out infinite",
      },
      backgroundImage: {
        noise:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.06'/></svg>\")",
        "card-border-gradient":
          "linear-gradient(180deg, #F1EBF6 0%, #BFB0CF 100%)",
      },
    },
  },
  plugins: [],
};
