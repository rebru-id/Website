"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Sun SVG — light mode icon
// ─────────────────────────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5"  />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.93"  y1="4.93"  x2="6.84"  y2="6.84"  />
      <line x1="17.16" y1="17.16" x2="19.07" y2="19.07" />
      <line x1="4.93"  y1="19.07" x2="6.84"  y2="17.16" />
      <line x1="17.16" y1="6.84"  x2="19.07" y2="4.93"  />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Moon SVG — dark mode icon
// ─────────────────────────────────────────────────────────────────────────────
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggle
// — Menampilkan Sun saat dark mode (klik → pindah ke light)
// — Menampilkan Moon saat light mode (klik → pindah ke dark)
// — Ukuran 26×26px, sangat minimalis, circle border
// ─────────────────────────────────────────────────────────────────────────────
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hindari hydration mismatch — hanya render setelah client mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder dengan ukuran sama agar layout tidak shift
    return (
      <div
        className="theme-toggle opacity-0 pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
