// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Browser Client
// Gunakan di Client Components ("use client")
// ─────────────────────────────────────────────────────────────────────────────

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
