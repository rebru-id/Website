import type { Config } from "tailwindcss";

const config: Config = {
  // next-themes pakai data-theme attribute
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // ── Safelist — class yang wajib dikompilasi meski tidak terdeteksi di content
  // Diperlukan untuk CVA-based button variants yang didefinisikan di globals.css
  safelist: [
    "btn",
    "btn-primary",
    "btn-ghost",
    "btn-ghost-dark",
    "btn-green",
    "btn-md",
    "btn-sm",
    // ContactPackagesSection package tier CTAs
    "btn-pkg-kontributor",
    "btn-pkg-dampak",
    "btn-pkg-strategis",
    // rounded-pill used widely via string interpolation
    "rounded-pill",
  ],

  theme: {
    extend: {
      // ── Color system — semua via CSS variable ──────────────────────────────
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          surface: "var(--bg-surface)",
          card: "var(--bg-card)",
          elevated: "var(--bg-elevated)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
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
        border: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        gold: "var(--gold)",
        amber: "var(--amber)",
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },

      // ── Fluid font sizes — clamp() native di Tailwind ─────────────────────
      fontSize: {
        "fluid-hero": ["clamp(3.2rem, 7vw, 6.5rem)", { lineHeight: "1.0" }],
        "fluid-display": ["clamp(2.4rem, 4.5vw, 4rem)", { lineHeight: "1.1" }],
        "fluid-title": ["clamp(2rem, 4vw, 3.2rem)", { lineHeight: "1.2" }],
        "fluid-lg": ["clamp(1.2rem, 2vw, 1.5rem)", { lineHeight: "1.4" }],
      },

      // ── Spacing & radius ───────────────────────────────────────────────────
      // Note: these EXTEND (not replace) Tailwind's default scale.
      // Tailwind defaults (none, sm, DEFAULT, md, lg, xl, 2xl, 3xl, full)
      // remain available. We add project-specific aliases on top.
      borderRadius: {
        sm: "4px", // → rounded-sm  (overrides Tailwind's 2px default)
        md: "10px", // → rounded-md  (overrides Tailwind's 6px default)
        lg: "20px", // → rounded-lg  (overrides Tailwind's 8px default)
        pill: "9999px", // → rounded-pill (new — used across all components)
      },

      // ── Z-index system (documented) ────────────────────────────────────────
      // z-10  → base content
      // z-20  → section overlap
      // z-30  → sticky elements
      // z-40  → drawer / sidebar
      // z-50  → navbar
      // z-60  → modal
      // z-[9000] → grain overlay (always on top, intentional)

      // ── Transitions ───────────────────────────────────────────────────────
      transitionDuration: {
        "400": "400ms",
      },

      // ── Animations ────────────────────────────────────────────────────────
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
          "0%": { opacity: "0", transform: "translateY(100px) translateX(0)" },
          "20%": { opacity: "0.6" },
          "80%": { opacity: "0.3" },
          "100%": {
            opacity: "0",
            transform: "translateY(-200px) translateX(var(--drift, 40px))",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
