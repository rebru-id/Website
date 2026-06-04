// src/utils/date.ts
// ─────────────────────────────────────────────────────────────────────────────
// Timezone-aware date utilities untuk Rebru — WITA (UTC+8, Makassar)
//
// ── BUG YANG DIPERBAIKI (v2) ─────────────────────────────────────────────────
//
// BUG LAMA:
//   nowWITA() membuat Date dengan internal UTC = actual_UTC + 8jam.
//   Ini dimaksudkan agar getUTCDate() = tanggal WITA.
//   TAPI formatDate() dan fungsi lain memakai LOCAL methods (getDate() dll).
//
//   Di browser WITA (+8), hasilnya DOUBLE-COUNT offset:
//     actual_UTC  = June 2, 11:24 UTC
//     nowWITA()   = Date(June 2, 19:24 UTC)
//     local WITA  = June 2, 19:24 UTC = June 3, 03:24 WITA
//     getDate()   = 3  ← SALAH, harusnya 2
//
//   Akibat: OperationalSection menyorot hari +1 dari tanggal sebenarnya.
//
// FIX:
//   Konsistenkan semua operasi tanggal menggunakan UTC methods.
//   parseLocalDate: parse "YYYY-MM-DD" sebagai UTC midnight.
//   formatDate, getMondayWITA, addDays, formatDisplayDate: semua getUTC*.
//   Hasil: benar di browser timezone apapun (UTC, WITA, WIB, dst).
//
// ─────────────────────────────────────────────────────────────────────────────

/** Offset WITA dalam menit: UTC+8 = 480 menit */
const WITA_OFFSET_MINUTES = 8 * 60;

// ── Konstanta tampilan Indonesia ──────────────────────────────────────────────

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

// ── Core: waktu WITA sekarang ─────────────────────────────────────────────────

/**
 * Buat Date object yang merepresentasikan "sekarang" dalam WITA.
 * Internal UTC time = actual_UTC + 8 jam.
 * Gunakan SELALU dengan getUTC* methods (getUTCDate, getUTCHours, dll).
 *
 * @example
 * // Jam 01:30 WITA (= 17:30 UTC kemarin)
 * nowWITA().getUTCDate() → tanggal WITA yang benar
 */
export function nowWITA(): Date {
  const utc = Date.now();
  return new Date(utc + WITA_OFFSET_MINUTES * 60_000);
}

/**
 * Kembalikan string "YYYY-MM-DD" untuk hari ini dalam WITA.
 * Benar di semua timezone browser.
 *
 * @example
 * // Jam 01:00 WITA (= 17:00 UTC kemarin)
 * todayWITA() → "2026-06-02"  ✓  (benar, ini masih June 2 di Makassar)
 * new Date().toISOString().split("T")[0] → "2026-06-01"  ✗
 */
export function todayWITA(): string {
  return formatDate(nowWITA());
}

// ── formatDate — WAJIB pakai getUTC* ─────────────────────────────────────────

/**
 * Format Date object menjadi string "YYYY-MM-DD".
 * Menggunakan getUTC* methods agar benar untuk:
 *   - nowWITA() yang encode WITA time di posisi UTC
 *   - parseLocalDate() yang parse sebagai UTC midnight
 *
 * JANGAN ganti ke getFullYear/getMonth/getDate — akan salah di browser WITA.
 */
export function formatDate(d: Date): string {
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// ── parseLocalDate — UTC midnight ─────────────────────────────────────────────

/**
 * Parse string "YYYY-MM-DD" menjadi Date object di UTC midnight.
 * Konsisten dengan formatDate yang menggunakan getUTC* methods.
 *
 * MENGAPA UTC midnight (bukan local midnight):
 *   new Date(y, m-1, d) = local midnight.
 *   Di WITA (+8), local midnight = 16:00 UTC hari sebelumnya.
 *   getUTCDate() pada Date itu akan return tanggal -1. SALAH.
 *
 *   new Date("YYYY-MM-DDT00:00:00Z") = UTC midnight.
 *   getUTCDate() selalu return tanggal yang dimaksud. BENAR.
 *
 * @example
 * parseLocalDate("2026-06-02").getUTCDate() → 2  ✓ (di browser timezone apapun)
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

// ── String konversi dari Supabase timestamps ──────────────────────────────────

/**
 * Konversi timestamp UTC dari Supabase menjadi string tanggal lokal WITA.
 *
 * @example
 * toLocalDateStr("2026-05-29T16:00:00Z") → "2026-05-30"
 * // (16:00 UTC = midnight WITA = masih 30 Mei di Makassar)
 */
export function toLocalDateStr(isoString: string): string {
  const utcMs = new Date(isoString).getTime();
  const witaMs = utcMs + WITA_OFFSET_MINUTES * 60_000;
  return formatDate(new Date(witaMs));
}

/**
 * Konversi timestamp UTC dari Supabase menjadi string waktu lokal WITA "HH:MM".
 *
 * @example
 * toLocalTimeStr("2026-05-29T00:30:00Z") → "08:30"
 */
export function toLocalTimeStr(isoString: string): string {
  const utcMs = new Date(isoString).getTime();
  const witaMs = utcMs + WITA_OFFSET_MINUTES * 60_000;
  const d = new Date(witaMs);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

// ── Date arithmetic — millisecond-based, timezone-safe ────────────────────────

/**
 * Ambil tanggal Senin dari minggu yang mengandung dateStr.
 * Menggunakan getUTCDay() + millisecond arithmetic — benar di semua timezone.
 *
 * @example
 * getMondayWITA("2026-06-02") → "2026-06-01"  (Selasa → Senin minggu itu)
 */
export function getMondayWITA(dateStr: string): string {
  const d = parseLocalDate(dateStr); // UTC midnight
  const day = d.getUTCDay(); // 0=Min, 1=Sen, ..., 6=Sab
  const diff = day === 0 ? -6 : 1 - day;
  return formatDate(new Date(d.getTime() + diff * 86_400_000));
}

/**
 * Tambah sejumlah hari ke string tanggal "YYYY-MM-DD".
 * Menggunakan millisecond arithmetic — tidak terpengaruh DST atau timezone.
 *
 * @example
 * addDays("2026-05-28", 3)  → "2026-05-31"
 * addDays("2026-05-28", -1) → "2026-05-27"
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  return formatDate(new Date(d.getTime() + days * 86_400_000));
}

/**
 * Hitung selisih hari antara dua string tanggal (a - b).
 * Positif = a lebih baru dari b. Negatif = a lebih lama dari b.
 *
 * @example
 * diffDays("2026-06-03", "2026-06-01") →  2
 * diffDays("2026-05-25", "2026-05-28") → -3
 */
export function diffDays(a: string, b: string): number {
  const msA = parseLocalDate(a).getTime();
  const msB = parseLocalDate(b).getTime();
  return Math.round((msA - msB) / 86_400_000);
}

// ── Display formatting ────────────────────────────────────────────────────────

/**
 * Format tanggal untuk tampilan bahasa Indonesia.
 * Menggunakan getUTC* methods — konsisten dengan parseLocalDate + formatDate.
 *
 * @example
 * formatDisplayDate("2026-06-02")                          → "2 Jun 2026"
 * formatDisplayDate("2026-06-02", { weekday: true })       → "Sel, 2 Jun 2026"
 * formatDisplayDate("2026-06-02", { short: true })         → "2 Jun"
 * formatDisplayDate("2026-06-02", { longMonth: true })     → "2 Juni 2026"
 */
export function formatDisplayDate(
  dateStr: string,
  opts: { weekday?: boolean; short?: boolean; longMonth?: boolean } = {},
): string {
  const d = parseLocalDate(dateStr); // UTC midnight
  const day = d.getUTCDate();
  const mon = opts.longMonth
    ? BULAN_PANJANG[d.getUTCMonth()]
    : BULAN[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hari = HARI[d.getUTCDay()];

  if (opts.short) return `${day} ${mon}`;
  if (opts.weekday) return `${hari}, ${day} ${mon} ${year}`;
  return `${day} ${mon} ${year}`;
}

// ── Overdue check ─────────────────────────────────────────────────────────────

/**
 * Cek apakah sebuah waktu (format "HH:MM") sudah terlewat lebih dari X menit.
 * Menggunakan getUTC* pada nowWITA() — benar di semua browser timezone.
 *
 * @example
 * isTimeOverdue("08:00", 45) → true jika sekarang > 08:45 WITA
 */
export function isTimeOverdue(
  scheduledTime: string | null,
  toleranceMinutes = 45,
): boolean {
  if (!scheduledTime) return false;
  const [h, m] = scheduledTime.split(":").map(Number);
  const now = nowWITA();
  const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes(); // getUTC* ✓
  return nowMins > h * 60 + m + toleranceMinutes;
}
