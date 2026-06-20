// src/hooks/useLogo.ts
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useLogo — returns correct logo path based on current theme
// - dark mode  → /assets/img/logo.png  (putih)
// - light mode → /assets/img/Glogo.png (hijau)
//
// RIWAYAT FIX:
//
// Versi asli (bermasalah):
//   if (!mounted) return null
//   → Navbar/Footer menghilang selama ~100–400ms setiap page load
//
// Fix pertama saya (salah):
//   Hapus mounted guard, langsung return berdasarkan resolvedTheme
//   → Hydration error: server render logo.png, client light-mode render Glogo.png
//   → React deteksi srcSet mismatch → "A tree hydrated but some attributes didn't match"
//
// Fix final (benar):
//   Pertahankan mounted guard, tapi ganti return value dari null → LOGO_DARK
//
//   Alasannya:
//   - Server (SSR):          mounted=false → return LOGO_DARK (logo.png)  ✓
//   - Client, sebelum mount: mounted=false → return LOGO_DARK (logo.png)  ✓ ← sama dengan server!
//   - Client, setelah mount, dark mode:  return LOGO_DARK                 ← zero flicker
//   - Client, setelah mount, light mode: return LOGO_LIGHT                ← satu re-render kecil
//
//   Server dan client initial render selalu sama (LOGO_DARK) → TIDAK ADA hydration mismatch.
//   Return type: string (tidak pernah null) → Navbar/Footer tidak perlu null check.
// ─────────────────────────────────────────────────────────────────────────────

const LOGO_DARK = "/assets/img/logo.png";
const LOGO_LIGHT = "/assets/img/Glogo.png";

export function useLogo(): string {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Sebelum mount: kembalikan LOGO_DARK sebagai safe default
  // — identik dengan output SSR → tidak ada hydration mismatch
  if (!mounted) return LOGO_DARK;

  return resolvedTheme === "light" ? LOGO_LIGHT : LOGO_DARK;
}
