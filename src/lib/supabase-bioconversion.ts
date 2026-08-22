// src/lib/supabase-bioconversion.ts
// ─────────────────────────────────────────────────────────────────────────────
// Data layer Bio-Conversion — BC-1
//
// Alur: collection_stops (pickup, sudah ada) → batches (dryer, per-partner)
// → stock_batches (mixed lintas-partner, via junction stock_batch_sources)
// → production_runs (biochar/kompos/briket/ecogoods)
//
// Pola mengikuti supabase-collector.ts/supabase-partner.ts: module-level
// singleton client, throw Error kalau gagal (reportError dipanggil oleh
// PEMANGGIL, bukan di sini — konsisten dengan seluruh codebase).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "./supabase/client";

const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────

export type BatchStatus = "drying" | "done" | "cancelled";
export type StockBatchStatus = "accumulating" | "full" | "used";
export type ProductType = "biochar" | "kompos" | "briket" | "ecogoods";
export type ProductionStatus = "processing" | "done" | "cancelled";

export interface Batch {
  id: string;
  batch_code: string;
  stop_id: string;
  partner_id: string;
  input_wet_kg: number;
  output_dry_kg: number | null;
  status: BatchStatus;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface BatchWithPartner extends Batch {
  partner: { organization: string } | null;
  // FASE BC-4.1 — order_number dari collection_stops asal, sebagai acuan
  // traceability yang lebih familiar untuk admin (lihat feedback lapangan).
  stop: { order_number: string | null } | null;
}

// FASE BC-4.1 — dry kg batch yang SUDAH dialokasikan (lintas semua pool) +
// sisa yang belum dialokasikan. Dipakai untuk cegah over-allocation.
export interface BatchAllocationInfo {
  batchId: string;
  allocatedKg: number;
  remainingKg: number;
}

// FASE BC-4.1 — breakdown pemakaian 1 pool stock untuk produksi: sudah
// dipakai berapa kg (lintas semua production_runs non-cancelled), sisa
// berapa, dan rincian dipakai untuk produksi apa saja.
export interface StockUsageInfo {
  stockBatchId: string;
  usedKg: number;
  remainingKg: number;
  runs: { runCode: string; productType: ProductType; inputKg: number }[];
}

export interface StockBatch {
  id: string;
  stock_code: string;
  threshold_kg: number;
  current_kg: number;
  status: StockBatchStatus;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

export interface ProductionRun {
  id: string;
  run_code: string;
  stock_batch_id: string;
  product_type: ProductType;
  input_kg: number;
  // FASE BC-4.2 — pemakaian AKTUAL (bisa lebih kecil dari input_kg/rencana
  // kalau ada sisa yang dikembalikan ke pool). null selama status masih
  // "processing".
  actual_input_kg: number | null;
  output_kg: number | null;
  status: ProductionStatus;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface BioKpiSummary {
  totalPickupKg: number;
  totalDryKg: number;
  stockAvailableKg: number;
  totalProductionKg: number;
}

export interface PartnerContribution {
  partnerId: string;
  organization: string;
  dryKg: number;
  pct: number;
}

export interface EligibleStop {
  id: string;
  partnerId: string;
  organization: string;
  actualKg: number;
  completedAt: string;
  // FASE BC-4.3 — untuk tampilan dropdown "Catat Batch Baru" (FIFO)
  orderNumber: string | null;
}

export interface StockComposition {
  partnerOrganization: string;
  dryKgAllocated: number;
}

// ── Dashboard / KPI ─────────────────────────────────────────────────────────

// Agregasi terjadi di Postgres (RPC), bukan tarik semua baris ke browser —
// lihat bc1-kpi-rpc.sql. Konsisten dengan get_monthly_pickup_stats() Overview.
export async function fetchBioKpiSummary(
  periodStart: string,
  periodEnd: string,
): Promise<BioKpiSummary> {
  const { data, error } = await supabase.rpc("get_bioconversion_kpi_summary", {
    p_start: periodStart,
    p_end: periodEnd,
  });

  if (error) throw new Error(error.message);
  const row = (data as any[])?.[0];
  return {
    totalPickupKg: Number(row?.total_pickup_kg ?? 0),
    totalDryKg: Number(row?.total_dry_kg ?? 0),
    stockAvailableKg: Number(row?.stock_available_kg ?? 0),
    totalProductionKg: Number(row?.total_production_kg ?? 0),
  };
}

export async function fetchActiveBatches(): Promise<BatchWithPartner[]> {
  const { data, error } = await supabase
    .from("batches")
    .select(
      "*, partner:partner_applications(organization), stop:collection_stops(order_number)",
    )
    .eq("status", "drying")
    .order("started_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as BatchWithPartner[]) ?? [];
}

// Breakdown kontribusi partner (dry kg) dalam periode tertentu — menggantikan
// PARTNER_DATA mock di DashboardTab.
export async function fetchPartnerContributionBreakdown(
  periodStart: string,
  periodEnd: string,
): Promise<PartnerContribution[]> {
  const { data, error } = await supabase
    .from("batches")
    .select("output_dry_kg, partner:partner_applications(id, organization)")
    .eq("status", "done")
    .gte("completed_at", periodStart)
    .lt("completed_at", periodEnd);

  if (error) throw new Error(error.message);

  const totals = new Map<string, { organization: string; dryKg: number }>();
  for (const row of (data as any[]) ?? []) {
    const partner = row.partner;
    if (!partner) continue;
    const dryKg = Number(row.output_dry_kg ?? 0);
    const existing = totals.get(partner.id);
    if (existing) {
      existing.dryKg += dryKg;
    } else {
      totals.set(partner.id, { organization: partner.organization, dryKg });
    }
  }

  const grandTotal = [...totals.values()].reduce((sum, t) => sum + t.dryKg, 0);

  return [...totals.entries()]
    .map(([partnerId, t]) => ({
      partnerId,
      organization: t.organization,
      dryKg: Number(t.dryKg.toFixed(1)),
      pct:
        grandTotal > 0 ? Number(((t.dryKg / grandTotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.dryKg - a.dryKg);
}

// ── Batch Management ──────────────────────────────────────────────────────────

export async function fetchBatches(filter?: {
  status?: BatchStatus;
}): Promise<BatchWithPartner[]> {
  let query = supabase
    .from("batches")
    .select(
      "*, partner:partner_applications(organization), stop:collection_stops(order_number)",
    )
    .order("started_at", { ascending: false });

  if (filter?.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as unknown as BatchWithPartner[]) ?? [];
}

// Stop yang eligible dijadikan batch baru: status "done", belum punya batch.
// LEFT JOIN batches lalu filter di JS (Supabase-js belum mendukung
// "WHERE NOT EXISTS" langsung lewat query builder untuk kasus sesederhana ini).
//
// FASE BC-4.3 — diurutkan FIFO (completed_at ASCENDING, paling lama duluan)
// karena ampas kopi adalah bahan yang menurun kualitasnya — pickup paling
// lama harus diproses duluan. Sebelumnya diurutkan descending (terbaru
// duluan), yang justru berlawanan dengan prinsip FIFO.
export async function fetchEligibleStopsForBatch(): Promise<EligibleStop[]> {
  const { data, error } = await supabase
    .from("collection_stops")
    .select(
      "id, order_number, actual_kg, completed_at, partner_id, partner:partner_applications(organization), batches(id)",
    )
    .eq("status", "done")
    .order("completed_at", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data as any[]) ?? [])
    .filter((row) => !row.batches || row.batches.length === 0)
    .map((row) => ({
      id: row.id,
      partnerId: row.partner_id,
      organization: row.partner?.organization ?? "—",
      actualKg: Number(row.actual_kg ?? 0),
      completedAt: row.completed_at,
      orderNumber: row.order_number ?? null,
    }));
}

export async function createBatch(
  stopId: string,
  partnerId: string,
  inputWetKg: number,
): Promise<Batch> {
  const { data, error } = await supabase
    .from("batches")
    .insert({
      stop_id: stopId,
      partner_id: partnerId,
      input_wet_kg: inputWetKg,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Batch;
}

export async function completeBatch(
  batchId: string,
  outputDryKg: number,
): Promise<void> {
  const { error } = await supabase
    .from("batches")
    .update({
      output_dry_kg: outputDryKg,
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  if (error) throw new Error(error.message);
}

export async function cancelBatch(
  batchId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase
    .from("batches")
    .update({ status: "cancelled", notes: reason })
    .eq("id", batchId);

  if (error) throw new Error(error.message);
}

// ── Stock Management ──────────────────────────────────────────────────────────

export async function fetchStockBatches(filter?: {
  status?: StockBatchStatus;
}): Promise<StockBatch[]> {
  let query = supabase
    .from("stock_batches")
    .select("*")
    .order("opened_at", { ascending: false });

  if (filter?.status) {
    query = query.eq("status", filter.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as StockBatch[]) ?? [];
}

export async function openNewStockBatch(
  thresholdKg: number,
): Promise<StockBatch> {
  const { data, error } = await supabase
    .from("stock_batches")
    .insert({ threshold_kg: thresholdKg })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as StockBatch;
}

// FASE BC-4.1 — total dry kg yang SUDAH dialokasikan per batch (lintas semua
// pool), dipakai untuk hitung sisa & cegah over-allocation. Dataset kecil
// (jumlah batch admin-facing), aman diagregasi di JS.
export async function fetchBatchAllocatedTotals(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabase
    .from("stock_batch_sources")
    .select("batch_id, dry_kg_allocated");

  if (error) throw new Error(error.message);

  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    totals[row.batch_id] =
      (totals[row.batch_id] ?? 0) + Number(row.dry_kg_allocated);
  }
  return totals;
}

// FASE BC-4.1 — Alokasikan dry kg dari 1 batch ke 1 pool stock.
//
// PERBAIKAN dari versi sebelumnya (2 bug ditemukan lewat pemakaian nyata):
//   1. SEKARANG memvalidasi sisa dry output BATCH (bukan cuma kapasitas
//      pool) — batch tidak bisa lagi "dijual" lebih dari total kering
//      yang benar-benar dihasilkan.
//   2. SEKARANG upsert (update kalau baris untuk pasangan batch+pool ini
//      sudah ada, insert kalau belum) — bukan insert buta yang gagal kena
//      UNIQUE constraint saat admin menambah alokasi ke pool yang sama.
export async function allocateBatchToStock(
  batchId: string,
  stockBatchId: string,
  dryKgAllocated: number,
): Promise<void> {
  const EPS = 0.001; // toleransi floating point

  // 1. Validasi sisa dry output batch
  const { data: batch, error: bErr } = await supabase
    .from("batches")
    .select("output_dry_kg")
    .eq("id", batchId)
    .single();
  if (bErr) throw new Error(bErr.message);
  if (batch.output_dry_kg == null) {
    throw new Error("Batch belum diselesaikan (belum ada berat kering).");
  }

  const { data: existingAllocations, error: eaErr } = await supabase
    .from("stock_batch_sources")
    .select("dry_kg_allocated")
    .eq("batch_id", batchId);
  if (eaErr) throw new Error(eaErr.message);

  const alreadyAllocated = (existingAllocations ?? []).reduce(
    (sum, row) => sum + Number(row.dry_kg_allocated),
    0,
  );
  const remaining = batch.output_dry_kg - alreadyAllocated;

  if (dryKgAllocated > remaining + EPS) {
    throw new Error(
      `Alokasi melebihi sisa dry output batch (sisa ${remaining.toFixed(1)} kg).`,
    );
  }

  // 2. Validasi kapasitas pool (seperti sebelumnya)
  const { data: stockBatch, error: sbErr } = await supabase
    .from("stock_batches")
    .select("current_kg, threshold_kg, status")
    .eq("id", stockBatchId)
    .single();

  if (sbErr) throw new Error(sbErr.message);
  if (stockBatch.status === "used") {
    throw new Error(
      "Pool stock ini sudah dipakai produksi, tidak bisa diisi lagi.",
    );
  }
  if (stockBatch.current_kg + dryKgAllocated > stockBatch.threshold_kg + EPS) {
    throw new Error(
      `Alokasi melebihi kapasitas pool (sisa ${(stockBatch.threshold_kg - stockBatch.current_kg).toFixed(1)} kg).`,
    );
  }

  // 3. Upsert — kalau batch ini SUDAH pernah dialokasikan ke pool yang SAMA,
  //    tambahkan ke baris yang ada, JANGAN insert baris baru (UNIQUE
  //    constraint stock_batch_id+batch_id akan menolaknya).
  const { data: existingRow, error: erErr } = await supabase
    .from("stock_batch_sources")
    .select("id, dry_kg_allocated")
    .eq("stock_batch_id", stockBatchId)
    .eq("batch_id", batchId)
    .maybeSingle();
  if (erErr) throw new Error(erErr.message);

  if (existingRow) {
    const { error } = await supabase
      .from("stock_batch_sources")
      .update({
        dry_kg_allocated: existingRow.dry_kg_allocated + dryKgAllocated,
      })
      .eq("id", existingRow.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("stock_batch_sources").insert({
      stock_batch_id: stockBatchId,
      batch_id: batchId,
      dry_kg_allocated: dryKgAllocated,
    });
    if (error) throw new Error(error.message);
  }

  // current_kg akan ter-update otomatis via trigger recalc_stock_batch_current_kg.
  // Di sini kita cuma perlu tandai "full" kalau alokasi ini pas memenuhi kapasitas.
  const newTotal = stockBatch.current_kg + dryKgAllocated;
  if (newTotal >= stockBatch.threshold_kg - EPS) {
    const { error: updateErr } = await supabase
      .from("stock_batches")
      .update({ status: "full" })
      .eq("id", stockBatchId);
    if (updateErr) throw new Error(updateErr.message);
  }
}

export async function fetchStockBatchComposition(
  stockBatchId: string,
): Promise<StockComposition[]> {
  const { data, error } = await supabase
    .from("stock_batch_sources")
    .select(
      "dry_kg_allocated, batch:batches(partner:partner_applications(organization))",
    )
    .eq("stock_batch_id", stockBatchId);

  if (error) throw new Error(error.message);

  return ((data as any[]) ?? []).map((row) => ({
    partnerOrganization: row.batch?.partner?.organization ?? "—",
    dryKgAllocated: Number(row.dry_kg_allocated ?? 0),
  }));
}

// ── Production ────────────────────────────────────────────────────────────────

// FASE BC-4.2 — Hitung total kg yang SUDAH terpakai dari 1 pool stock.
//
// Untuk run berstatus "done": pakai actual_input_kg (pemakaian SEBENARNYA,
// bisa lebih kecil dari rencana kalau ada sisa dikembalikan).
// Untuk run berstatus "processing": pakai input_kg (rencana — aktualnya
// belum diketahui sampai produksi selesai).
//
// SATU-SATUNYA tempat yang menghitung ini — dipakai fetchStockUsage(),
// createProductionRun() (validasi), dan recalcStockBatchStatus(). Kalau
// definisi "terpakai" berubah nanti, cukup ubah di sini.
async function sumStockUsedKg(stockBatchId: string): Promise<number> {
  const { data: runs, error } = await supabase
    .from("production_runs")
    .select("input_kg, actual_input_kg, status")
    .eq("stock_batch_id", stockBatchId)
    .neq("status", "cancelled");
  if (error) throw new Error(error.message);

  return (runs ?? []).reduce((sum, r) => {
    const used =
      r.status === "done"
        ? Number(r.actual_input_kg ?? r.input_kg)
        : Number(r.input_kg);
    return sum + used;
  }, 0);
}

// FASE BC-4.2 — Hitung ulang status pool stock setelah produksi selesai.
//
// PENTING: pool bisa BOLAK-BALIK antara "full" <-> "used" — kalau produksi
// menyisakan sesuatu (sisa dikembalikan lewat actual_input_kg < input_kg),
// pool otomatis kembali ke "full" supaya bisa dipakai produksi lain. Baru
// benar-benar "used" kalau sisa sungguhan mencapai 0.
//
// Sengaja TIDAK menyentuh pool berstatus "accumulating" — fungsi ini cuma
// relevan untuk pool yang sudah masuk tahap produksi.
async function recalcStockBatchStatus(stockBatchId: string): Promise<void> {
  const EPS = 0.001;

  const { data: stockBatch, error: sbErr } = await supabase
    .from("stock_batches")
    .select("current_kg, status")
    .eq("id", stockBatchId)
    .single();
  if (sbErr) throw new Error(sbErr.message);

  if (stockBatch.status === "accumulating") return;

  const used = await sumStockUsedKg(stockBatchId);
  const remaining = stockBatch.current_kg - used;

  if (remaining <= EPS) {
    const { error } = await supabase
      .from("stock_batches")
      .update({ status: "used", closed_at: new Date().toISOString() })
      .eq("id", stockBatchId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("stock_batches")
      .update({ status: "full", closed_at: null })
      .eq("id", stockBatchId);
    if (error) throw new Error(error.message);
  }
}

// Breakdown pemakaian production per pool stock: sudah dipakai berapa kg
// (aktual untuk yang done, rencana untuk yang masih processing), sisa
// berapa, dan dipakai untuk produksi apa saja. Dipakai UI untuk tampilkan
// "sisa X kg" per pool.
export async function fetchStockUsage(
  stockBatchId: string,
): Promise<StockUsageInfo> {
  const { data: stockBatch, error: sbErr } = await supabase
    .from("stock_batches")
    .select("current_kg")
    .eq("id", stockBatchId)
    .single();
  if (sbErr) throw new Error(sbErr.message);

  const { data: runs, error: rErr } = await supabase
    .from("production_runs")
    .select("run_code, product_type, input_kg, actual_input_kg, status")
    .eq("stock_batch_id", stockBatchId)
    .neq("status", "cancelled");
  if (rErr) throw new Error(rErr.message);

  const runsWithUsed = (runs ?? []).map((r) => ({
    runCode: r.run_code,
    productType: r.product_type,
    inputKg:
      r.status === "done"
        ? Number(r.actual_input_kg ?? r.input_kg)
        : Number(r.input_kg),
  }));

  const usedKg = runsWithUsed.reduce((sum, r) => sum + r.inputKg, 0);

  return {
    stockBatchId,
    usedKg: Number(usedKg.toFixed(1)),
    remainingKg: Number((stockBatch.current_kg - usedKg).toFixed(1)),
    runs: runsWithUsed,
  };
}

export async function fetchProductionRuns(filter?: {
  productType?: ProductType;
  status?: ProductionStatus;
}): Promise<ProductionRun[]> {
  let query = supabase
    .from("production_runs")
    .select("*")
    .order("started_at", { ascending: false });

  if (filter?.productType) query = query.eq("product_type", filter.productType);
  if (filter?.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ProductionRun[]) ?? [];
}

// FASE BC-4.2 — Mulai proses produksi dari 1 pool stock.
//
// PERBAIKAN dari versi sebelumnya:
//   1. WAJIB status pool "full" (bukan lagi mengizinkan "accumulating" —
//      itu bug konsep yang ditemukan lewat pemakaian nyata: produksi tidak
//      boleh diambil dari pool yang belum genap kuantitasnya).
//   2. Perhitungan sisa pakai sumStockUsedKg() — otomatis benar walau ada
//      produksi sebelumnya yang menyisakan sesuatu (sisa dikembalikan).
export async function createProductionRun(
  stockBatchId: string,
  productType: ProductType,
  inputKg: number,
): Promise<ProductionRun> {
  const EPS = 0.001;

  const { data: stockBatch, error: sbErr } = await supabase
    .from("stock_batches")
    .select("current_kg, status")
    .eq("id", stockBatchId)
    .single();
  if (sbErr) throw new Error(sbErr.message);
  if (stockBatch.status !== "full") {
    throw new Error(
      "Pool stock ini belum siap diproduksi — harus berstatus 'full' (sudah penuh terisi) dulu.",
    );
  }

  const alreadyUsed = await sumStockUsedKg(stockBatchId);
  const remaining = stockBatch.current_kg - alreadyUsed;

  if (inputKg > remaining + EPS) {
    throw new Error(
      `Input melebihi sisa stock pool (sisa ${remaining.toFixed(1)} kg).`,
    );
  }

  const { data, error } = await supabase
    .from("production_runs")
    .insert({
      stock_batch_id: stockBatchId,
      product_type: productType,
      input_kg: inputKg,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await recalcStockBatchStatus(stockBatchId);

  return data as ProductionRun;
}

// FASE BC-4.2 — Selesaikan produksi.
//
// actualInputKg (opsional): pemakaian SEBENARNYA. Kalau tidak diisi,
// default sama dengan rencana awal (input_kg) — perilaku identik dengan
// sebelum ada fitur "kembalikan sisa". Kalau diisi LEBIH KECIL dari
// rencana, selisihnya otomatis "dikembalikan" ke pool (pool bisa balik ke
// status "full" kalau jadi ada sisa lagi — lihat recalcStockBatchStatus).
export async function completeProductionRun(
  runId: string,
  outputKg: number,
  actualInputKg?: number,
): Promise<void> {
  const EPS = 0.001;

  const { data: run, error: rErr } = await supabase
    .from("production_runs")
    .select("input_kg, stock_batch_id")
    .eq("id", runId)
    .single();
  if (rErr) throw new Error(rErr.message);

  const finalActualInput = actualInputKg ?? run.input_kg;
  if (finalActualInput > run.input_kg + EPS) {
    throw new Error(
      "Pemakaian aktual tidak boleh melebihi rencana awal produksi.",
    );
  }
  if (finalActualInput < 0) {
    throw new Error("Pemakaian aktual tidak boleh negatif.");
  }

  const { error } = await supabase
    .from("production_runs")
    .update({
      output_kg: outputKg,
      actual_input_kg: finalActualInput,
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
  if (error) throw new Error(error.message);

  await recalcStockBatchStatus(run.stock_batch_id);
}

// ── Yield Report — BC-5 ────────────────────────────────────────────────────

export interface YieldReportRow {
  partnerId: string;
  organization: string;
  jenisUsaha: string;
  kecamatan: string;
  wetKg: number;
  dryKg: number;
  lossPct: number;
  stockPct: number;
  biocharKg: number;
  komposKg: number;
  briketKg: number;
  ecogoodsKg: number;
}

// Laporan yield per partner untuk periode tertentu — menggantikan
// YIELD_ROWS mock di YieldTab. Atribusi produksi (biochar/kompos/dst.)
// PROPORSIONAL berdasarkan dry weight kontribusi partner ke total stock
// periode itu (sesuai label yang sudah ada di UI: "Atribusi produksi =
// proporsional berdasarkan dry weight kontribusi ke stock").
//
// @param periodStart inklusif, format "YYYY-MM-DD"
// @param periodEnd    eksklusif, format "YYYY-MM-DD"
export async function fetchYieldReport(
  periodStart: string,
  periodEnd: string,
): Promise<YieldReportRow[]> {
  // 1. Batch selesai di periode ini + info partner
  const { data: batches, error: bErr } = await supabase
    .from("batches")
    .select(
      "input_wet_kg, output_dry_kg, partner:partner_applications(id, organization, jenis_usaha, kecamatan_nama)",
    )
    .eq("status", "done")
    .gte("completed_at", periodStart)
    .lt("completed_at", periodEnd);
  if (bErr) throw new Error(bErr.message);

  // 2. Agregasi wet/dry kg per partner
  const totals = new Map<
    string,
    {
      organization: string;
      jenisUsaha: string;
      kecamatan: string;
      wetKg: number;
      dryKg: number;
    }
  >();
  for (const row of (batches as any[]) ?? []) {
    const partner = row.partner;
    if (!partner) continue;
    const wetKg = Number(row.input_wet_kg ?? 0);
    const dryKg = Number(row.output_dry_kg ?? 0);
    const existing = totals.get(partner.id);
    if (existing) {
      existing.wetKg += wetKg;
      existing.dryKg += dryKg;
    } else {
      totals.set(partner.id, {
        organization: partner.organization,
        jenisUsaha: partner.jenis_usaha,
        kecamatan: partner.kecamatan_nama ?? "—",
        wetKg,
        dryKg,
      });
    }
  }

  const grandTotalDry = [...totals.values()].reduce(
    (sum, t) => sum + t.dryKg,
    0,
  );

  // 3. Total produksi per jenis produk di periode ini (dasar atribusi)
  const { data: runs, error: rErr } = await supabase
    .from("production_runs")
    .select("product_type, output_kg")
    .eq("status", "done")
    .gte("completed_at", periodStart)
    .lt("completed_at", periodEnd);
  if (rErr) throw new Error(rErr.message);

  const productionTotals: Record<ProductType, number> = {
    biochar: 0,
    kompos: 0,
    briket: 0,
    ecogoods: 0,
  };
  for (const r of (runs as any[]) ?? []) {
    productionTotals[r.product_type as ProductType] += Number(r.output_kg ?? 0);
  }

  // 4. Susun baris laporan, atribusi proporsional berdasar stockPct
  return [...totals.entries()]
    .map(([partnerId, t]) => {
      const stockPct = grandTotalDry > 0 ? (t.dryKg / grandTotalDry) * 100 : 0;
      const lossPct = t.wetKg > 0 ? (1 - t.dryKg / t.wetKg) * 100 : 0;
      const share = stockPct / 100;
      return {
        partnerId,
        organization: t.organization,
        jenisUsaha: t.jenisUsaha,
        kecamatan: t.kecamatan,
        wetKg: Number(t.wetKg.toFixed(1)),
        dryKg: Number(t.dryKg.toFixed(1)),
        lossPct: Number(lossPct.toFixed(1)),
        stockPct: Number(stockPct.toFixed(1)),
        biocharKg: Number((share * productionTotals.biochar).toFixed(1)),
        komposKg: Number((share * productionTotals.kompos).toFixed(1)),
        briketKg: Number((share * productionTotals.briket).toFixed(1)),
        ecogoodsKg: Number((share * productionTotals.ecogoods).toFixed(1)),
      };
    })
    .sort((a, b) => b.dryKg - a.dryKg);
}
