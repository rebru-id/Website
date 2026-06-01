// src/lib/supabase/client.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase Browser Client — TRUE SINGLETON
//
// MASALAH YANG DISELESAIKAN:
//   createBrowserClient() dari @supabase/ssr membuat GoTrueClient baru
//   setiap kali dipanggil, meskipun URL dan key-nya sama.
//   Jika dipanggil dari dua tempat berbeda (supabase-collector.ts dan
//   AuthModalContext.tsx), browser akan punya dua GoTrueClient yang
//   berebut storage key yang sama → "Multiple GoTrueClient instances" warning
//   → undefined behavior pada concurrent auth operations.
//
// SOLUSI:
//   Module-level variable `_client` menyimpan instance pertama.
//   Semua pemanggil berikutnya mendapat instance yang sama.
//   Konsisten dengan pattern singleton di supabase-collector.ts.
//
// USAGE (tidak berubah — backward compatible):
//   import { createClient } from "@/lib/supabase/client";
//   const supabase = createClient(); // selalu return instance yang sama
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";

// Module-level singleton — null sampai pertama kali diinisialisasi
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}
