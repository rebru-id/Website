// src/lib/supabase/service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase client dengan SERVICE_ROLE key — membypass RLS SEPENUHNYA.
//
// ⚠️ PERINGATAN KERAS — BACA SEBELUM PAKAI:
//   - File ini HANYA boleh diimpor dari kode yang jalan di SERVER:
//       Route Handler (src/app/api/**/route.ts), Server Action, atau
//       Server Component TANPA "use client".
//   - JANGAN PERNAH import file ini dari komponen "use client", dari file
//     yang di-import balik oleh komponen client, atau dari mana pun yang
//     bisa ikut ter-bundle ke JavaScript yang dikirim ke browser.
//   - Kalau SUPABASE_SERVICE_ROLE_KEY sampai bocor ke bundle client, itu
//     setara membagikan akses penuh ke SELURUH database (read+write semua
//     tabel, tanpa terkecuali) ke siapa pun yang buka DevTools.
//
// KENAPA INI ADA:
//   Operasi "auto-generate stop berikutnya" (dipicu saat collector
//   menyelesaikan stop) butuh baca SEMUA collector (untuk memilih siapa
//   kebagian siklus berikutnya) dan insert rute/stop untuk collector LAIN.
//   Ini privilege tingkat admin yang SENGAJA tidak dibuka ke sesi login
//   collector biasa (lihat RLS policy collector_team/collection_routes/
//   collection_stops) — jadi operasinya dipindah ke sini, jalan di server,
//   SETELAH identitas pemanggil diverifikasi lewat sesi cookie biasa
//   (lihat src/app/api/collector/generate-next-stop/route.ts).
//
// ENV VAR YANG DIBUTUHKAN (di .env.local, JANGAN pakai prefix NEXT_PUBLIC_):
//   SUPABASE_SERVICE_ROLE_KEY=...
//   (ambil dari Supabase Dashboard → Settings → API → service_role key)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment variables. " +
        "Cek .env.local — jangan pakai prefix NEXT_PUBLIC_ untuk key ini.",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
