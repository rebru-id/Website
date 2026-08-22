// src/lib/supabase-esg.ts
// ─────────────────────────────────────────────────────────────────────────────
// Data layer ESG Report — FASE 10.2
// Pola mengikuti supabase-bioconversion.ts: module-level singleton client,
// throw Error kalau gagal (reportError dipanggil oleh PEMANGGIL, bukan di sini).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "./supabase/client";

const supabase = createClient();

export interface EsgKpiSummary {
  totalPickupKg: number;
  totalDryKg: number;
  totalCo2eBiocharKg: number | null;
  totalCo2eKomposKg: number | null;
  totalCo2eKg: number;
  biocharFactorDefined: boolean;
  komposFactorDefined: boolean;
  mitraTracked: number;
  pickupCount: number;
  pickupPartnerCount: number;
}

export async function fetchEsgKpiSummary(
  periodStart: string, // "YYYY-MM-DD"
  periodEnd: string, // "YYYY-MM-DD"
): Promise<EsgKpiSummary> {
  const { data, error } = await supabase.rpc("get_esg_kpi_summary", {
    p_start: periodStart,
    p_end: periodEnd,
  });

  if (error) throw new Error(error.message);
  const row = (data as any[])?.[0];

  return {
    totalPickupKg: Number(row?.total_pickup_kg ?? 0),
    totalDryKg: Number(row?.total_dry_kg ?? 0),
    totalCo2eBiocharKg:
      row?.total_co2e_biochar_kg == null
        ? null
        : Number(row.total_co2e_biochar_kg),
    totalCo2eKomposKg:
      row?.total_co2e_kompos_kg == null
        ? null
        : Number(row.total_co2e_kompos_kg),
    totalCo2eKg: Number(row?.total_co2e_kg ?? 0),
    biocharFactorDefined: Boolean(row?.biochar_factor_defined),
    komposFactorDefined: Boolean(row?.kompos_factor_defined),
    mitraTracked: Number(row?.mitra_tracked ?? 0),
    pickupCount: Number(row?.pickup_count ?? 0),
    pickupPartnerCount: Number(row?.pickup_partner_count ?? 0),
  };
}

// Helper kecil: hitung tanggal awal & akhir dari satu bulan.
// Contoh: getMonthRangeISO("2026-05") → { start: "2026-05-01", end: "2026-05-31" }
export function getMonthRangeISO(yearMonth: string): {
  start: string;
  end: string;
} {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate(); // trik: hari ke-0 bulan berikutnya = hari terakhir bulan ini
  const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export interface EsgPartnerBreakdownBasic {
  partnerId: string;
  organization: string;
  jenisUsaha: string;
  dryKg: number;
  dryPct: number;
  pickupDone: number;
  pickupTotal: number;
}

export async function fetchEsgPartnerBreakdownBasic(
  periodStart: string,
  periodEnd: string,
): Promise<EsgPartnerBreakdownBasic[]> {
  const { data, error } = await supabase.rpc(
    "get_esg_partner_breakdown_basic",
    { p_start: periodStart, p_end: periodEnd },
  );

  if (error) throw new Error(error.message);

  return ((data as any[]) ?? []).map((row) => ({
    partnerId: row.partner_id,
    organization: row.organization,
    jenisUsaha: row.jenis_usaha,
    dryKg: Number(row.dry_kg ?? 0),
    dryPct: Number(row.dry_pct ?? 0),
    pickupDone: Number(row.pickup_done ?? 0),
    pickupTotal: Number(row.pickup_total ?? 0),
  }));
}

export interface EsgPartnerProductionBreakdown {
  partnerId: string;
  biocharKg: number;
  komposKg: number;
  co2eKg: number;
  biocharFactorDefined: boolean;
  komposFactorDefined: boolean;
}

export async function fetchEsgPartnerProductionBreakdown(
  periodStart: string,
  periodEnd: string,
): Promise<EsgPartnerProductionBreakdown[]> {
  const { data, error } = await supabase.rpc(
    "get_esg_partner_production_breakdown",
    { p_start: periodStart, p_end: periodEnd },
  );

  if (error) throw new Error(error.message);

  return ((data as any[]) ?? []).map((row) => ({
    partnerId: row.partner_id,
    biocharKg: Number(row.biochar_kg ?? 0),
    komposKg: Number(row.kompos_kg ?? 0),
    co2eKg: Number(row.co2e_kg ?? 0),
    biocharFactorDefined: Boolean(row.biochar_factor_defined),
    komposFactorDefined: Boolean(row.kompos_factor_defined),
  }));
}

export interface EsgMaterialBreakdown {
  materialId: string;
  materialCode: string;
  materialName: string;
  isFoodWaste: boolean;
  dryKg: number;
  dryPct: number;
}

export async function fetchEsgMaterialBreakdown(
  periodStart: string,
  periodEnd: string,
): Promise<EsgMaterialBreakdown[]> {
  const { data, error } = await supabase.rpc("get_esg_material_breakdown", {
    p_start: periodStart,
    p_end: periodEnd,
  });

  if (error) throw new Error(error.message);

  return ((data as any[]) ?? []).map((row) => ({
    materialId: row.material_id,
    materialCode: row.material_code,
    materialName: row.material_name,
    isFoodWaste: Boolean(row.is_food_waste),
    dryKg: Number(row.dry_kg ?? 0),
    dryPct: Number(row.dry_pct ?? 0),
  }));
}

export interface EsgComplianceItem {
  id: string;
  label: string;
  done: boolean;
  tag: string | null;
  sortOrder: number;
}

export async function fetchEsgComplianceChecklist(): Promise<
  EsgComplianceItem[]
> {
  const { data, error } = await supabase
    .from("esg_compliance_checklist")
    .select("id, label, done, tag, sort_order")
    .order("sort_order");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    label: row.label,
    done: row.done,
    tag: row.tag,
    sortOrder: row.sort_order,
  }));
}

export async function updateEsgComplianceDone(
  id: string,
  done: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("esg_compliance_checklist")
    .update({ done, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export interface EsgReportPeriodLock {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  lockedAt: string;
  snapshot: {
    kpi: EsgKpiSummary;
    materials: EsgMaterialBreakdown[];
  };
}

export async function fetchEsgReportPeriodLock(
  period: string,
): Promise<EsgReportPeriodLock | null> {
  const { data, error } = await supabase
    .from("esg_report_periods")
    .select("id, period, period_start, period_end, locked_at, snapshot")
    .eq("period", period)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    period: data.period,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    lockedAt: data.locked_at,
    snapshot: data.snapshot,
  };
}

export async function lockEsgReportPeriod(
  period: string,
  periodStart: string,
  periodEnd: string,
  snapshot: { kpi: EsgKpiSummary; materials: EsgMaterialBreakdown[] },
): Promise<void> {
  const { error } = await supabase.from("esg_report_periods").insert({
    period,
    period_start: periodStart,
    period_end: periodEnd,
    snapshot,
  });

  if (error) throw new Error(error.message);
}

export interface EsgPartnerDetail {
  partnerId: string;
  organization: string;
  jenisUsaha: string;
  volumeLimbah: string;
  alamatDetail: string;
  phone: string;
  email: string;
  picName: string;
}

export async function fetchEsgPartnerDetail(
  partnerId: string,
): Promise<EsgPartnerDetail | null> {
  const { data, error } = await supabase
    .from("partner_applications")
    .select(
      "id, organization, jenis_usaha, volume_limbah, alamat_detail, phone, email, pic_name",
    )
    .eq("id", partnerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    partnerId: data.id,
    organization: data.organization,
    jenisUsaha: data.jenis_usaha,
    volumeLimbah: data.volume_limbah,
    alamatDetail: data.alamat_detail,
    phone: data.phone,
    email: data.email,
    picName: data.pic_name,
  };
}

export interface EsgPartnerPickupStop {
  id: string;
  routeDate: string;
  actualKg: number | null;
  status: string;
  condition: string | null;
}

export async function fetchEsgPartnerPickupStops(
  partnerId: string,
  periodStart: string,
  periodEnd: string,
): Promise<EsgPartnerPickupStop[]> {
  const { data, error } = await supabase.rpc("get_esg_partner_pickup_stops", {
    p_partner_id: partnerId,
    p_start: periodStart,
    p_end: periodEnd,
  });

  if (error) throw new Error(error.message);

  return ((data as any[]) ?? []).map((row) => ({
    id: row.stop_id,
    routeDate: row.route_date,
    actualKg: row.actual_kg === null ? null : Number(row.actual_kg),
    status: row.status,
    condition: row.condition,
  }));
}
