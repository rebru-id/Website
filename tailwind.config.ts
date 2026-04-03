import type { Config } from "tailwindcss";

const config: Config = {
  // ── next-themes pakai class strategy ──────────────────────────────────────
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Semua warna pakai CSS variable → otomatis ganti saat mode berubah ──
      colors: {
        // Background
        bg: {
          primary: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          card: "var(--bg-card)",
          elevated: "var(--bg-elevated)",
        },
        // Text
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        // Accent — tetap sama di kedua mode
        coffee: {
          latte: "var(--coffee-latte)",
          warm: "var(--coffee-warm)",
          mid: "var(--coffee-mid)",
        },
        forest: {
          sage: "var(--forest-sage)",
          moss: "var(--forest-moss)",
          leaf: "var(--forest-leaf)",
          dark: "var(--forest-dark)",
          mist: "var(--forest-mist)",
        },
        // Border
        border: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        // Legacy aliases — agar komponen lama tidak perlu diubah semua
        "coffee-deep": "var(--bg-primary)",
        "coffee-dark": "var(--bg-surface)",
        "coffee-foam": "var(--text-primary)",
        "coffee-cream": "var(--text-primary)",
        ink: "var(--text-primary)",
        "ink-dim": "var(--text-secondary)",
        "ink-ghost": "var(--text-muted)",
        // Accents statis
        gold: "#c8a84b",
        amber: "#d4783a",
      },

      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },

      borderRadius: {
        sm: "4px",
        md: "10px",
        lg: "20px",
        pill: "9999px",
      },

      transitionDuration: {
        "400": "400ms",
      },

      animation: {
        "fade-up": "fadeUp 0.8s ease forwards",
        "fade-in": "fadeIn 0.6s ease forwards",
        "ring-float": "ringFloat 8s ease-in-out infinite",
        "scroll-pulse": "scrollPulse 2s ease-in-out infinite",
        particle: "particleDrift 12s ease-in-out infinite",
      },

      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        ringFloat: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-16px) rotate(3deg)" },
        },
        scrollPulse: {
          "0%, 100%": { opacity: "0.4", transform: "scaleY(1)" },
          "50%": { opacity: "1", transform: "scaleY(0.7)" },
        },
        particleDrift: {
          "0%": { opacity: "0", transform: "translateY(100px)" },
          "20%": { opacity: "0.6" },
          "80%": { opacity: "0.3" },
          "100%": { opacity: "0", transform: "translateY(-200px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
