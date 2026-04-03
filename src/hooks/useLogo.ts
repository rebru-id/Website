"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useLogo — returns correct logo path based on current theme
// - dark mode  → /assets/img/logo.png  (putih)
// - light mode → /assets/img/Glogo.png (hijau)
//
// mounted guard mencegah hydration mismatch (server selalu render dark)
// ─────────────────────────────────────────────────────────────────────────────

const LOGO_DARK = "/assets/img/logo.png";
const LOGO_LIGHT = "/assets/img/Glogo.png";

export function useLogo(): string {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return LOGO_DARK; // SSR default
  return resolvedTheme === "light" ? LOGO_LIGHT : LOGO_DARK;
}
