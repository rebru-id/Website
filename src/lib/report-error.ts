// src/lib/report-error.ts
// ─────────────────────────────────────────────────────────────────────────────
// reportError — titik tunggal untuk mencatat error non-fatal (kegagalan fetch,
// kegagalan operasi yang sudah ditangani try/catch) di seluruh dashboard.
//
// FASE 2.3 — SEBELUM ini, setiap file punya console.error/console.warn
// sendiri-sendiri dengan format pesan yang tidak konsisten. Sekarang semua
// lewat sini, supaya:
//   1. Format log konsisten — gampang dicari di browser console.
//   2. Kalau nanti mau pasang Sentry/LogRocket, CUKUP ubah isi fungsi ini,
//      tidak perlu ubah satu-satu di puluhan file.
//
// Cara pakai:
//   import { reportError } from "@/lib/report-error";
//   reportError("OverviewSection.loadCoreData", err);
// ─────────────────────────────────────────────────────────────────────────────

export function reportError(
  context: string,
  error: unknown,
  level: "error" | "warn" = "error",
): void {
  const message = error instanceof Error ? error.message : String(error);

  if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(`[${context}]`, message, error);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, message, error);
  }

  // TODO: Sprint berikutnya — kirim ke monitoring service, contoh:
  //   Sentry.captureException(error, { tags: { context, level } });
}
