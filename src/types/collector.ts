// src/types/collector.ts
// ─────────────────────────────────────────────────────────────────────────────
// Collector-specific types — extends types/index.ts
// Akan dipetakan ke Supabase tables: collector_routes, waste_logs
// ─────────────────────────────────────────────────────────────────────────────

/** Status setiap stop dalam rute harian */
export type StopStatus = "pending" | "done" | "skipped";

/** Kondisi fisik ampas kopi saat dijemput */
export type ConditionType = "basah" | "kering" | "mix";

/** Kategori mitra (cafe, hotel, restoran) */
export type MitraCategory = "cafe" | "hotel" | "resto";

/** Status verifikasi log oleh admin */
export type LogVerificationStatus = "verified" | "pending" | "skipped";

// ── Route & Stop ─────────────────────────────────────────────────────────────

export interface RouteStop {
  id: string;
  order: number;
  mitra_name: string;
  mitra_category: MitraCategory;
  address: string;
  scheduled_time: string; // format "HH:MM"
  estimated_kg: number;
  status: StopStatus;
  // Terisi setelah collector submit
  actual_kg?: number;
  condition?: ConditionType;
  notes?: string;
  photo_preview?: string; // base64 data URL untuk preview lokal
  location_coords?: string; // "lat, lng"
  location_accuracy?: number; // meter
  completed_at?: string; // format "HH:MM"
  skip_reason?: string;
}

export interface CollectorRoute {
  id: string;
  date: string; // "YYYY-MM-DD"
  collector_name: string;
  stops: RouteStop[];
}

// ── Form ─────────────────────────────────────────────────────────────────────

export interface StopFormData {
  qty: number;
  condition: ConditionType | null;
  photo: File | null;
  photoPreview: string | null;
  notes: string;
  locationCoords: string | null;
  locationAccuracy: number | null;
}

export const DEFAULT_FORM_DATA: StopFormData = {
  qty: 0,
  condition: null,
  photo: null,
  photoPreview: null,
  notes: "",
  locationCoords: null,
  locationAccuracy: null,
};

// ── History ──────────────────────────────────────────────────────────────────

export interface WasteLog {
  id: string;
  mitra_name: string;
  mitra_category: MitraCategory;
  date: string; // "DD Mon"
  time: string; // "HH:MM"
  kg: number;
  condition: ConditionType | null;
  status: LogVerificationStatus;
  has_photo: boolean;
  notes?: string;
  location_coords?: string;
  skip_reason?: string;
}

export interface WeeklyBar {
  day: string;
  kg: number;
  isToday: boolean;
}

// ── Skip reasons ─────────────────────────────────────────────────────────────

export const SKIP_REASONS = [
  "Mitra tutup",
  "Tidak ada ampas kopi",
  "Mitra tidak hadir",
  "Ampas sudah diambil pihak lain",
  "Lainnya",
] as const;

export type SkipReason = (typeof SKIP_REASONS)[number];
