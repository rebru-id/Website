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

// Approve — sets status active + masa aktif + interval penjemputan
// FASE 4: sekaligus auto-generate stop pertama sesuai active_from.
//
// Return value sengaja bukan void lagi — caller (PartnerSection.tsx) perlu
// tahu apakah auto-generate berhasil atau tidak, supaya bisa kasih toast
// yang jujur ke admin ("approve sukses, TAPI jadwal otomatis gagal — assign
// manual dari Urgent Queue") alih-alih pura-pura semua baik-baik saja.
export async function approvePartner(
  id: string,
  reviewedBy: string,
  activeFrom: string,
  activeUntil: string | null, // null = kontributor (tidak berbatas)
  pickupIntervalDays: number = 3, // default 3 hari jika tidak diisi
): Promise<{ scheduleGenerated: boolean; scheduleError?: string }> {
  const { error } = await supabase
    .from("partner_applications")
    .update({
      status: "active",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
      active_from: activeFrom,
      active_until: activeUntil,
      pickup_interval_days: pickupIntervalDays,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  // Approve DI DATABASE sudah berhasil di titik ini — apa pun yang terjadi
  // di generateInitialStop() TIDAK BOLEH membuat approvePartner() throw,
  // karena partner sudah terlanjur "active". Kegagalan cuma berarti admin
  // perlu assign manual sekali lewat Urgent Queue.
  try {
    await generateInitialStop(id);
    return { scheduleGenerated: true };
  } catch (err: any) {
    // level "warn" (BUKAN default "error") SENGAJA dipilih — ini skenario
    // yang MEMANG kita antisipasi (misal tidak ada collector aktif), sudah
    // ditangani dengan baik lewat try/catch, dan sudah dikabari ke admin
    // lewat toast di PartnerSection.tsx.
    reportError("approvePartner.generateInitialStop", err, "warn");
    return { scheduleGenerated: false, scheduleError: err?.message };
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

// Update interval penjemputan saja (tanpa mengubah status)
// Dipakai dari OperationalSection saat admin edit interval partner aktif
export async function updatePickupInterval(
  id: string,
  pickupIntervalDays: number,
): Promise<void> {
  const { error } = await supabase
    .from("partner_applications")
    .update({ pickup_interval_days: pickupIntervalDays })
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
