// src/utils/dateUtils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Timezone-aware date utilities untuk Rebru — WITA (UTC+8, Makassar)
//
// MASALAH YANG DISELESAIKAN:
//   JavaScript new Date().toISOString() selalu UTC.
//   Di WITA (UTC+8), tengah malam lokal = 16:00 UTC kemarin.
//   Semua perbandingan tanggal yang pakai toISOString() akan geser -1 hari.
//
// SOLUSI:
//   Semua fungsi di file ini mengembalikan tanggal dalam konteks WITA.
//   Seluruh komponen WAJIB import dari sini — JANGAN pakai toISOString()
//   untuk menghasilkan string tanggal lokal di mana pun di project ini.
//
// CARA PAKAI:
//   import { todayWITA, toLocalDateStr, getMondayWITA } from "@/utils/dateUtils";
// ─────────────────────────────────────────────────────────────────────────────

/** Offset WITA dalam menit: UTC+8 = 480 menit */
const WITA_OFFSET_MINUTES = 8 * 60;

/**
 * Buat Date object yang menunjuk ke "sekarang" dalam WITA.
 * Gunakan ini sebagai pengganti `new Date()` saat butuh waktu lokal Makassar.
 */
export function nowWITA(): Date {
  const utc = Date.now();
  return new Date(utc + WITA_OFFSET_MINUTES * 60_000);
}

/**
 * Kembalikan string "YYYY-MM-DD" untuk hari ini dalam WITA.
 * Pengganti: new Date().toISOString().split("T")[0]
 *
 * @example
 * todayWITA() → "2026-05-30"  // benar di Makassar jam 01:00
 * new Date().toISOString().split("T")[0] → "2026-05-29"  // SALAH
 */
export function todayWITA(): string {
  return formatDate(nowWITA());
}

/**
 * Format Date object menjadi string "YYYY-MM-DD" tanpa UTC conversion.
 * Gunakan ini untuk semua konstruksi string tanggal.
 *
 * @example
 * formatDate(new Date(2026, 4, 30)) → "2026-05-30"
 */
export function formatDate(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Parse string "YYYY-MM-DD" menjadi Date object di local midnight WITA.
 * Pengganti: new Date("YYYY-MM-DD") yang diparsing sebagai UTC midnight.
 *
 * @example
 * parseLocalDate("2026-05-30") → Date di WITA tengah malam (bukan UTC)
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  // new Date(y, m-1, d) = local midnight — tidak konversi ke UTC
  return new Date(y, m - 1, d);
}

/**
 * Konversi timestamp UTC dari Supabase menjadi string tanggal lokal WITA.
 * Pengganti: new Date(isoString).toISOString().split("T")[0]
 *
 * @example
 * // Supabase simpan "2026-05-29T16:00:00Z" (= 30 Mei WITA tengah malam)
 * toLocalDateStr("2026-05-29T16:00:00Z") → "2026-05-30"  // benar
 * new Date("2026-05-29T16:00:00Z").toISOString().split("T")[0] → "2026-05-29"  // SALAH
 */
export function toLocalDateStr(isoString: string): string {
  // Tambah offset WITA ke timestamp UTC, lalu ambil tanggalnya
  const utcMs = new Date(isoString).getTime();
  const witaMs = utcMs + WITA_OFFSET_MINUTES * 60_000;
  return formatDate(new Date(witaMs));
}

/**
 * Konversi timestamp UTC dari Supabase menjadi string waktu lokal WITA "HH:MM".
 *
 * @example
 * toLocalTimeStr("2026-05-29T00:30:00Z") → "08:30"  (WITA = UTC+8)
 */
export function toLocalTimeStr(isoString: string): string {
  const utcMs = new Date(isoString).getTime();
  const witaMs = utcMs + WITA_OFFSET_MINUTES * 60_000;
  const d = new Date(witaMs);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/**
 * Ambil tanggal Senin dari minggu yang mengandung dateStr, dalam WITA.
 * Pengganti: getMondayOf() yang tersebar di beberapa komponen.
 *
 * @example
 * getMondayWITA("2026-05-30") → "2026-05-25"  (Senin minggu itu)
 */
export function getMondayWITA(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0=Minggu, 1=Senin, ..., 6=Sabtu
  const diff = day === 0 ? -6 : 1 - day; // mundur ke Senin
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

/**
 * Tambah sejumlah hari ke string tanggal "YYYY-MM-DD".
 *
 * @example
 * addDays("2026-05-28", 3) → "2026-05-31"
 * addDays("2026-05-28", -1) → "2026-05-27"
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Hitung selisih hari antara dua string tanggal (a - b).
 * Positif = a lebih baru dari b.
 * Negatif = a lebih lama dari b.
 *
 * @example
 * diffDays("2026-05-30", "2026-05-28") → 2
 * diffDays("2026-05-25", "2026-05-28") → -3
 */
export function diffDays(a: string, b: string): number {
  const msA = parseLocalDate(a).getTime();
  const msB = parseLocalDate(b).getTime();
  return Math.round((msA - msB) / 86_400_000);
}

/**
 * Format tanggal untuk tampilan bahasa Indonesia.
 * Pengganti: d.toLocaleDateString("id-ID", {...}) yang bergantung pada locale browser.
 *
 * @example
 * formatDisplayDate("2026-05-30") → "30 Mei 2026"
 * formatDisplayDate("2026-05-30", { weekday: true }) → "Sab, 30 Mei 2026"
 * formatDisplayDate("2026-05-30", { short: true }) → "30 Mei"
 */
const BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
const BULAN_PANJANG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function formatDisplayDate(
  dateStr: string,
  opts: { weekday?: boolean; short?: boolean; longMonth?: boolean } = {},
): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDate();
  const month = opts.longMonth
    ? BULAN_PANJANG[d.getMonth()]
    : BULAN[d.getMonth()];
  const year = d.getFullYear();
  const hari = HARI[d.getDay()];

  if (opts.short) return `${day} ${month}`;
  if (opts.weekday) return `${hari}, ${day} ${month} ${year}`;
  return `${day} ${month} ${year}`;
}

/**
 * Cek apakah sebuah waktu (format "HH:MM") sudah terlewat lebih dari X menit.
 * Dipakai MonitorTab untuk cek collector overdue.
 *
 * @example
 * isTimeOverdue("08:00", 45) → true  jika sekarang sudah > 08:45 WITA
 */
export function isTimeOverdue(
  scheduledTime: string | null,
  toleranceMinutes = 45,
): boolean {
  if (!scheduledTime) return false;
  const [h, m] = scheduledTime.split(":").map(Number);
  const now = nowWITA();
  const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();
  return nowMins > h * 60 + m + toleranceMinutes;
}
