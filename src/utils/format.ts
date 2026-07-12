// src/utils/format.ts

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

// FASE 4.2 — Indikator tren KPI card (Overview)
//
// Return null kalau tidak ada baseline (previous === 0) — sengaja BUKAN
// dianggap "turun 100%" atau semacamnya, karena baseline 0 tidak punya arti
// persentase yang valid. Pemanggil menampilkan badge tren hanya kalau hasil
// bukan null (pola sama seperti monthlyDeltaPct yang sudah ada).
export function computeTrendPct(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
