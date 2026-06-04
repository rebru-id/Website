// src/lib/supabase/client.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIX: Singleton pattern untuk mencegah "Multiple GoTrueClient instances"
//
// MASALAH LAMA:
//   AuthModal.tsx line 44:        const supabase = createClient()
//   AuthModalContext.tsx line 43: const supabase = createClient()
//   → Dua module masing-masing memanggil createClient() saat di-import
//   → Dua GoTrueClient terpisah berjalan bersamaan di browser yang sama
//   → Race condition pada auth state: session bisa flicker/tidak konsisten
//   → Warning: "Multiple GoTrueClient instances detected"
//
// SOLUSI:
//   Satu module-level variable (_client) yang di-share semua caller.
//   Semua file yang import { createClient } dari path ini otomatis
//   mendapat instance yang sama — tidak perlu ubah import di AuthModal
//   atau AuthModalContext.
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";

type SupabaseClient = ReturnType<typeof createBrowserClient>;

// Singleton — satu instance untuk seluruh lifetime browser session
let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}
