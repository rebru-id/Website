// src/lib/supabase/anon.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase client TANPA cookies — untuk public data fetch (products, blog, dll.)
//
// KENAPA file ini ada?
//   Server client (@/lib/supabase/server) memanggil cookies() dari next/headers.
//   cookies() adalah Dynamic API — Next.js tidak bisa pre-render halaman yang
//   memanggilnya secara static (generateStaticParams akan crash dengan
//   DYNAMIC_SERVER_USAGE).
//
//   Products adalah public data — tidak butuh RLS/auth sama sekali.
//   Cukup pakai anon key langsung tanpa cookies.
//
// KAPAN pakai ini vs server client?
//   ✅ anon.ts    → public reads: products, blog posts, catalog
//   ✅ server.ts  → auth-gated reads: orders, dashboard, user data
// ─────────────────────────────────────────────────────────────────────────────

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client tanpa cookies — aman dipakai di generateStaticParams,
 * generateMetadata, dan semua server-side public fetch.
 *
 * Singleton: modul-level variable tidak di-recreate tiap request.
 */
export const supabaseAnon = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Nonaktifkan semua session/cookie handling — tidak diperlukan untuk public reads
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
