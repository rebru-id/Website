// src/lib/supabase-partner.ts

import { createClient } from "@/lib/supabase/client";
import { generateInitialStop } from "@/lib/supabase-collector";
import { reportError } from "@/lib/report-error";

const supabase = createClient();

export type ApplicationStatus =
  | "pending"
  | "review"
  | "active"
  | "inactive"
  | "rejected";
export type PackageType = "kontributor" | "dampak" | "strategis";
export type SourcePlatform = "ig_landing" | "website";

export interface PartnerApplication {
  id: string;
  package_type: PackageType;
  organization: string;
  phone: string;
  email: string;
  jenis_usaha: string;
  volume_limbah: string;
  kota_custom: string | null;
  alamat_detail: string;
  message: string | null;
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  active_from: string | null;
  active_until: string | null;
  pic_name: string;
  kota_nama: string;
  kecamatan_nama: string;
  kelurahan_nama: string;
  source_platform: SourcePlatform;
  // ── Kolom baru Fase 1 ─────────────────────────────────────────────────────
  pickup_interval_days: number; // interval penjemputan dalam hari (default 3)
  last_pickup_date: string | null; // tanggal penjemputan terakhir, null = belum pernah
  // ── Fix — jadwal presisi, ditentukan admin lewat sesi konfirmasi privat ───
  preferred_pickup_time: string | null; // "HH:MM", null = admin belum set
  schedule_type: "interval" | "weekly_days";
  pickup_days: number[] | null; // 0=Minggu..6=Sabtu, hanya terisi utk weekly_days
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchPartnerApplications(): Promise<
  PartnerApplication[]
> {
  const { data, error } = await supabase
    .from("partner_applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as PartnerApplication[]) ?? [];
}

// Status-only update (reject / deactivate / reactivate / reconsider)
export async function updatePartnerStatus(
  id: string,
  status: ApplicationStatus,
  reviewedBy?: string,
): Promise<void> {
  const updates: Record<string, string> = { status };
  if (reviewedBy) {
    updates.reviewed_at = new Date().toISOString();
    updates.reviewed_by = reviewedBy;
  }
  const { error } = await supabase
    .from("partner_applications")
    .update(updates)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Approve — sets status active + masa aktif + jadwal penjemputan
// FASE 4: sekaligus auto-generate stop pertama sesuai active_from.
//
// Fix — signature direfactor dari 5 parameter posisional (dan sempat mau
// ditambah jadi 8) menjadi SATU object param. Alasan: makin banyak
// parameter ber-tipe sama (string/number) berurutan, makin gampang salah
// tanpa disadari TypeScript (tukar urutan dua argumen string, tidak ada
// error compile, tapi data salah kolom). Object param immun terhadap itu
// karena tiap nilai eksplisit namanya di call site.
//
// Return value sengaja bukan boolean sederhana — caller (PartnerSection.tsx)
// perlu tahu PERSIS salah satu dari 3 kemungkinan:
//   "generated"           → approve sukses, 1 stop pertama otomatis dibuat
//   "skipped_no_schedule" → approve sukses, TAPI SENGAJA tidak ada stop
//                            dibuat (kontributor, atau weekly_days tanpa
//                            hari dipilih) — BUKAN error, harus dikomunikasikan
//                            beda dari kegagalan generate biasa
//   "error"                → approve sukses, TAPI generate stop GAGAL
//                            (mis. tidak ada collector aktif) — perlu
//                            assign manual dari Urgent Queue
export interface ApprovePartnerInput {
  id: string;
  reviewedBy: string;
  activeFrom: string;
  activeUntil: string | null; // null = kontributor (tidak berbatas)
  pickupIntervalDays: number;
  scheduleType: "interval" | "weekly_days";
  pickupDays: number[]; // dipakai hanya kalau scheduleType === "weekly_days"
  preferredPickupTime: string; // "HH:MM"
}

export type ApprovePartnerResult =
  | { scheduleStatus: "generated" }
  | { scheduleStatus: "skipped_no_schedule" }
  | { scheduleStatus: "error"; scheduleError: string };

export async function approvePartner(
  input: ApprovePartnerInput,
): Promise<ApprovePartnerResult> {
  const { error } = await supabase
    .from("partner_applications")
    .update({
      status: "active",
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.reviewedBy,
      active_from: input.activeFrom,
      active_until: input.activeUntil,
      pickup_interval_days: input.pickupIntervalDays,
      schedule_type: input.scheduleType,
      pickup_days:
        input.scheduleType === "weekly_days" ? input.pickupDays : null,
      preferred_pickup_time: input.preferredPickupTime,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);

  // Approve DI DATABASE sudah berhasil di titik ini — apa pun yang terjadi
  // di generateInitialStop() TIDAK BOLEH membuat approvePartner() throw,
  // karena partner sudah terlanjur "active". Kegagalan cuma berarti admin
  // perlu assign manual sekali lewat Urgent Queue.
  try {
    const result = await generateInitialStop(input.id);
    if (result.status === "already_pending") {
      // Tidak seharusnya terjadi tepat setelah approve (partner baru saja
      // aktif, belum mungkin punya stop pending) — tapi kalau toh terjadi,
      // perlakukan sama seperti sukses generate (memang sudah ada jadwal).
      return { scheduleStatus: "generated" };
    }
    return { scheduleStatus: result.status };
  } catch (err: any) {
    // level "warn" (BUKAN default "error") SENGAJA dipilih — ini skenario
    // yang MEMANG kita antisipasi (misal tidak ada collector aktif), sudah
    // ditangani dengan baik lewat try/catch, dan sudah dikabari ke admin
    // lewat toast di PartnerSection.tsx.
    reportError("approvePartner.generateInitialStop", err, "warn");
    return {
      scheduleStatus: "error",
      scheduleError: err?.message ?? "Unknown error",
    };
  }
}

// Perpanjang masa aktif (untuk expired / expiring)
export async function extendPartner(
  id: string,
  reviewedBy: string,
  activeUntil: string,
): Promise<void> {
  const { error } = await supabase
    .from("partner_applications")
    .update({
      active_until: activeUntil,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Badge helper (untuk sidebar AdminDashboard) ───────────────────────────────
// Badge = pending baru + partner urgent (≤3 hari) + sudah expired

export function computePartnerBadge(partners: PartnerApplication[]): number {
  const now = Date.now();
  let count = 0;
  for (const p of partners) {
    if (p.status === "pending") {
      count++;
      continue;
    }
    if (p.status !== "active" || !p.active_until) continue;
    const daysLeft = Math.floor(
      (new Date(p.active_until).getTime() - now) / 86_400_000,
    );
    if (daysLeft <= 3) count++;
  }
  return count;
}

// ── Kolom baru Fase 1 ─────────────────────────────────────────────────────────

// Fix — updatePartnerSchedule() menggantikan updatePickupInterval() lama
// (yang ternyata dead code — tidak dipanggil dari komponen mana pun,
// meski komentarnya bilang "dipakai OperationalSection saat admin edit
// interval partner aktif"). Root cause gap itu: dulu tidak ada tombol
// simpan yang tersambung ke situ sama sekali di UI.
//
// Sekarang satu fungsi ini membungkus SEMUA field jadwal (interval, mode,
// hari, jam) sekaligus — dipakai PartnerSection.tsx lewat tombol
// "Simpan Jadwal" khusus partner yang statusnya SUDAH "active" (approve
// hanya berlaku sekali di awal; partner aktif butuh jalur update terpisah
// tanpa harus melalui alur approve ulang).
//
// SENGAJA TIDAK memanggil generateInitialStop()/generateNextStop() di
// sini — mengubah jadwal partner aktif tidak boleh langsung memicu
// generate stop baru di tengah siklus yang sedang berjalan (bisa bikin
// stop dobel kalau kebetulan ada stop pending). Perubahan jadwal baru
// berlaku efektif mulai siklus berikutnya, lewat generateNextStop() yang
// sudah otomatis baca field terbaru dari DB.
export async function updatePartnerSchedule(
  id: string,
  schedule: {
    pickupIntervalDays: number;
    scheduleType: "interval" | "weekly_days";
    pickupDays: number[];
    preferredPickupTime: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("partner_applications")
    .update({
      pickup_interval_days: schedule.pickupIntervalDays,
      schedule_type: schedule.scheduleType,
      pickup_days:
        schedule.scheduleType === "weekly_days" ? schedule.pickupDays : null,
      preferred_pickup_time: schedule.preferredPickupTime,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Update last_pickup_date — dipanggil otomatis setiap collector submit stop "done"
// Dipakai dari supabase-collector.ts → updateStopStatus()
export async function updateLastPickupDate(
  partnerId: string,
  date: string, // format "YYYY-MM-DD"
): Promise<void> {
  const { error } = await supabase
    .from("partner_applications")
    .update({ last_pickup_date: date })
    .eq("id", partnerId);
  if (error) throw new Error(error.message);
}

// countPartnersActivatedInRange
// ─────────────────────────────────────────────────────────────────────────────
// FASE 4.2 — dipakai untuk indikator tren "Mitra" di Overview.
export async function countPartnersActivatedInRange(
  startDate: string,
  endDate: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("partner_applications")
    .select("*", { count: "exact", head: true })
    .gte("active_from", startDate)
    .lt("active_from", endDate);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
