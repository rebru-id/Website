// src/utils/volume-limbah.ts
// ─────────────────────────────────────────────────────────────────────────────
// Konversi field `volume_limbah` partner_applications (rentang string bebas
// format yang diisi partner saat mendaftar — misal "1 – 5 kg / hari",
// "< 1 kg / hari") menjadi SATU angka estimasi kg untuk satu event pickup.
//
// KONVENSI (disepakati — dipakai KONSISTEN di semua jalur pembuatan stop,
// baik otomatis maupun manual admin):
//   - Ambil angka MAKSIMUM yang muncul di string (regex \d+(\.\d+)?)
//   - TIDAK dikalikan interval pickup — angka ini murni representasi
//     "estimasi kg per event pickup", BUKAN akumulasi selama X hari.
//     (Alasan: field ini cuma bantu ekspektasi awal collector/admin,
//     bukan angka presisi — dan admin selalu bisa koreksi manual di modal
//     Slot Manual/Generate Jadwal sebelum konfirmasi.)
//   - String kosong / tidak mengandung angka → null (biarkan pemanggil
//     memutuskan fallback, biasanya: biarkan admin isi manual)
//
// SEBELUM diekstrak ke sini, logika yang SAMA secara konsep ada di DUA
// tempat berbeda dengan HASIL BERBEDA untuk partner yang sama:
//   - OperationalSection.tsx (dulu: parseMaxKg, inline)     → max, tanpa interval
//   - supabase-collector.ts  (dulu: estimateStopKg, inline) → titik tengah × interval
// Sekarang cuma ada SATU implementasi, di sini — dipakai kedua sisi.
// ─────────────────────────────────────────────────────────────────────────────

export function estimateKgFromVolumeLimbah(
  volumeLimbah: string | null | undefined,
): number | null {
  if (!volumeLimbah) return null;
  const nums = volumeLimbah.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  return Math.max(...nums.map(Number));
}
