// src/lib/scheduling.ts
// ─────────────────────────────────────────────────────────────────────────────
// FASE 1 — Fungsi inti auto-generate jadwal penjemputan
//
// PENTING: Semua fungsi di file ini adalah PURE FUNCTION.
//   - Tidak ada import Supabase, tidak ada query database di sini.
//   - Input dan output eksplisit — mudah ditest tanpa perlu koneksi database.
//   - File ini akan dipakai oleh:
//       Fase 2 (reconciliation)  → tidak pakai file ini, murni operasi DB
//       Fase 3 (Urgent Queue)    → pakai computeDueDate() + isPartnerUrgent()
//       Fase 4 (approve partner) → pakai pickCollectorForPartner()
//       Fase 5 (auto-generate next stop) → pakai ketiga fungsi
//
// Konsep yang diimplementasikan (hasil diskusi konsep):
//   1. Urgent Queue = partner yang stop terakhirnya "skipped", ATAU
//      partner yang belum punya stop apa pun & due date sudah lewat.
//   2. Rekomendasi collector, urutan prioritas:
//      (1) collector yang sama dengan siklus pickup terakhir (kontinuitas)
//      (2) area/kecamatan match
//      (3) load paling ringan hari itu
//      — hanya collector berstatus "active" yang boleh direkomendasikan.
// ─────────────────────────────────────────────────────────────────────────────

import { parseLocalDate, addDays, diffDays, todayWITA } from "../utils/date";
import type {
  ActivePartner,
  CollectorMember,
  RouteWithCollector,
  LatestStopInfo,
} from "./supabase-collector";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// FASE 3: LatestStopInfo sekarang didefinisikan di supabase-collector.ts
// (satu tempat, dipakai juga oleh fetchLatestStopsForPartners()) — di sini
// tinggal di-reexport lewat import di atas supaya kode lama yang sudah
// terlanjur import dari "./scheduling" tidak perlu diubah.
export type { LatestStopInfo };

export type UrgentReason =
  | "skipped" // stop terakhir berstatus skipped, belum ada stop baru dibuat
  | "overdue_unscheduled" // due date lewat, tidak ada stop apa pun terjadwal
  | "stale_pending"; // ada stop pending tapi tanggalnya sudah lewat (harusnya jarang terjadi jika reconciliation Fase 2 jalan rutin)

export type UrgentResult = {
  urgent: boolean;
  reason: UrgentReason | null;
  /** Hanya terisi kalau urgent === true. Dipakai untuk label "Overdue Xd" di UI. */
  overdueDays: number | null;
};

export type CollectorSuggestion = {
  collector: CollectorMember;
  reason: string; // human-readable, ditampilkan di UI: "kolektor sebelumnya", "area match (Rappocini)", dst.
  priority: 1 | 2 | 3;
} | null;

// Subset field ActivePartner yang benar-benar dibutuhkan fungsi-fungsi di bawah.
// Pakai Pick<> supaya pemanggil tidak wajib punya objek ActivePartner utuh.
type PartnerScheduleInfo = Pick<
  ActivePartner,
  "pickup_interval_days" | "last_pickup_date" | "active_from"
>;

type PartnerAreaInfo = Pick<ActivePartner, "kecamatan_nama">;

// ─────────────────────────────────────────────────────────────────────────────
// 1. computeDueDate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hitung tanggal jatuh tempo pickup berikutnya untuk satu partner.
 *
 * Basis perhitungan (urutan prioritas):
 *   1. last_pickup_date + interval   → partner sudah pernah dijemput
 *   2. active_from + interval        → partner belum pernah dijemput,
 *                                       pakai tanggal disetujui sebagai basis
 *   3. null                          → data tidak cukup untuk dihitung
 *      (seharusnya tidak pernah terjadi untuk partner status "active",
 *       karena approvePartner() selalu mengisi active_from — ini jaring
 *       pengaman kalau ada data lama/rusak)
 *
 * @returns tanggal "YYYY-MM-DD", atau null kalau data tidak cukup.
 */
export function computeDueDate(partner: PartnerScheduleInfo): string | null {
  const baseDate = partner.last_pickup_date ?? partner.active_from ?? null;
  if (!baseDate) return null;

  // baseDate bisa berupa timestamp lengkap (active_from) atau tanggal saja
  // (last_pickup_date) — slice(0, 10) menormalkan keduanya jadi "YYYY-MM-DD".
  const baseDateOnly = baseDate.slice(0, 10);
  return addDays(baseDateOnly, partner.pickup_interval_days);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. isPartnerUrgent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tentukan apakah satu partner harus muncul di Urgent Queue, dan kenapa.
 *
 * Aturan (sesuai hasil diskusi konsep):
 *   - latestStop.status === "skipped"
 *       → urgent, reason "skipped". Siklus otomatis berhenti sampai admin
 *         assign manual — ini SENGAJA, karena skip butuh keputusan manusia
 *         (kenapa di-skip? partner tutup? pindah? dsb).
 *
 *   - latestStop.status === "pending" DAN routeDate < hari ini
 *       → urgent, reason "stale_pending". Ini kasus anomali — normalnya
 *         Fase 2 (reconciliation) sudah mengubah stop begini jadi "skipped"
 *         sebelum fungsi ini dipanggil. Kita tetap tangani di sini sebagai
 *         jaring pengaman kedua, BUKAN pengganti Fase 2.
 *
 *   - latestStop.status === "pending" DAN routeDate >= hari ini
 *       → TIDAK urgent. Sudah terjadwal aman, sedang menunggu dieksekusi.
 *
 *   - latestStop.status === "done", ATAU latestStop === null (belum pernah
 *     ada stop sama sekali)
 *       → cek computeDueDate(); urgent kalau due date sudah lewat hari ini.
 *
 * @param partner     data interval & tanggal partner
 * @param latestStop  stop TERAKHIR milik partner ini (urutkan by tanggal
 *                    dibuat/route_date secara descending sebelum dikirim ke
 *                    fungsi ini — pemanggil bertanggung jawab atas ini)
 */
export function isPartnerUrgent(
  partner: PartnerScheduleInfo,
  latestStop: LatestStopInfo,
): UrgentResult {
  const todayStr = todayWITA();
  const todayMs = parseLocalDate(todayStr).getTime();

  // ── Kasus 1: stop terakhir "skipped" ──────────────────────────────────────
  if (latestStop?.status === "skipped") {
    const overdueDays = diffDays(todayStr, latestStop.routeDate);
    return { urgent: true, reason: "skipped", overdueDays: Math.max(overdueDays, 0) };
  }

  // ── Kasus 2: stop terakhir "pending" ──────────────────────────────────────
  if (latestStop?.status === "pending") {
    const stopMs = parseLocalDate(latestStop.routeDate).getTime();
    if (stopMs < todayMs) {
      // Anomali — jaring pengaman, harusnya sudah ditangani Fase 2
      const overdueDays = diffDays(todayStr, latestStop.routeDate);
      return { urgent: true, reason: "stale_pending", overdueDays };
    }
    // Sudah terjadwal hari ini/masa depan — aman
    return { urgent: false, reason: null, overdueDays: null };
  }

  // ── Kasus 3: stop terakhir "done", atau belum pernah ada stop ─────────────
  const dueDate = computeDueDate(partner);
  if (!dueDate) {
    // Data tidak cukup untuk dihitung — jangan tandai urgent secara keliru
    return { urgent: false, reason: null, overdueDays: null };
  }
  const dueMs = parseLocalDate(dueDate).getTime();
  if (dueMs < todayMs) {
    return {
      urgent: true,
      reason: "overdue_unscheduled",
      overdueDays: diffDays(todayStr, dueDate),
    };
  }
  return { urgent: false, reason: null, overdueDays: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. pickCollectorForPartner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pilih collector untuk stop yang akan di-generate (baik saat approve partner
 * baru maupun saat auto-generate stop berikutnya).
 *
 * Urutan prioritas (hasil diskusi konsep):
 *   1. Collector yang sama dengan siklus pickup TERAKHIR partner ini —
 *      menjaga kontinuitas (collector sudah hafal lokasi/kontak partner).
 *      Hanya dipakai kalau collector itu MASIH berstatus "active".
 *   2. Area/kecamatan match antara partner dan collector.
 *   3. Collector dengan jumlah stop PALING SEDIKIT hari ini (load ringan).
 *
 * CATATAN PERBAIKAN dari versi lama (suggestCollector di OperationalSection):
 *   Versi lama tidak memfilter status collector — berpotensi menyarankan
 *   collector yang sudah "inactive". Versi ini memfilter di awal, sebelum
 *   masuk ke logic prioritas manapun.
 *
 * @param partner         info area partner (kecamatan_nama)
 * @param collectors      semua collector (aktif maupun tidak — difilter di dalam)
 * @param todayRoutes     rute hari ini, dipakai untuk hitung load per collector
 * @param lastCollectorId collector_id dari stop terakhir partner ini yang
 *                        berstatus "done", atau null kalau belum pernah ada
 *                        (pemanggil yang menyediakan ini — lihat Fase 5)
 */
export function pickCollectorForPartner(
  partner: PartnerAreaInfo,
  collectors: CollectorMember[],
  todayRoutes: RouteWithCollector[],
  lastCollectorId: string | null,
): CollectorSuggestion {
  const activeCollectors = collectors.filter((c) => c.status === "active");
  if (activeCollectors.length === 0) return null;

  // ── Prioritas 1: collector yang sama seperti siklus terakhir ──────────────
  if (lastCollectorId) {
    const previous = activeCollectors.find((c) => c.id === lastCollectorId);
    if (previous) {
      return {
        collector: previous,
        reason: "kolektor siklus sebelumnya",
        priority: 1,
      };
    }
    // Kalau lastCollectorId ada tapi collector-nya sudah inactive/dihapus,
    // sengaja tidak return null — lanjut ke prioritas 2 sebagai fallback.
  }

  // ── Prioritas 2: area/kecamatan match ──────────────────────────────────────
  const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, "");
  const kec = partner.kecamatan_nama ? normalize(partner.kecamatan_nama) : null;

  if (kec) {
    const byArea =
      activeCollectors.find((c) => c.area && normalize(c.area).includes(kec)) ??
      activeCollectors.find((c) => c.area && kec.includes(normalize(c.area ?? "")));
    if (byArea) {
      return {
        collector: byArea,
        reason: `area match (${byArea.area ?? partner.kecamatan_nama})`,
        priority: 2,
      };
    }
  }

  // ── Prioritas 3: load paling ringan hari ini ──────────────────────────────
  const stopCountByCollector = Object.fromEntries(
    activeCollectors.map((c) => {
      const route = todayRoutes.find((r) => r.collector_id === c.id);
      return [c.id, route ? route.stops_total : 0];
    }),
  );

  const leastLoaded = [...activeCollectors].sort(
    (a, b) => (stopCountByCollector[a.id] ?? 0) - (stopCountByCollector[b.id] ?? 0),
  )[0];

  const count = stopCountByCollector[leastLoaded.id] ?? 0;
  return {
    collector: leastLoaded,
    reason: count === 0 ? "load ringan (0 stop hari ini)" : `load ringan (${count} stop hari ini)`,
    priority: 3,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. computeUrgentQueue — SATU-SATUNYA tempat yang mendefinisikan "urgent"
// ─────────────────────────────────────────────────────────────────────────────

export type UrgentQueueItem = {
  partner: ActivePartner;
  urgent: UrgentResult; // reason + overdueDays, dari isPartnerUrgent()
};

/**
 * Gabungkan daftar partner aktif + status stop terakhir masing-masing →
 * hasilkan daftar partner yang urgent, sudah terurut (paling lama
 * overdue/paling lama di-skip duluan).
 *
 * INI SUMBER KEBENARAN TUNGGAL untuk "apa itu Urgent Queue" — dipakai oleh:
 *   - OperationalSection.tsx (ScheduleTab)  → isi panel Urgent Queue
 *   - AdminDashboard.tsx                    → badge sidebar Operasional
 *
 * Kalau butuh mengubah definisi "urgent" di masa depan, cukup ubah di sini
 * dan isPartnerUrgent() — TIDAK PERLU ubah dua tempat terpisah lagi.
 *
 * @param partners     hasil fetchActivePartners() — hanya partner status "active"
 * @param latestStops  hasil fetchLatestStopsForPartners(partners.map(p => p.id))
 */
export function computeUrgentQueue(
  partners: ActivePartner[],
  latestStops: Record<string, LatestStopInfo>,
): UrgentQueueItem[] {
  return partners
    .map((partner) => ({
      partner,
      urgent: isPartnerUrgent(partner, latestStops[partner.id] ?? null),
    }))
    .filter((item) => item.urgent.urgent)
    .sort((a, b) => (b.urgent.overdueDays ?? 0) - (a.urgent.overdueDays ?? 0));
}
