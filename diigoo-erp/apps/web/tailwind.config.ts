import type { Config } from "tailwindcss";

/**
 * Design tokens ported 1:1 from the Diigoo Tech ERP Architecture document.
 * Palette, radii and type scale mirror the source HTML so the product
 * looks like a native continuation of the reference document.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand + chart palette — fixed in both themes.
        navy: {
          DEFAULT: "#334155",
          800: "#3E4D63",
          700: "#4A5970",
        },
        orange: {
          DEFAULT: "#004680",
          dark: "#00365E",
        },
        silver: "#C0C8D8",
        teal: "#0D9488",
        blue: "#2563EB",
        purple: "#7C3AED",
        green: "#16A34A",
        amber: "#D97706",
        coral: "#DC2626",
        // Semantic surfaces + text — flip via CSS variables under `.dark`.
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          2: "rgb(var(--ink-2) / <alpha-value>)",
          3: "rgb(var(--ink-3) / <alpha-value>)",
        },
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        subtle: "rgb(var(--subtle) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "1.5" }],
        xs: ["11px", { lineHeight: "1.5" }],
        sm: ["12px", { lineHeight: "1.55" }],
        base: ["13px", { lineHeight: "1.6" }],
        md: ["14px", { lineHeight: "1.6" }],
        lg: ["16px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.4" }],
        "2xl": ["26px", { lineHeight: "1.25" }],
        "3xl": ["32px", { lineHeight: "1.2" }],
        "4xl": ["42px", { lineHeight: "1.15" }],
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        lg: "10px",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,.08)",
        bar: "0 2px 12px rgba(0,0,0,.25)",
        pop: "0 8px 28px rgba(17,24,39,.16)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in .18s ease-out",
        "slide-in": "slide-in .22s cubic-bezier(.16,1,.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;
