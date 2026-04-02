import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Coffee palette
        coffee: {
          deep:   "#1a0f0a",
          dark:   "#2d1810",
          mid:    "#4a2c1a",
          warm:   "#6b3f28",
          latte:  "#c4956a",
          cream:  "#e8d5b7",
          foam:   "#f5efe6",
        },
        // ── Green palette
        forest: {
          deep:   "#0d1f0e",
          dark:   "#1a3a1b",
          moss:   "#2d5a2e",
          leaf:   "#4a7c4e",
          sage:   "#7aab7e",
          mist:   "#c8dfc9",
        },
        // ── Ink / text
        ink: {
          DEFAULT: "#f0ebe3",
          dim:     "#b8a898",
          ghost:   "#6b5a4a",
        },
        // ── Accents
        gold:   "#c8a84b",
        amber:  "#d4783a",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body:    ["var(--font-dm-sans)", "sans-serif"],
        mono:    ["var(--font-space-mono)", "monospace"],
      },
      borderRadius: {
        sm:   "4px",
        md:   "10px",
        lg:   "20px",
        pill: "9999px",
      },
      animation: {
        "fade-up":      "fadeUp 0.8s ease forwards",
        "fade-in":      "fadeIn 0.6s ease forwards",
        "ring-float":   "ringFloat 8s ease-in-out infinite",
        "scroll-pulse": "scrollPulse 2s ease-in-out infinite",
        "particle":     "particleDrift 12s ease-in-out infinite",
        "counter-in":   "counterIn 0.4s ease forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        ringFloat: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%":       { transform: "translateY(-16px) rotate(3deg)" },
        },
        scrollPulse: {
          "0%, 100%": { opacity: "0.4", transform: "scaleY(1)" },
          "50%":       { opacity: "1",   transform: "scaleY(0.7)" },
        },
        particleDrift: {
          "0%":   { opacity: "0",   transform: "translateY(100px)" },
          "20%":  { opacity: "0.6" },
          "80%":  { opacity: "0.3" },
          "100%": { opacity: "0",   transform: "translateY(-200px)" },
        },
        counterIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
