// src/hooks/useLogo.ts
"use client";

import { useTheme } from "next-themes";

// ─────────────────────────────────────────────────────────────────────────────
// useLogo — returns correct logo path based on current theme
// - dark mode  → /assets/img/logo.png  (putih)
// - light mode → /assets/img/Glogo.png (hijau)
//
// FIX: Hapus mounted guard yang menyebabkan Navbar/Footer invisible
// selama ~100–400ms di setiap page load.
//
// SEBELUMNYA (bermasalah):
//   const [mounted, setMounted] = useState(false);
//   useEffect(() => setMounted(true), []);
//   if (!mounted) return null;  ← navbar kosong sampai effect jalan!
//
// SEKARANG (aman):
//   - resolvedTheme === undefined saat SSR → fallback ke LOGO_DARK
//   - Default dark logo identik dengan tema default app (tidak ada flash)
//   - Jika user di light mode: satu re-render saat resolvedTheme resolve → wajar
//   - Return type: string (tidak pernah null) → caller tidak perlu null check
// ─────────────────────────────────────────────────────────────────────────────

const LOGO_DARK = "/assets/img/logo.png";
const LOGO_LIGHT = "/assets/img/Glogo.png";

export function useLogo(): string {
  const { resolvedTheme } = useTheme();
  // resolvedTheme undefined (SSR/hydration) → pakai LOGO_DARK sebagai safe default.
  // Aman karena dark adalah default theme — tidak ada flash untuk dark mode users.
  // Light mode users: logo swap dari dark→light terjadi setelah hydration (sangat cepat, tidak terlihat).
  return resolvedTheme === "light" ? LOGO_LIGHT : LOGO_DARK;
}
