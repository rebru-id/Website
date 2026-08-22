// src/lib/supabase-collector.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared lib untuk OperationalSection (admin) dan CollectorPage (collector).
//
// Pola konsisten dengan supabase-partner.ts yang sudah ada:
//   - Setiap fungsi throw error → komponen yang handle try/catch
//   - Tipe diekspor agar bisa dipakai di kedua UI
//   - Tidak ada state management di sini — hanya pure data functions
//
// Dependency utama:
//   - partner_applications (existing) → fetchActivePartners()
//   - collection_routes (new)
//   - collection_stops (new)
//   - collector_team (new)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "./supabase/client";
import { reportError } from "./report-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  todayWITA,
  getMondayWITA,
  addDays,
  formatDate,
  parseLocalDate,
  formatDisplayDate,
  toLocalTimeStr,
} from "../utils/date";
import {
  pickCollectorForPartner,
  computeDueDate,
  computeUrgentQueue,
} from "./scheduling";
import { estimateKgFromVolumeLimbah } from "../utils/volume-limbah";
const supabase = createClient();

// FASE 4 — jam default untuk stop yang di-generate otomatis (approve partner
// baru / siklus berikutnya). Partner belum punya kolom preferensi jam sendiri
// di schema saat ini — kalau nanti ditambahkan, ganti baris ini jadi baca
// dari situ.
const DEFAULT_AUTO_SCHEDULED_TIME = "08:00";

// Fix — estimasi kg untuk stop auto-generate SEKARANG memakai fungsi shared
// (satu-satunya sumber kebenaran, juga dipakai OperationalSection.tsx),
// bukan lagi formula midpoint × interval yang sempat dipakai sementara di
// sini dan berbeda dari konvensi yang sudah lama dipakai admin (max, tanpa
// interval). Lihat utils/volume-limbah.ts untuk detail & alasan konvensinya.

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// Partner aktif dari partner_applications — dipakai admin saat membuat stop
export type ActivePartner = {
  id: string;
  organization: string;
  jenis_usaha: string;
  alamat_detail: string | null;
  kecamatan_nama: string | null;
  kota_nama: string | null;
  volume_limbah: string | null;
  pic_name: string | null;
  phone: string | null;
  // Kolom Fase 1
  pickup_interval_days: number;
  last_pickup_date: string | null;
  active_from: string | null; // fallback jika belum pernah dijemput
};

export type CollectorMember = {
  id: string;
  name: string;
  email: string;
  area: string | null;
  truck_plate: string | null;
  initials: string | null;
  status: "active" | "inactive";
};

export type RouteStatus = "pending" | "active" | "done" | "cancelled";
export type StopStatus = "pending" | "done" | "skipped";
export type Condition = "basah" | "kering" | "mix";

/**
 * FASE 3 — status stop TERAKHIR milik satu partner (lintas collector, lintas
 * tanggal). Dipakai isPartnerUrgent() di scheduling.ts untuk menentukan
 * urgent atau tidak. `null` berarti partner belum pernah punya stop sama
 * sekali (baru di-approve).
 */
export type LatestStopInfo = {
  status: StopStatus;
  routeDate: string; // "YYYY-MM-DD", dari collection_routes.route_date
} | null;

// Stop dengan data partner di-embed — dipakai CollectorPage dan MonitorTab
export type StopWithPartner = {
  id: string;
  route_id: string;
  partner_id: string;
  stop_order: number;
  order_number: string | null; // ← "RBR.0001/IX/2025" — tracking ID per penjemputan
  scheduled_time: string | null;
  estimated_kg: number | null;
  status: StopStatus;
  actual_kg: number | null;
  condition: Condition | null;
  skip_reason: string | null;
  completed_at: string | null;
  location_coords: string | null;
  photo_url: string | null;
  notes: string | null;
  // joined dari partner_applications
  partner: Pick<
    ActivePartner,
    "organization" | "jenis_usaha" | "alamat_detail" | "kecamatan_nama"
  >;
};

// Rute dengan stops + info collector — dipakai OperationalSection MonitorTab
export type RouteWithCollector = {
  id: string;
  collector_id: string;
  route_date: string;
  status: RouteStatus;
  total_planned_kg: number | null;
  collector: CollectorMember;
  stops: StopWithPartner[];
  // computed dari stops
  stops_done: number;
  stops_total: number;
  total_actual_kg: number;
};

// Payload update dari collector (CollectorPage → updateStopStatus)
export type StopUpdatePayload = {
  status: "done" | "skipped";
  actual_kg?: number;
  condition?: Condition;
  skip_reason?: string;
  location_coords?: string;
  location_accuracy?: number;
  notes?: string;
  photo_url?: string; // ← URL publik dari Supabase Storage (hasil uploadStopPhoto)
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Fungsi untuk ADMIN (OperationalSection)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ScheduleTab — dropdown "Pilih mitra" saat admin membuat slot manual.
 * Hanya mengambil partner yang statusnya 'active' dari partner_applications.
 *
 * Ini adalah JEMBATAN UTAMA antara PartnerSection dan OperationalSection:
 * Partner yang sudah di-approve di PartnerSection → muncul di sini.
 */
export async function fetchActivePartners(
  client: SupabaseClient = supabase,
): Promise<ActivePartner[]> {
  const { data, error } = await client
    .from("partner_applications")
    .select(
      "id, organization, jenis_usaha, alamat_detail, kecamatan_nama, kota_nama, volume_limbah, pic_name, phone, pickup_interval_days, last_pickup_date, active_from",
    )
    .eq("status", "active")
    .order("organization");

  if (error) throw error;
  return data as ActivePartner[];
}

/**
 * ScheduleTab — ambil semua rute satu minggu (7 hari dari weekStart).
 * Menghasilkan struktur yang bisa langsung dipakai WEEK_DATA di ScheduleTab.
 */
export async function fetchWeekRoutes(
  weekStart: string,
): Promise<RouteWithCollector[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const { data, error } = await supabase
    .from("collection_routes")
    .select(
      `
      id, collector_id, route_date, status, total_planned_kg,
      collector_team (id, name, email, area, truck_plate, initials, status),
      collection_stops (
        id, stop_order, scheduled_time, estimated_kg, status,
        actual_kg, condition, skip_reason, completed_at, notes,
        partner_applications (organization, jenis_usaha, alamat_detail, kecamatan_nama)
      )
    `,
    )
    .gte("route_date", weekStart)
    .lte("route_date", formatDate(weekEnd))
    .order("route_date");

  if (error) throw error;
  return (data ?? []).map(normalizeRoute);
}

/**
 * FASE 4 — versi generik dari fetchTodayRoutes(): ambil rute untuk TANGGAL
 * APA PUN, bukan cuma hari ini. Dibutuhkan generateInitialStop()/
 * generateNextStop() untuk hitung load collector di tanggal target stop
 * yang mau dibuat (yang belum tentu hari ini — bisa besok, minggu depan, dst).
 */
export async function fetchRoutesForDate(
  date: string,
  client: SupabaseClient = supabase,
): Promise<RouteWithCollector[]> {
  const { data, error } = await client
    .from("collection_routes")
    .select(
      `
      id, collector_id, route_date, status, total_planned_kg,
      collector_team (id, name, email, phone, area, truck_plate, initials, status),
      collection_stops (
        id, stop_order, scheduled_time, estimated_kg, status,
        actual_kg, condition, skip_reason, completed_at, location_coords, notes,
        partner_applications (organization, jenis_usaha, alamat_detail, kecamatan_nama)
      )
    `,
    )
    .eq("route_date", date)
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map(normalizeRoute);
}

/**
 * MonitorTab + LogTab — rute hari ini (real-time status collector).
 */
export async function fetchTodayRoutes(): Promise<RouteWithCollector[]> {
  return fetchRoutesForDate(todayWITA());
}

/**
 * LogTab — semua stops minggu ini (Senin–Minggu) lintas collector.
 * Struktur return identik dengan fetchTodayStops agar LogTab tidak perlu tahu perbedaannya.
 */
export async function fetchWeekStops(
  weekStart: string,
): Promise<
  (StopWithPartner & { collector_name: string; route_date: string })[]
> {
  const weekEnd = addDays(weekStart, 6);

  const { data, error } = await supabase
    .from("collection_routes")
    .select(
      `
      route_date,
      collector_team (name),
      collection_stops (
        id, route_id, partner_id, stop_order, scheduled_time,
        estimated_kg, status, actual_kg, condition, skip_reason,
        completed_at, location_coords, notes,
        partner_applications (organization, jenis_usaha, alamat_detail, kecamatan_nama)
      )
    `,
    )
    .gte("route_date", weekStart)
    .lte("route_date", weekEnd);

  if (error) throw new Error(error.message ?? JSON.stringify(error));

  const flat = (data ?? []).flatMap((r: any) =>
    (r.collection_stops ?? []).map((s: any) => ({
      id: s.id,
      route_id: s.route_id,
      partner_id: s.partner_id,
      stop_order: s.stop_order,
      scheduled_time: s.scheduled_time,
      estimated_kg: s.estimated_kg,
      status: s.status,
      actual_kg: s.actual_kg,
      condition: s.condition,
      skip_reason: s.skip_reason,
      completed_at: s.completed_at,
      location_coords: s.location_coords,
      photo_url: null,
      notes: s.notes,
      partner: s.partner_applications,
      collector_name: r.collector_team?.name ?? "—",
      route_date: r.route_date,
    })),
  );

  return flat.sort(
    (a, b) =>
      (b.completed_at ?? "").localeCompare(a.completed_at ?? "") ||
      (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "") ||
      (a.stop_order ?? 0) - (b.stop_order ?? 0),
  );
}

/**
 * LogTab — semua stops hari ini lintas collector, sudah join partner + collector.
 * Dipakai untuk tabel Log & Verifikasi.
 */
export async function fetchTodayStops(): Promise<
  (StopWithPartner & { collector_name: string; route_date: string })[]
> {
  const today = todayWITA();

  // Query dari collection_routes (tabel induk) — filter route_date di sini valid
  // Kemudian embed stops + partner + collector
  const { data, error } = await supabase
    .from("collection_routes")
    .select(
      `
      route_date,
      collector_team (name),
      collection_stops (
        id, route_id, partner_id, stop_order, scheduled_time,
        estimated_kg, status, actual_kg, condition, skip_reason,
        completed_at, location_coords, notes,
        partner_applications (organization, jenis_usaha, alamat_detail, kecamatan_nama)
      )
    `,
    )
    .eq("route_date", today);

  if (error) throw new Error(error.message ?? JSON.stringify(error));

  // Flatten routes → stops, inject collector_name dan route_date
  const flat = (data ?? []).flatMap((r: any) =>
    (r.collection_stops ?? []).map((s: any) => ({
      id: s.id,
      route_id: s.route_id,
      partner_id: s.partner_id,
      stop_order: s.stop_order,
      scheduled_time: s.scheduled_time,
      estimated_kg: s.estimated_kg,
      status: s.status,
      actual_kg: s.actual_kg,
      condition: s.condition,
      skip_reason: s.skip_reason,
      completed_at: s.completed_at,
      location_coords: s.location_coords,
      photo_url: null,
      notes: s.notes,
      partner: s.partner_applications,
      collector_name: r.collector_team?.name ?? "—",
      route_date: r.route_date ?? today,
    })),
  );

  // Sort priority (konsisten di semua consumer):
  // 1. completed_at DESC  → stop yang baru selesai tampil pertama di LogTab
  // 2. scheduled_time ASC → stop pending diurutkan dari jadwal paling awal
  // 3. stop_order ASC     → fallback final jika tidak ada waktu
  return flat.sort((a, b) => {
    if (a.completed_at && b.completed_at) {
      return b.completed_at.localeCompare(a.completed_at); // terbaru duluan
    }
    if (a.completed_at) return -1; // completed sebelum pending
    if (b.completed_at) return 1;
    if (a.scheduled_time && b.scheduled_time) {
      return a.scheduled_time.localeCompare(b.scheduled_time); // paling awal duluan
    }
    return (a.stop_order ?? 0) - (b.stop_order ?? 0);
  });
}

/**
 * TeamTab — statistik per collector (completion rate, kg per stop, dll).
 * Menghitung agregat dari collection_stops + collection_routes.
 */
export async function fetchCollectorStats(): Promise<
  (CollectorMember & {
    completion_rate: number;
    stops_this_week: number;
    total_stops_this_week: number;
    kg_per_stop: number;
    stops_today: number;
    skips_today: number;
  })[]
> {
  const today = todayWITA();
  const weekStart = getMondayWITA(today);

  // Ambil SEMUA anggota tim (aktif maupun tidak) — filter di UI jika perlu
  const { data: members, error: mErr } = await supabase
    .from("collector_team")
    .select("id, name, email, area, truck_plate, initials, status")
    .order("name");

  if (mErr) {
    reportError("supabase-collector.fetchCollectorStats.members", mErr);
    throw mErr;
  }

  // Query routes dulu (filter tanggal di tabel induk) → stops di-embed
  // Ini adalah pendekatan yang benar: filter `.gte/.lte` hanya valid pada tabel utama query
  const { data: routes } = await supabase
    .from("collection_routes")
    .select(
      `
      id, collector_id, route_date,
      collection_stops (status, actual_kg)
    `,
    )
    .gte("route_date", weekStart)
    .lte("route_date", today);

  // routes bisa null jika belum ada rute sama sekali — tidak error, cukup 0 stats

  return (members ?? []).map((m) => {
    const myRoutes = (routes ?? []).filter((r: any) => r.collector_id === m.id);
    const allStops = myRoutes.flatMap(
      (r: any) => (r.collection_stops ?? []) as any[],
    );
    const todayStops = myRoutes
      .filter((r: any) => r.route_date === today)
      .flatMap((r: any) => (r.collection_stops ?? []) as any[]);

    const done = allStops.filter((s) => s.status === "done").length;
    const total = allStops.length;
    const skipsToday = todayStops.filter((s) => s.status === "skipped").length;
    const doneToday = todayStops.filter((s) => s.status === "done").length;
    const totalKg = allStops
      .filter((s) => s.status === "done")
      .reduce((sum: number, s: any) => sum + (s.actual_kg ?? 0), 0);

    return {
      ...(m as CollectorMember),
      completion_rate: total > 0 ? Math.round((done / total) * 100) : 0,
      stops_this_week: done,
      total_stops_this_week: total,
      kg_per_stop: done > 0 ? Math.round((totalKg / done) * 10) / 10 : 0,
      stops_today: doneToday,
      skips_today: skipsToday,
    };
  });
}

/**
 * PERBAIKAN — order_number TIDAK lagi digenerate di sini (JS).
 *
 * Sebelumnya: generateOrderNumber() dipanggil di sini setiap stop baru
 * dibuat — rawan race condition ("SELECT max lalu +1" di JS, bukan atomik),
 * dan nomor tetap terbit meski stop akhirnya di-skip (bukan transaksi
 * valid).
 *
 * Sekarang: order_number dibiarkan NULL saat stop dijadwalkan. Nomor
 * BARU diterbitkan otomatis oleh trigger Postgres
 * (assign_order_number(), lihat migrasi order-number-sequence-fix.sql)
 * tepat saat status berubah menjadi "done" — atomik via SEQUENCE,
 * berlaku dari sesi mana pun (collector maupun admin) tanpa perlu
 * duplikasi logic di banyak tempat.
 */

/**
 * ScheduleTab — admin membuat stop baru (dari modal "Slot manual").
 * partnerIds dipilih dari fetchActivePartners() dropdown.
 */
export async function createRouteWithStops(
  payload: {
    collector_id: string;
    route_date: string;
    stops: {
      partner_id: string;
      stop_order: number;
      scheduled_time: string;
      estimated_kg: number | null;
    }[];
  },
  client: SupabaseClient = supabase,
): Promise<string> {
  // 1. Cek apakah sudah ada route untuk collector + tanggal ini
  //    (unique constraint: collector_id + route_date)
  const { data: existing } = await client
    .from("collection_routes")
    .select("id, total_planned_kg")
    .eq("collector_id", payload.collector_id)
    .eq("route_date", payload.route_date)
    .maybeSingle();

  let routeId: string;

  if (existing) {
    routeId = existing.id;
    const addedKg = payload.stops.reduce(
      (sum, s) => sum + (s.estimated_kg ?? 0),
      0,
    );
    await client
      .from("collection_routes")
      .update({ total_planned_kg: (existing.total_planned_kg ?? 0) + addedKg })
      .eq("id", routeId);
  } else {
    const { data: route, error: rErr } = await client
      .from("collection_routes")
      .insert({
        collector_id: payload.collector_id,
        route_date: payload.route_date,
        status: "pending",
        total_planned_kg: payload.stops.reduce(
          (sum, s) => sum + (s.estimated_kg ?? 0),
          0,
        ),
      })
      .select("id")
      .single();

    if (rErr) throw rErr;
    routeId = route.id;
  }

  const { data: existingStops } = await client
    .from("collection_stops")
    .select("stop_order")
    .eq("route_id", routeId)
    .order("stop_order", { ascending: false })
    .limit(1);

  const nextOrder =
    existingStops && existingStops.length > 0
      ? existingStops[0].stop_order + 1
      : 1;

  // 3. Insert stops dengan stop_order — order_number SENGAJA tidak diisi
  //    di sini (dibiarkan NULL). Nomor baru diterbitkan otomatis oleh
  //    trigger Postgres saat status berubah jadi "done" — lihat
  //    assign_order_number() di migrasi order-number-sequence-fix.sql.
  const stopsToInsert = [];
  for (let i = 0; i < payload.stops.length; i++) {
    const s = payload.stops[i];
    stopsToInsert.push({
      route_id: routeId,
      partner_id: s.partner_id,
      stop_order: nextOrder + i,
      scheduled_time: s.scheduled_time,
      estimated_kg: s.estimated_kg,
      status: "pending",
    });
  }

  const { error: sErr } = await client
    .from("collection_stops")
    .insert(stopsToInsert);

  if (sErr) throw sErr;
  return routeId;
}

/**
 * LogTab — admin verifikasi satu stop (bulk verify via Promise.all).
 */
// ─────────────────────────────────────────────────────────────────────────────
// FASE 2 — Reconciliation skip implisit
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Alasan skip yang dipakai KHUSUS oleh reconcileStaleStops() — dibedakan dari
 * SKIP_REASONS (types/collector.ts) yang dipilih manual oleh collector, supaya
 * UI (LogTab, HistorySection) bisa membedakan "collector sengaja skip" vs
 * "sistem otomatis menandai terlewat karena tidak ada aksi apa pun".
 */
export const SYSTEM_SKIP_REASON = "Otomatis — melewati batas waktu penjemputan";

/**
 * Cari semua stop yang masih "pending" padahal tanggal rutenya SUDAH LEWAT
 * (sebelum hari ini), lalu tandai jadi "skipped" dengan SYSTEM_SKIP_REASON.
 *
 * KONSEP: "skip implisit" — collector tidak melakukan apa pun (tidak submit
 * done maupun skip manual) sampai hari penjemputan berakhir. Ini konteks skip
 * kedua yang berbeda dari skip manual oleh collector.
 *
 * KAPAN DIPANGGIL:
 *   1. Setiap AdminDashboard.tsx mount (client, pakai session admin) —
 *      reconciliation "on-demand" saat ada admin yang buka dashboard.
 *   2. Fix — sekarang JUGA dipanggil dari runDailyScheduleSync() lewat
 *      cron server-side (lihat bagian bawah file ini), supaya reconciliation
 *      tetap jalan tiap hari meski TIDAK ADA admin yang login berhari-hari.
 *      Dua pemanggil ini idempotent dan aman jalan bersamaan — keduanya
 *      cuma menyentuh stop yang benar-benar masih "pending" & basi.
 *
 * PENTING: fungsi ini SENGAJA tidak menyentuh last_pickup_date — stop yang
 * di-skip (implisit maupun manual) TIDAK dianggap sebagai pickup selesai,
 * jadi siklus interval partner tidak boleh maju. Partner ini akan otomatis
 * masuk Urgent Queue lewat isPartnerUrgent() di scheduling.ts (reason: "skipped").
 *
 * @returns jumlah stop yang berhasil direkonsiliasi (untuk logging/toast opsional)
 */
export async function reconcileStaleStops(
  client: SupabaseClient = supabase,
): Promise<{
  reconciledCount: number;
}> {
  const today = todayWITA();

  // Step 1: cari semua route SEBELUM hari ini — kandidat stop yang mungkin
  // masih tertinggal berstatus "pending".
  const { data: staleRoutes, error: routeErr } = await client
    .from("collection_routes")
    .select("id")
    .lt("route_date", today);

  if (routeErr) throw new Error(routeErr.message);
  if (!staleRoutes || staleRoutes.length === 0) {
    return { reconciledCount: 0 };
  }

  const routeIds = staleRoutes.map((r) => r.id);

  // Step 2: update SEMUA stop "pending" di rute-rute tersebut jadi "skipped".
  // .select("id") di akhir dipakai supaya kita tahu berapa baris benar-benar
  // ter-update — Supabase tidak mengembalikan affected-row-count secara default.
  const { data: updated, error: updateErr } = await client
    .from("collection_stops")
    .update({
      status: "skipped",
      skip_reason: SYSTEM_SKIP_REASON,
      completed_at: new Date().toISOString(),
    })
    .in("route_id", routeIds)
    .eq("status", "pending")
    .select("id");

  if (updateErr) throw new Error(updateErr.message);

  return { reconciledCount: updated?.length ?? 0 };
}

/**
 * FASE 3 — ambil status stop TERAKHIR untuk sekumpulan partner sekaligus
 * (satu query, bukan satu-satu per partner — supaya efisien dipanggil dari
 * ScheduleTab yang bisa punya puluhan partner aktif).
 *
 * "Terakhir" ditentukan dari route_date paling besar (format "YYYY-MM-DD"
 * bisa dibandingkan langsung sebagai string). Kalau ada 2 stop di tanggal
 * yang sama persis untuk 1 partner (seharusnya tidak terjadi kalau alur
 * cegah-duplikasi di Fase 4/5 berjalan benar), fungsi ini mengambil salah
 * satu secara arbiter — bukan kasus yang didesain untuk terjadi.
 *
 * Dipakai oleh:
 *   OperationalSection.tsx (ScheduleTab) → Urgent Queue
 *   AdminDashboard.tsx                   → badge sidebar Operasional
 *
 * @param partnerIds  id semua partner yang mau dicek (biasanya dari
 *                    fetchActivePartners() — hanya partner status "active")
 * @returns  peta partner_id → LatestStopInfo. Partner yang tidak ada di
 *           hasil map berarti belum pernah punya stop sama sekali.
 */
export async function fetchLatestStopsForPartners(
  partnerIds: string[],
  client: SupabaseClient = supabase,
): Promise<Record<string, LatestStopInfo>> {
  if (partnerIds.length === 0) return {};

  const { data, error } = await client
    .from("collection_stops")
    .select("partner_id, status, collection_routes(route_date)")
    .in("partner_id", partnerIds);

  if (error) throw new Error(error.message);

  const latestByPartner: Record<string, LatestStopInfo> = {};

  for (const row of (data ?? []) as any[]) {
    const routeDate: string | undefined = row.collection_routes?.route_date;
    const partnerId: string | undefined = row.partner_id;
    if (!routeDate || !partnerId) continue;

    const current = latestByPartner[partnerId];
    // Perbandingan string "YYYY-MM-DD" setara perbandingan tanggal asli
    if (!current || routeDate > current.routeDate) {
      latestByPartner[partnerId] = { status: row.status, routeDate };
    }
  }

  return latestByPartner;
}

async function generateStopForPartner(
  partnerId: string,
  kecamatanNama: string | null,
  targetDate: string,
  lastCollectorId: string | null,
  volumeLimbah: string | null,
  client: SupabaseClient = supabase,
): Promise<void> {
  const collectors = await fetchAllCollectors(client);
  const routesOnTargetDate = await fetchRoutesForDate(targetDate, client);
  const suggestion = pickCollectorForPartner(
    { kecamatan_nama: kecamatanNama },
    collectors,
    routesOnTargetDate,
    lastCollectorId,
  );

  if (!suggestion) {
    throw new Error(
      "Tidak ada collector aktif tersedia — tidak bisa auto-generate jadwal.",
    );
  }

  await createRouteWithStops(
    {
      collector_id: suggestion.collector.id,
      route_date: targetDate,
      stops: [
        {
          partner_id: partnerId,
          stop_order: 1,
          scheduled_time: DEFAULT_AUTO_SCHEDULED_TIME,
          // Fix — dulu selalu null, lalu sempat pakai formula midpoint×interval.
          // Sekarang konsisten dengan konvensi admin: angka maksimum dari
          // rentang volume_limbah, tanpa dikali interval.
          estimated_kg: estimateKgFromVolumeLimbah(volumeLimbah),
        },
      ],
    },
    client,
  );
}

/**
 * FASE 4 — generate stop PERTAMA untuk partner yang baru saja di-approve.
 *
 * Dipanggil dari approvePartner() (supabase-partner.ts), TEPAT SETELAH
 * status partner berhasil di-set "active" di database.
 *
 * Aturan (hasil diskusi konsep):
 *   - Tanggal stop = active_from partner (BUKAN active_from + interval —
 *     pickup pertama terjadi di tanggal yang disetujui itu sendiri).
 *   - lastCollectorId selalu null (belum pernah ada siklus sebelumnya),
 *     jadi otomatis fallback ke area match → load ringan.
 *   - CEGAH DUPLIKASI: kalau partner ini entah bagaimana SUDAH punya stop
 *     "pending" (mis. approve dipanggil dua kali / re-approve setelah
 *     reactivate), jangan generate lagi — biarkan yang lama tetap jalan.
 *
 * PENTING SOAL ERROR HANDLING: fungsi ini SENGAJA throw kalau gagal
 * (misalnya tidak ada collector aktif sama sekali), bukan silent-fail.
 * approvePartner() yang memutuskan bagaimana meresponnya. Partner TETAP
 * menjadi "active" di database terlepas dari hasil fungsi ini.
 */
export async function generateInitialStop(partnerId: string): Promise<void> {
  const { data: partner, error: pErr } = await supabase
    .from("partner_applications")
    .select("id, kecamatan_nama, active_from, volume_limbah")
    .eq("id", partnerId)
    .single();

  if (pErr || !partner) {
    throw new Error(
      pErr?.message ?? "Partner tidak ditemukan untuk generate jadwal.",
    );
  }

  const latestMap = await fetchLatestStopsForPartners([partnerId]);
  if (latestMap[partnerId]?.status === "pending") {
    return; // sudah ada jadwal aktif menunggu — tidak perlu generate lagi
  }

  const targetDate = (partner.active_from ?? todayWITA()).slice(0, 10);
  await generateStopForPartner(
    partnerId,
    partner.kecamatan_nama,
    targetDate,
    null,
    partner.volume_limbah,
  );
}

/**
 * FASE 5 — generate stop BERIKUTNYA setelah satu stop selesai (status "done").
 * Dipanggil dari updateStopStatus() lewat handleStopCompletedInBackground()
 * — TIDAK PERNAH dipanggil untuk status "skipped" (skip SENGAJA menghentikan
 * siklus otomatis sampai admin assign manual dari Urgent Queue, sesuai
 * konsep yang sudah disepakati).
 *
 * Aturan:
 *   - Tanggal stop berikutnya = completionDate + pickup_interval_days partner.
 *   - lastCollectorId = collector yang BARU SAJA menyelesaikan siklus ini →
 *     jadi prioritas 1 di pickCollectorForPartner() (kontinuitas).
 *   - CEGAH DUPLIKASI: sama seperti generateInitialStop().
 *   - Kalau partner sudah tidak "active" lagi (dinonaktifkan di antara waktu
 *     stop dibuat dan diselesaikan), JANGAN generate — siklus otomatis
 *     berhenti dengan sendirinya untuk partner yang sudah tidak aktif.
 *
 * @param partnerId        partner yang baru saja selesai dijemput
 * @param completionDate   tanggal completion (anchor untuk due date berikutnya)
 * @param lastCollectorId  collector siklus ini, atau null kalau tidak diketahui
 */
export async function generateNextStop(
  partnerId: string,
  completionDate: string,
  lastCollectorId: string | null,
  client: SupabaseClient = supabase,
): Promise<void> {
  const latestMap = await fetchLatestStopsForPartners([partnerId], client);
  if (latestMap[partnerId]?.status === "pending") {
    return;
  }

  const { data: partner, error: pErr } = await client
    .from("partner_applications")
    .select("id, kecamatan_nama, pickup_interval_days, status, volume_limbah")
    .eq("id", partnerId)
    .single();

  if (pErr || !partner) {
    throw new Error(
      pErr?.message ??
        "Partner tidak ditemukan untuk generate stop berikutnya.",
    );
  }
  if (partner.status !== "active") return;

  const targetDate = addDays(completionDate, partner.pickup_interval_days);
  await generateStopForPartner(
    partnerId,
    partner.kecamatan_nama,
    targetDate,
    lastCollectorId,
    partner.volume_limbah,
    client,
  );
}

/**
 * FIX — jalankan sinkronisasi jadwal HARIAN, independen dari admin login.
 *
 * LATAR BELAKANG MASALAH:
 *   Sebelum ini, ada 2 celah yang membuat siklus auto-generate rapuh:
 *     1. handleStopCompletedInBackground() dipanggil fire-and-forget dari
 *        BROWSER collector setelah submit — kalau request itu gagal diam-diam
 *        (koneksi putus, tab ditutup terlalu cepat), siklus partner itu
 *        berhenti tanpa jejak, tidak ada retry.
 *     2. reconcileStaleStops() cuma dipanggil client-side saat AdminDashboard
 *        di-mount — kalau tidak ada admin yang login berhari-hari, stop basi
 *        tidak pernah direkonsiliasi, dan guard anti-duplikat mengira partner
 *        itu "masih ada jadwal aktif" sehingga TIDAK PERNAH dapat stop baru.
 *
 * FIX: satu fungsi yang dipanggil dari cron server-side (lihat
 * /api/cron/daily-schedule-sync), berjalan setiap hari TANPA butuh siapa pun
 * login. Jadi self-healing untuk kedua celah di atas sekaligus — kalau
 * fire-and-forget di poin 1 gagal, cron besok paginya akan menemukan partner
 * itu "belum ada stop" lewat computeUrgentQueue() dan generate ulang.
 *
 * URUTAN LANGKAH (penting):
 *   1. Reconcile dulu — stop "pending" yang route_date-nya sudah lewat
 *      ditandai "skipped", supaya guard anti-duplikat di langkah berikut
 *      membaca status yang benar-benar terkini.
 *   2. Hitung urgent queue — SATU-SATUNYA sumber kebenaran (computeUrgentQueue,
 *      sama persis dipakai Urgent Queue panel & badge sidebar admin).
 *   3. Auto-generate HANYA untuk reason "overdue_unscheduled" (due date lewat,
 *      belum ada stop terjadwal sama sekali). Partner dengan reason "skipped"
 *      SENGAJA dilewati — sama seperti generateNextStop(), skip butuh
 *      keputusan admin manual, bukan auto-generate ulang begitu saja.
 *
 * Sekuensial (bukan Promise.all) per partner — konsisten dengan pola yang
 * sudah ada di file ini (query load-per-collector yang dipakai
 * pickCollectorForPartner() tidak boleh balapan antar partner dalam 1 run).
 *
 * lastCollectorId sengaja selalu null di sini (sama seperti generateInitialStop)
 * — cron tidak melacak "collector siklus sebelumnya" untuk kasus ini, jadi
 * pickCollectorForPartner() fallback ke prioritas 2 (area match) / 3 (load
 * ringan). Ini bukan regresi — perilaku identik dengan generateInitialStop.
 *
 * @param client  WAJIB service-role client saat dipanggil dari cron (tidak
 *                ada sesi admin di context server) — lihat
 *                lib/supabase/service-role.ts. Default ke module singleton
 *                cuma untuk kemudahan testing lokal.
 */
export async function runDailyScheduleSync(
  client: SupabaseClient = supabase,
): Promise<{
  reconciledCount: number;
  generatedCount: number;
  skippedForReview: number;
  errors: { partnerId: string; organization: string; message: string }[];
}> {
  const { reconciledCount } = await reconcileStaleStops(client);

  const partners = await fetchActivePartners(client);
  const latestStops = await fetchLatestStopsForPartners(
    partners.map((p) => p.id),
    client,
  );
  const urgentQueue = computeUrgentQueue(partners, latestStops);

  const needsAutoStop = urgentQueue.filter(
    (item) => item.urgent.reason === "overdue_unscheduled",
  );
  const skippedForReview = urgentQueue.filter(
    (item) => item.urgent.reason === "skipped",
  ).length;

  let generatedCount = 0;
  const errors: { partnerId: string; organization: string; message: string }[] =
    [];

  for (const { partner } of needsAutoStop) {
    try {
      const targetDate = computeDueDate(partner) ?? todayWITA();
      await generateStopForPartner(
        partner.id,
        partner.kecamatan_nama,
        targetDate,
        null,
        partner.volume_limbah,
        client,
      );
      generatedCount++;
    } catch (err: any) {
      reportError("supabase-collector.runDailyScheduleSync", err, "warn");
      errors.push({
        partnerId: partner.id,
        organization: partner.organization,
        message: err?.message ?? "Unknown error",
      });
    }
  }

  return { reconciledCount, generatedCount, skippedForReview, errors };
}

export async function verifyStop(
  stopId: string,
  client: SupabaseClient = supabase,
): Promise<void> {
  // Verifikasi hanya mengubah status dari "done" ke "verified" jika diperlukan
  // Untuk sekarang, stop yang sudah "done" dianggap valid — tidak ada perubahan state.
  // Fungsi ini bisa diisi logic verifikasi lebih lanjut di Sprint 5.
  const { error } = await supabase
    .from("collection_stops")
    .update({ status: "done" })
    .eq("id", stopId);
  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Fungsi untuk COLLECTOR (CollectorPage)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CollectorPage — ambil rute hari ini milik collector berdasarkan email session.
 * Email session.email dari AuthModal → lookup collector_id → ambil route.
 *
 * Ini adalah query inti yang menghubungkan:
 *   session.email → collector_team → collection_routes → collection_stops
 *   ← JOIN → partner_applications (mitra_name, category, address)
 */
export async function fetchMyTodayRoute(collectorEmail: string): Promise<{
  route: RouteWithCollector | null;
  collector: CollectorMember | null;
}> {
  // Step 1: resolve collector_id dari email
  const { data: member, error: mErr } = await supabase
    .from("collector_team")
    .select("id, name, email, area, truck_plate, initials, status")
    .eq("email", collectorEmail)
    .single();

  if (mErr || !member) return { route: null, collector: null };

  // Step 2: ambil rute hari ini + semua stops + partner data
  const today = todayWITA();

  const { data: route, error: rErr } = await supabase
    .from("collection_routes")
    .select(
      `
      id, collector_id, route_date, status, total_planned_kg,
      collection_stops (
        id, stop_order, order_number, scheduled_time, estimated_kg, status,
        actual_kg, condition, skip_reason, completed_at,
        location_coords, photo_url, notes,
        partner_applications (
          organization, jenis_usaha, alamat_detail, kecamatan_nama
        )
      )
    `,
    )
    .eq("collector_id", member.id)
    .eq("route_date", today)
    .maybeSingle();

  if (rErr) throw new Error(rErr.message ?? JSON.stringify(rErr));
  if (!route) return { route: null, collector: member as CollectorMember };

  return {
    route: normalizeRoute({ ...route, collector_team: member }),
    collector: member as CollectorMember,
  };
}

/**
 * CollectorPage — collector update satu stop (done atau skipped).
 * Dipanggil oleh RouteSection saat collector submit form konfirmasi stop.
 */
export async function updateStopStatus(
  stopId: string,
  payload: StopUpdatePayload,
): Promise<void> {
  // 1. Update status stop di collection_stops
  const { error } = await supabase
    .from("collection_stops")
    .update({
      ...payload,
      completed_at:
        payload.status === "done" || payload.status === "skipped"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", stopId);

  if (error) throw error;

  // 2. Kalau "done" → rangkaian lanjutan (last_pickup_date + FASE 5
  // auto-generate stop berikutnya) SENGAJA TIDAK di-await di sini — supaya
  // CollectorPage tidak menunggu beberapa query tambahan (fetch partner,
  // fetch collector, fetch route, insert stop baru) sebelum submit terasa
  // selesai. Ini konsisten dengan pola fire-and-forget yang sudah ada
  // sebelumnya untuk last_pickup_date, cuma sekarang dirapikan jadi satu
  // fungsi terpisah karena rangkaiannya lebih panjang.
  //
  // Status "skipped" SENGAJA tidak memicu apa pun di sini — baik update
  // last_pickup_date maupun generate stop berikutnya. Itu prinsip inti
  // konsep yang disepakati: skip menghentikan siklus otomatis.
  if (payload.status === "done") {
    handleStopCompletedInBackground(stopId).catch((err) =>
      reportError(
        "supabase-collector.updateStopStatus.background",
        err,
        "warn",
      ),
    );
  }
}

/**
 * FASE 5 — rangkaian lanjutan setelah stop ditandai "done". SENGAJA
 * sekuensial (bukan Promise.all): generateNextStop() butuh last_pickup_date
 * yang SUDAH ter-update sebagai anchor tanggal siklus berikutnya, jadi kalau
 * update last_pickup_date gagal, generateNextStop() tidak boleh jalan
 * (anchor yang dipakai jadi tidak konsisten dengan data tersimpan).
 *
 * Tidak di-export — dipanggil TANPA await dari updateStopStatus(), jadi
 * semua error di sini ditangani via console.warn, tidak pernah dilempar ke
 * CollectorPage (submit "done" sudah dianggap sukses di langkah 1).
 */
async function handleStopCompletedInBackground(stopId: string): Promise<void> {
  // Ambil partner_id DAN route_id — route_id dipakai untuk tahu collector_id
  // siklus ini (prioritas 1 di pickCollectorForPartner()).
  const { data: stop, error: sErr } = await supabase
    .from("collection_stops")
    .select("partner_id, route_id")
    .eq("id", stopId)
    .single();

  if (sErr || !stop?.partner_id) {
    reportError(
      "supabase-collector.handleStopCompletedInBackground.getPartnerId",
      sErr ?? new Error("partner_id tidak ditemukan"),
      "warn",
    );
    return;
  }

  const today = todayWITA();

  const { error: pErr } = await supabase
    .from("partner_applications")
    .update({ last_pickup_date: today })
    .eq("id", stop.partner_id);

  if (pErr) {
    reportError(
      "supabase-collector.handleStopCompletedInBackground.updateLastPickupDate",
      pErr,
      "warn",
    );
    return; // jangan lanjut generate stop berikutnya kalau ini gagal
  }

  let lastCollectorId: string | null = null;
  if (stop.route_id) {
    const { data: route } = await supabase
      .from("collection_routes")
      .select("collector_id")
      .eq("id", stop.route_id)
      .maybeSingle();
    lastCollectorId = route?.collector_id ?? null;
  }

  try {
    const res = await fetch("/api/collector/generate-next-stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: stop.partner_id,
        completionDate: today,
        lastCollectorId,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      reportError(
        "supabase-collector.handleStopCompletedInBackground.generateNextStop",
        new Error(body?.error ?? `HTTP ${res.status}`),
        "warn",
      );
    }
  } catch (err) {
    reportError(
      "supabase-collector.handleStopCompletedInBackground.generateNextStop",
      err,
      "warn",
    );
  }
}

/**
 * CollectorPage — upload foto dokumentasi stop ke Supabase Storage.
 * Dipanggil di page.tsx SEBELUM updateStopStatus() agar photo_url
 * sudah tersedia saat payload dikirim ke collection_stops.
 *
 * Bucket  : collector-photos (public, sudah dikonfigurasi)
 * Path    : collection/{YYYY-MM-DD}/{stopId}.{ext}
 * Return  : URL publik foto (string) yang langsung bisa disimpan ke photo_url
 *
 * Error handling:
 *   - Jika upload gagal, fungsi throw error → page.tsx catch dan skip upload
 *     tapi tetap simpan data stop tanpa foto (tidak block keseluruhan submit)
 */
export async function uploadStopPhoto(
  file: File,
  stopId: string,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const date = todayWITA(); // "YYYY-MM-DD" dalam WITA
  const path = `collection/${date}/${stopId}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("collector-photos")
    .upload(path, file, {
      upsert: true, // replace jika foto untuk stop ini sudah ada
      contentType: file.type,
    });

  if (uploadErr) {
    throw new Error(`Upload foto gagal: ${uploadErr.message}`);
  }

  const { data } = supabase.storage.from("collector-photos").getPublicUrl(path);

  return data.publicUrl;
}

/**
 * CollectorPage — riwayat pickup (HistorySection, WeeklyBar, WasteLog).
 * Ambil 30 hari terakhir untuk collector ini.
 */
export async function fetchCollectorHistory(
  collectorEmail: string,
  limitDays = 30,
): Promise<(StopWithPartner & { route_date: string })[]> {
  const { data: member, error: mErr } = await supabase
    .from("collector_team")
    .select("id")
    .eq("email", collectorEmail)
    .single();

  if (mErr || !member) return [];

  // Hitung tanggal awal range menggunakan addDays (WITA-aware)
  const sinceStr = addDays(todayWITA(), -limitDays);

  // Query routes dulu (filter tanggal pada tabel induk — benar di PostgREST)
  // lalu ambil stops yang bukan pending
  const { data: routes, error: rErr } = await supabase
    .from("collection_routes")
    .select(
      `
      id, route_date,
      collection_stops (
        id, route_id, partner_id, stop_order, order_number, scheduled_time,
        estimated_kg, status, actual_kg, condition, skip_reason,
        completed_at, location_coords, photo_url, notes,
        partner_applications (organization, jenis_usaha, alamat_detail, kecamatan_nama)
      )
    `,
    )
    .eq("collector_id", member.id)
    .gte("route_date", sinceStr)
    .order("route_date", { ascending: false });

  if (rErr) throw new Error(rErr.message ?? JSON.stringify(rErr));

  // Flatten routes → stops, filter out pending, sort by completed_at desc
  return (routes ?? [])
    .flatMap((r: any) =>
      (r.collection_stops ?? [])
        .filter((s: any) => s.status !== "pending")
        .map((s: any) => ({
          id: s.id,
          route_id: s.route_id,
          partner_id: s.partner_id,
          stop_order: s.stop_order,
          order_number: s.order_number ?? null,
          scheduled_time: s.scheduled_time,
          estimated_kg: s.estimated_kg,
          status: s.status,
          actual_kg: s.actual_kg,
          condition: s.condition,
          skip_reason: s.skip_reason,
          completed_at: s.completed_at,
          location_coords: s.location_coords,
          photo_url: s.photo_url,
          notes: s.notes,
          partner: s.partner_applications,
          route_date: r.route_date,
        })),
    )
    .sort((a: any, b: any) =>
      (b.completed_at ?? "").localeCompare(a.completed_at ?? ""),
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (internal)
// ─────────────────────────────────────────────────────────────────────────────

function normalizeRoute(raw: any): RouteWithCollector {
  const stops: StopWithPartner[] = (raw.collection_stops ?? [])
    .sort((a: any, b: any) => {
      const tA = a.scheduled_time ?? "99:99";
      const tB = b.scheduled_time ?? "99:99";
      if (tA !== tB) return tA.localeCompare(tB);
      return (a.stop_order ?? 0) - (b.stop_order ?? 0);
    })
    .map((s: any, idx: number) => ({
      id: s.id,
      route_id: raw.id,
      partner_id: s.partner_id,
      stop_order: idx + 1,
      order_number: s.order_number ?? null,
      scheduled_time: s.scheduled_time,
      estimated_kg: s.estimated_kg,
      status: s.status,
      actual_kg: s.actual_kg,
      condition: s.condition,
      skip_reason: s.skip_reason,
      completed_at: s.completed_at,
      location_coords: s.location_coords,
      photo_url: s.photo_url ?? null,
      notes: s.notes,
      partner: s.partner_applications ?? {
        organization: "—",
        jenis_usaha: "cafe",
        alamat_detail: null,
        kecamatan_nama: null,
      },
    }));

  const stops_done = stops.filter((s) => s.status !== "pending").length;
  const total_actual_kg = stops
    .filter((s) => s.status === "done")
    .reduce((sum, s) => sum + (s.actual_kg ?? 0), 0);

  return {
    id: raw.id,
    collector_id: raw.collector_id,
    route_date: raw.route_date,
    status: raw.status,
    total_planned_kg: raw.total_planned_kg,
    collector: raw.collector_team as CollectorMember,
    stops,
    stops_done,
    stops_total: stops.length,
    total_actual_kg,
  };
}

// getWeekStart diganti getMondayWITA dari @/utils/dateUtils

/**
 * TeamTab — tambah anggota collector baru ke tabel collector_team.
 * Inisial digenerate otomatis dari nama jika tidak diisi.
 */
export async function insertCollectorMember(payload: {
  name: string;
  email: string;
  phone?: string;
  area?: string;
  truck_plate?: string;
}): Promise<CollectorMember> {
  // `initials` adalah GENERATED COLUMN di Postgres — JANGAN dimasukkan ke insert payload.
  // DB akan generate otomatis dari kolom `name`.

  const insertPayload = {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || null,
    area: payload.area?.trim() || null,
    truck_plate: payload.truck_plate?.trim().toUpperCase() || null,
    status: "active",
  };

  const { error: insertErr } = await supabase
    .from("collector_team")
    .insert(insertPayload);

  if (insertErr) {
    const detail = (insertErr as any).details ?? (insertErr as any).hint ?? "";
    throw new Error(`${insertErr.message}${detail ? ` — ${detail}` : ""}`);
  }

  // Fetch kembali data yang baru di-insert via email
  const { data, error: fetchErr } = await supabase
    .from("collector_team")
    .select("id, name, email, area, truck_plate, initials, status")
    .eq("email", insertPayload.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);
  return data as CollectorMember;
}
/**
 * TeamTab — ambil semua collector (aktif + inaktif) untuk dropdown.
 */
export async function fetchAllCollectors(
  client: SupabaseClient = supabase,
): Promise<CollectorMember[]> {
  const { data, error } = await client
    .from("collector_team")
    .select("id, name, email, area, truck_plate, initials, status")
    .order("name");

  if (error) {
    reportError("supabase-collector.fetchAllCollectors", error);
    throw error;
  }
  return (data ?? []) as CollectorMember[];
}

/**
 * TeamTab — ubah status collector (active ↔ inactive).
 */
export async function updateCollectorStatus(
  id: string,
  status: "active" | "inactive",
): Promise<void> {
  const { error } = await supabase
    .from("collector_team")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * TeamTab — hapus collector dari tim (hard delete).
 * Pastikan tidak ada collection_routes aktif sebelum memanggil ini.
 */
export async function deleteCollectorMember(id: string): Promise<void> {
  const { error } = await supabase.from("collector_team").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * TeamTab — Riwayat: ambil stops seorang collector (7 hari terakhir).
 */
export async function fetchCollectorHistory7Days(collectorId: string): Promise<
  {
    date: string;
    partner: string;
    kg: number | null;
    status: string;
    time: string;
  }[]
> {
  const today = todayWITA();
  const weekStart = addDays(today, -6);

  const { data, error } = await supabase
    .from("collection_routes")
    .select(
      `
      route_date,
      collection_stops (
        status, actual_kg, completed_at, scheduled_time,
        partner_applications (organization)
      )
    `,
    )
    .eq("collector_id", collectorId)
    .gte("route_date", weekStart)
    .lte("route_date", today)
    .order("route_date", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((r: any) =>
    (r.collection_stops ?? []).map((s: any) => ({
      date: formatDisplayDate(r.route_date, { short: true }),
      partner: s.partner_applications?.organization ?? "—",
      kg: s.actual_kg ?? null,
      status: s.status,
      time: s.completed_at
        ? toLocalTimeStr(s.completed_at)
        : (s.scheduled_time ?? "—"),
    })),
  );
}
