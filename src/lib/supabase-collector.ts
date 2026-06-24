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
import {
  todayWITA,
  getMondayWITA,
  addDays,
  formatDate,
  parseLocalDate,
  formatDisplayDate,
  toLocalTimeStr,
} from "../utils/date";
const supabase = createClient();

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

// Stop dengan data partner di-embed — dipakai CollectorPage dan MonitorTab
export type StopWithPartner = {
  id: string;
  route_id: string;
  partner_id: string;
  stop_order: number;
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
export async function fetchActivePartners(): Promise<ActivePartner[]> {
  const { data, error } = await supabase
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
 * MonitorTab + LogTab — rute hari ini (real-time status collector).
 */
export async function fetchTodayRoutes(): Promise<RouteWithCollector[]> {
  const today = todayWITA();

  const { data, error } = await supabase
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
    .eq("route_date", today)
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map(normalizeRoute);
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
    console.error(
      "[fetchCollectorStats] members query error:",
      mErr.message,
      mErr,
    );
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
 * ScheduleTab — admin membuat stop baru (dari modal "Slot manual").
 * partnerIds dipilih dari fetchActivePartners() dropdown.
 */
export async function createRouteWithStops(payload: {
  collector_id: string;
  route_date: string;
  stops: {
    partner_id: string;
    stop_order: number;
    scheduled_time: string;
    estimated_kg: number | null;
  }[];
}): Promise<string> {
  // 1. Cek apakah sudah ada route untuk collector + tanggal ini
  //    (unique constraint: collector_id + route_date)
  const { data: existing } = await supabase
    .from("collection_routes")
    .select("id, total_planned_kg")
    .eq("collector_id", payload.collector_id)
    .eq("route_date", payload.route_date)
    .maybeSingle();

  let routeId: string;

  if (existing) {
    // Route sudah ada → pakai ID yang ada, update total_planned_kg
    routeId = existing.id;
    const addedKg = payload.stops.reduce(
      (sum, s) => sum + (s.estimated_kg ?? 0),
      0,
    );
    await supabase
      .from("collection_routes")
      .update({ total_planned_kg: (existing.total_planned_kg ?? 0) + addedKg })
      .eq("id", routeId);
  } else {
    // Route belum ada → buat baru
    const { data: route, error: rErr } = await supabase
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

  // 2. Hitung stop_order berikutnya di route ini
  //    agar tidak tabrakan dengan stop yang sudah ada
  const { data: existingStops } = await supabase
    .from("collection_stops")
    .select("stop_order")
    .eq("route_id", routeId)
    .order("stop_order", { ascending: false })
    .limit(1);

  const nextOrder =
    existingStops && existingStops.length > 0
      ? existingStops[0].stop_order + 1
      : 1;

  // 3. Insert stops dengan stop_order yang benar
  const { error: sErr } = await supabase.from("collection_stops").insert(
    payload.stops.map((s, i) => ({
      route_id: routeId,
      partner_id: s.partner_id,
      stop_order: nextOrder + i,
      scheduled_time: s.scheduled_time,
      estimated_kg: s.estimated_kg,
      status: "pending",
    })),
  );

  if (sErr) throw sErr;
  return routeId;
}

/**
 * LogTab — admin verifikasi satu stop (bulk verify via Promise.all).
 */
export async function verifyStop(stopId: string): Promise<void> {
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
        id, stop_order, scheduled_time, estimated_kg, status,
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

  // 2. Jika status "done" → update last_pickup_date di partner_applications
  // Ini adalah trigger otomatis: setiap kali collector submit stop selesai,
  // tanggal penjemputan terakhir partner langsung terupdate.
  // Dipakai oleh Suggest Schedule (Fase 2) untuk hitung due_date berikutnya.
  if (payload.status === "done") {
    // Ambil partner_id dari stop yang baru di-update
    const { data: stop } = await supabase
      .from("collection_stops")
      .select("partner_id")
      .eq("id", stopId)
      .single();

    if (stop?.partner_id) {
      const today = todayWITA();
      // Fire-and-forget — jangan block CollectorPage jika ini gagal
      supabase
        .from("partner_applications")
        .update({ last_pickup_date: today })
        .eq("id", stop.partner_id)
        .then(({ error: pErr }) => {
          if (pErr)
            console.warn(
              "[updateStopStatus] last_pickup_date update gagal:",
              pErr.message,
            );
        });
    }
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
        id, route_id, partner_id, stop_order, scheduled_time,
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
export async function fetchAllCollectors(): Promise<CollectorMember[]> {
  const { data, error } = await supabase
    .from("collector_team")
    .select("id, name, email, area, truck_plate, initials, status")
    .order("name");

  if (error) {
    console.error("[fetchAllCollectors] error:", error.message, error);
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
