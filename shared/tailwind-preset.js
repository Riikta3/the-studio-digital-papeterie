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
          "card-bg": "#FAF8FC",
          "card-border-start": "#F1EBF6",
          "card-border-end": "#BFB0CF",
          "card-shadow": "#BFB0CF",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
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
      },
      animation: {
        "fade-in-up": "fade-in-up 0.8s ease-out both",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
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
