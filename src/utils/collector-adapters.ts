// src/utils/collector-adapters.ts
// ─────────────────────────────────────────────────────────────────────────────
// Adapter layer: menjembatani tipe DB (supabase-collector.ts) ke
// tipe UI (src/types/collector.ts) yang sudah dipakai CollectorPage.
//
// Kenapa perlu adapter terpisah (bukan langsung di lib)?
//   - supabase-collector.ts = pure data layer, tidak tahu soal UI types
//   - UI types (RouteStop, WasteLog, WeeklyBar) = contract antara
//     CollectorPage dan child components (RouteSection, HistorySection)
//   - Adapter = satu-satunya tempat konversi, mudah di-test dan diupdate
// ─────────────────────────────────────────────────────────────────────────────

import type { StopWithPartner } from "@/lib/supabase-collector";
import type { RouteStop, WasteLog, WeeklyBar } from "@/types/collector";

// ── StopWithPartner → RouteStop ──────────────────────────────────────────────
// Ini adalah mapping UTAMA antara data partner_applications (dari DB)
// dan struktur yang diharapkan RouteSection component.

export function toRouteStop(stop: StopWithPartner): RouteStop {
  const addressParts = [
    stop.partner.alamat_detail,
    stop.partner.kecamatan_nama,
  ].filter(Boolean);

  return {
    id: stop.id,
    order: stop.stop_order,

    // Dari partner_applications via JOIN
    mitra_name: stop.partner.organization,
    mitra_category: normalizeMitraCategory(stop.partner.jenis_usaha),
    address: addressParts.join(", ") || "Alamat tidak tersedia",

    scheduled_time: stop.scheduled_time ?? "",
    estimated_kg: stop.estimated_kg ?? 0,
    status: stop.status,

    // Diisi setelah collector update
    actual_kg: stop.actual_kg ?? undefined,
    condition: (stop.condition as RouteStop["condition"]) ?? undefined,
    completed_at: stop.completed_at
      ? new Date(stop.completed_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined,
    location_coords: stop.location_coords ?? undefined,
    skip_reason: stop.skip_reason ?? undefined,
    notes: stop.notes ?? undefined,
  };
}

// ── StopWithPartner → WasteLog ───────────────────────────────────────────────

export function toWasteLog(
  stop: StopWithPartner & { route_date: string },
): WasteLog {
  const dateObj = new Date(stop.route_date);
  const dateLabel = dateObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

  const timeLabel = stop.completed_at
    ? new Date(stop.completed_at).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : (stop.scheduled_time ?? "—");

  return {
    id: stop.id,
    mitra_name: stop.partner.organization,
    mitra_category: normalizeMitraCategory(stop.partner.jenis_usaha),
    date: dateLabel,
    time: timeLabel,
    kg: stop.actual_kg ?? 0,
    condition: (stop.condition as WasteLog["condition"]) ?? null,
    status:
      stop.status === "done"
        ? "verified" // default ke verified; admin bisa ubah ke "pending" jika belum dicek
        : stop.status === "skipped"
          ? "skipped"
          : "pending",
    has_photo: !!stop.photo_url,
    location_coords: stop.location_coords ?? undefined,
    skip_reason: stop.skip_reason ?? undefined,
    notes: stop.notes ?? undefined,
  };
}

// ── WeeklyBar input type ──────────────────────────────────────────────────────
// toWeeklyBars hanya butuh dua field: route_date dan total_actual_kg.
// Menggunakan structural type (bukan RouteWithCollector) agar kompatibel dengan:
//   - RouteWithCollector[] dari fetchCollectorStats (admin)
//   - { route_date, total_actual_kg }[] dari groupHistoryByDay (collector page)
type DailyKgRecord = {
  route_date: string;
  total_actual_kg: number;
};

// ── WeeklyBar input type ──────────────────────────────────────────────────────
// Menghitung kg per hari dari riwayat rute collector.

export function toWeeklyBars(
  routes: DailyKgRecord[],
  today: string,
): WeeklyBar[] {
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return routes.map((r) => {
    const dateObj = new Date(r.route_date);
    const dayIdx = dateObj.getDay();

    return {
      day: r.route_date === today ? "Hari" : dayNames[dayIdx],
      kg: r.total_actual_kg,
      isToday: r.route_date === today,
    };
  });
}

// ── Helper ───────────────────────────────────────────────────────────────────

// jenis_usaha dari partner_applications (USER-DEFINED) → mitra_category di RouteStop
// Value mapping berdasarkan enum yang dipakai PartnerSection
function normalizeMitraCategory(jenis: string): RouteStop["mitra_category"] {
  const map: Record<string, RouteStop["mitra_category"]> = {
    cafe: "cafe",
    kafe: "cafe",
    coffee: "cafe",
    hotel: "hotel",
    penginapan: "hotel",
    resto: "resto",
    restoran: "resto",
    rumah_makan: "resto",
  };
  return map[jenis?.toLowerCase()] ?? "cafe";
}
