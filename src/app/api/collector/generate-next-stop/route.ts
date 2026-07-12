// src/app/api/collector/generate-next-stop/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// OPSI B — Route Handler untuk auto-generate stop berikutnya.
//
// KENAPA ENDPOINT INI ADA:
//   Operasi "pilih collector untuk siklus berikutnya lalu insert rute/stop
//   baru" butuh baca SEMUA collector dan bisa insert data untuk collector
//   LAIN (bukan cuma diri sendiri) — privilege yang sengaja TIDAK dibuka ke
//   sesi login collector biasa lewat RLS (lihat roadmap-rls-hardening.md,
//   FASE R2/R4). Endpoint ini menjalankan operasi itu di server dengan
//   service_role (bypass RLS), TAPI HANYA SETELAH memverifikasi pemanggil
//   benar-benar collector aktif yang sedang login — verifikasi ini pakai
//   client biasa (cookie-based, tunduk RLS penuh) supaya tidak bisa
//   dipalsukan dari luar.
//
// ALUR KEAMANAN (WAJIB, jangan dihapus salah satu langkahnya):
//   1. Ambil sesi login dari cookie — kalau tidak ada, tolak (401).
//   2. Cek email sesi ini benar ada di collector_team DAN statusnya aktif
//      — kalau tidak, tolak (403). Ini pakai client biasa (RLS berlaku),
//      jadi otomatis konsisten dengan kebijakan collector_read_own_team_row.
//   3. Baru jalankan generateNextStop() pakai service_role client.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateNextStop } from "@/lib/supabase-collector";
import { reportError } from "@/lib/report-error";

export async function POST(req: Request) {
  // ── 1. Verifikasi sesi login via cookie ──────────────────────────────────
  const supabaseServer = await createServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Pastikan email ini benar collector AKTIF ──────────────────────────
  // Query ini tunduk RLS biasa (collector_read_own_team_row) — kalau email
  // sesi ini bukan collector, atau statusnya bukan "active", baris ini
  // tidak akan ketemu sama sekali.
  const { data: collector } = await supabaseServer
    .from("collector_team")
    .select("id, status")
    .eq("email", user.email)
    .maybeSingle();

  if (!collector || collector.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 3. Validasi payload ───────────────────────────────────────────────────
  let body: {
    partnerId?: string;
    completionDate?: string;
    lastCollectorId?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { partnerId, completionDate, lastCollectorId } = body;
  if (!partnerId || !completionDate) {
    return NextResponse.json(
      { error: "partnerId dan completionDate wajib diisi" },
      { status: 400 },
    );
  }

  // ── 4. Jalankan operasi privileged pakai service_role client ─────────────
  // ── 4. Jalankan operasi privileged pakai service_role client ─────────────
  try {
    const serviceClient = createServiceClient();
    await generateNextStop(
      partnerId,
      completionDate,
      lastCollectorId ?? null,
      serviceClient,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    reportError("api.collector.generate-next-stop", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
