"use client";
// src/components/dashboard/sections/EsgSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FASE 9 — Section ESG Report
//
// 5 sub-tab:
//   1. Ringkasan Periode  — 4 metric cards (2×2) + SVG trend chart
//   2. Kontribusi Partner — ranked bar chart + detail table per partner
//   3. Indikator Resmi    — mapping Perpres 111/2022 + progress bar
//   4. Governance         — chain of custody + compliance checklist
//   5. Laporan & Export   — scope selector + period + format + generate PDF
//
// Data: mock static, ported dari rebru_dashboard_v2.html
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  fetchEsgKpiSummary,
  getMonthRangeISO,
  type EsgKpiSummary,
  fetchEsgPartnerBreakdownBasic,
  type EsgPartnerBreakdownBasic,
  fetchEsgPartnerProductionBreakdown,
  type EsgPartnerProductionBreakdown,
  fetchEsgMaterialBreakdown,
  type EsgMaterialBreakdown,
  fetchEsgComplianceChecklist,
  updateEsgComplianceDone,
  type EsgComplianceItem,
  fetchEsgReportPeriodLock,
  lockEsgReportPeriod,
  type EsgReportPeriodLock,
  fetchEsgPartnerDetail,
  type EsgPartnerDetail,
  fetchEsgPartnerPickupStops,
  type EsgPartnerPickupStop,
} from "@/lib/supabase-esg";

import {
  createReportDoc,
  addSectionTitle,
  addKpiGrid,
  addTable,
  addDisclaimer,
  downloadReport,
} from "@/lib/pdf-report";

import { useDashToast } from "@/components/dashboard/DashToastContext";
import { reportError } from "@/lib/report-error";
import { cn } from "@/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SubTab = "ringkasan" | "partner" | "indikator" | "governance" | "laporan";
type ReportScope = "all" | "partner";
type ReportFormat = "sipsn" | "sdg" | "ghg" | "komprehensif";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-tab bar
// ─────────────────────────────────────────────────────────────────────────────

function SubTabBar({
  active,
  onChange,
}: {
  active: SubTab;
  onChange: (t: SubTab) => void;
}) {
  const tabs: { id: SubTab; label: string }[] = [
    { id: "ringkasan", label: "Ringkasan Periode" },
    { id: "partner", label: "Kontribusi Partner" },
    { id: "indikator", label: "Indikator Resmi" },
    { id: "governance", label: "Governance" },
    { id: "laporan", label: "Laporan & Export" },
  ];
  return (
    <div className="dash-stab-bar mb-5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn("dash-stab", active === t.id && "active")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Row
// ─────────────────────────────────────────────────────────────────────────────

function KpiRow({
  summary,
  loading,
  error,
}: {
  summary: EsgKpiSummary | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="dash-kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "14px 16px",
            }}
          >
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Memuat...
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div
        className="rounded-lg mb-4"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "14px 16px",
          color: "var(--text-muted)",
        }}
      >
        Gagal memuat data ESG.{error ? ` (${error})` : ""}
      </div>
    );
  }

  const co2eSub =
    !summary.biocharFactorDefined && !summary.komposFactorDefined
      ? "Faktor emisi belum ditetapkan"
      : !summary.komposFactorDefined
        ? "Kompos belum dihitung — faktor belum ada"
        : "IPCC 2006 · perlu validasi";

  const kpis = [
    {
      label: "Total Diproses",
      value: `${(summary.totalPickupKg / 1000).toFixed(2)} ton`,
      sub: `${summary.mitraTracked} partner · periode ini`,
      color: "var(--coffee-latte)",
    },
    {
      label: "Didaur Ulang",
      value: `${(summary.totalDryKg / 1000).toFixed(2)} ton`,
      sub:
        summary.totalPickupKg > 0
          ? `${((summary.totalDryKg / summary.totalPickupKg) * 100).toFixed(1)}% dari total pickup`
          : "—",
      color: "var(--forest-sage)",
    },
    {
      label: "CO₂e Dihindari",
      value: `${(summary.totalCo2eKg / 1000).toFixed(2)} ton`,
      sub: co2eSub,
      color: "var(--teal)",
    },
    {
      label: "Partner Terlacak",
      value: `${summary.mitraTracked}`,
      sub: "batch selesai periode ini",
      color: "var(--text-primary)",
    },
  ];

  return (
    <div className="dash-kpi-grid">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            padding: "14px 16px",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mb-1.5"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
              letterSpacing: "0.08em",
            }}
          >
            {k.label}
          </p>
          <p
            className="font-semibold leading-none mb-1"
            style={{
              fontSize: "22px",
              color: k.color,
              letterSpacing: "-0.02em",
            }}
          >
            {k.value}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {k.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Ringkasan Periode
// ─────────────────────────────────────────────────────────────────────────────

function RingkasanTab({
  kpi,
  materials,
  loading,
  error,
  yearMonth,
  periodStart,
  periodEnd,
}: {
  kpi: EsgKpiSummary | null;
  materials: EsgMaterialBreakdown[];
  loading: boolean;
  error: string | null;
  yearMonth: string;
  periodStart: string;
  periodEnd: string;
}) {
  const [lockInfo, setLockInfo] = useState<EsgReportPeriodLock | null>(null);
  const [checkingLock, setCheckingLock] = useState(true);
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkLock() {
      setCheckingLock(true);
      try {
        const existing = await fetchEsgReportPeriodLock(yearMonth);
        if (!cancelled) setLockInfo(existing);
      } catch (err) {
        reportError("EsgSection.RingkasanTab.checkLock", err);
      } finally {
        if (!cancelled) setCheckingLock(false);
      }
    }
    checkLock();
    return () => {
      cancelled = true;
    };
  }, [yearMonth]);

  async function handleLock() {
    if (!kpi) return;
    setLocking(true);
    setLockError(null);
    try {
      await lockEsgReportPeriod(yearMonth, periodStart, periodEnd, {
        kpi,
        materials,
      });
      const saved = await fetchEsgReportPeriodLock(yearMonth);
      setLockInfo(saved);
    } catch (err) {
      reportError("EsgSection.RingkasanTab.handleLock", err);
      setLockError(
        err instanceof Error ? err.message : "Gagal mengunci period",
      );
    } finally {
      setLocking(false);
    }
  }

  function handlePreviewPdf() {
    if (!kpi) return;

    const doc = createReportDoc("Ringkasan Periode", `Periode: ${yearMonth}`);

    let y = addSectionTitle(doc, 46, "Ringkasan 4 Indikator Utama");
    y = addKpiGrid(doc, y + 4, [
      {
        label: "SDG 12.5.1(a) — Didaur Ulang",
        value: `${(kpi.totalDryKg / 1000).toFixed(2)} ton`,
      },
      {
        label: "SDG 12.3.1(a) — Food Waste",
        value: materials.some((m) => m.isFoodWaste)
          ? `${((materials.filter((m) => m.isFoodWaste).reduce((s, m) => s + m.dryKg, 0) / kpi.totalDryKg) * 100 || 0).toFixed(1)}%`
          : "N/A",
      },
      {
        label: "GHG — CO₂e Dihindari",
        value: `${(kpi.totalCo2eKg / 1000).toFixed(2)} ton CO₂e`,
      },
      {
        label: "SDG 12.4.2 — Total Volume",
        value: `${(kpi.totalPickupKg / 1000).toFixed(2)} ton`,
      },
    ]);

    y = addSectionTitle(doc, y + 4, "Rincian per Jenis Material");
    y = addTable(
      doc,
      y + 2,
      ["Material", "Dry (kg)", "Kontribusi (%)"],
      materials.length > 0
        ? materials.map((m) => [
            m.materialName,
            String(m.dryKg),
            `${m.dryPct}%`,
          ])
        : [["—", "Belum ada data", "—"]],
    );

    addDisclaimer(
      doc,
      y,
      "Dokumen ini bersifat data pendukung internal — angka CO₂e menggunakan metodologi IPCC 2006 dan perlu validasi ahli lingkungan.",
    );

    downloadReport(doc, `rebru-ringkasan-esg-${yearMonth}.pdf`);
  }

  const foodWasteMaterials = materials.filter((m) => m.isFoodWaste);
  const foodWasteDryKg = foodWasteMaterials.reduce(
    (sum, m) => sum + m.dryKg,
    0,
  );
  const dryRatioPct =
    kpi && kpi.totalPickupKg > 0
      ? (kpi.totalDryKg / kpi.totalPickupKg) * 100
      : 0;
  const foodWastePct =
    kpi && kpi.totalDryKg > 0 ? (foodWasteDryKg / kpi.totalDryKg) * 100 : 0;
  const avgPerPartner =
    kpi && kpi.pickupPartnerCount > 0
      ? kpi.totalPickupKg / kpi.pickupPartnerCount
      : 0;

  const shownMaterials = materials.slice(0, 2);
  const restMaterials = materials.slice(2);
  const restMaterialsDryKg = restMaterials.reduce((sum, m) => sum + m.dryKg, 0);

  const materialSubItems =
    restMaterials.length > 0
      ? [
          ...shownMaterials.map((m) => ({
            label: m.materialName,
            val: `${(m.dryKg / 1000).toFixed(2)} ton`,
          })),
          {
            label: `+${restMaterials.length} material lainnya`,
            val: `${(restMaterialsDryKg / 1000).toFixed(2)} ton`,
          },
          {
            label: "Rasio daur ulang",
            val: `${dryRatioPct.toFixed(1)}% dari total`,
          },
        ]
      : [
          ...shownMaterials.map((m) => ({
            label: m.materialName,
            val: `${(m.dryKg / 1000).toFixed(2)} ton`,
          })),
          {
            label: "Rasio daur ulang",
            val: `${dryRatioPct.toFixed(1)}% dari total`,
          },
          { label: "Target KLHK 2025", val: "Reduksi 30%" },
        ];

  const METRICS = kpi
    ? [
        {
          dot: "var(--forest-sage)",
          code: "SDG 12.5.1(a) — Perpres 111/2022",
          title: "Timbulan Sampah Didaur Ulang",
          value: (kpi.totalDryKg / 1000).toFixed(2),
          unit: "ton / bulan",
          valueColor: "var(--forest-sage)",
          badge: "Periode: bulan ini",
          sub: materialSubItems,
        },
        {
          dot: "var(--teal)",
          code: "SDG 12.3.1(a) — SIPSN",
          title: "Persentase Sisa Makanan (Food Waste)",
          value:
            foodWasteMaterials.length > 0 ? foodWastePct.toFixed(1) : "N/A",
          unit: foodWasteMaterials.length > 0 ? "%" : "",
          valueColor:
            foodWasteMaterials.length > 0 ? "var(--teal)" : "var(--text-muted)",
          badge: "Periode: bulan ini",
          sub:
            foodWasteMaterials.length > 0
              ? [
                  {
                    label: "Volume food waste",
                    val: `${(foodWasteDryKg / 1000).toFixed(2)} ton`,
                  },
                  { label: "Target SDG 2030", val: "Kurangi 50%" },
                  { label: "Metodologi", val: "FAO food waste index" },
                ]
              : [
                  {
                    label: "Status",
                    val: "Belum ada material food waste terdaftar",
                  },
                  { label: "Metodologi", val: "FAO food waste index" },
                ],
        },
        {
          dot: "var(--gold)",
          code: "GHG Protocol — Emisi Dihindari",
          title: "Setara CO₂ Tidak Terlepas ke Atmosfer",
          value: (kpi.totalCo2eKg / 1000).toFixed(2),
          unit: "ton CO₂e",
          valueColor: "var(--gold)",
          badge: "Periode: bulan ini",
          sub: [
            {
              label: "Dari kompos",
              val: kpi.komposFactorDefined
                ? `${((kpi.totalCo2eKomposKg ?? 0) / 1000).toFixed(2)} ton CO₂e`
                : "Belum dihitung",
            },
            {
              label: "Dari biochar",
              val: kpi.biocharFactorDefined
                ? `${((kpi.totalCo2eBiocharKg ?? 0) / 1000).toFixed(2)} ton CO₂e`
                : "Belum dihitung",
            },
            { label: "Metodologi", val: "IPCC 2006" },
            { label: "⚠ Validasi", val: "Perlu ahli lingk.", isWarn: true },
          ],
        },
        {
          dot: "var(--coffee-latte)",
          code: "SDG 12.4.2 — Total Volume Diproses",
          title: "Semua Jenis Limbah Ditangani",
          value: (kpi.totalPickupKg / 1000).toFixed(2),
          unit: "ton / bulan",
          valueColor: "var(--coffee-latte)",
          badge: "Periode: bulan ini",
          sub: [
            {
              label: "Partner terlacak",
              val: `${kpi.pickupPartnerCount} partner`,
            },
            { label: "Pickup terlaksana", val: `${kpi.pickupCount} kali` },
            {
              label: "Rata-rata / partner",
              val:
                avgPerPartner > 0 ? `${avgPerPartner.toFixed(0)} kg/bln` : "—",
            },
            { label: "Format SIPSN", val: "✓ Kompatibel", isGreen: true },
          ],
        },
      ]
    : [];

  if (loading) {
    return (
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Memuat data ringkasan...
      </p>
    );
  }

  if (error || !kpi) {
    return (
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
          color: "var(--text-muted)",
        }}
      >
        Gagal memuat data ringkasan.{error ? ` (${error})` : ""}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
        <select
          className="rounded px-2.5 py-1.5 text-[11px] outline-none"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <option>Mei 2026</option>
          <option>April 2026</option>
          <option>Maret 2026</option>
        </select>
        <span
          className="text-[10px] px-2 py-1 rounded"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          Sumber: WasteLog → BioBatch
        </span>
        {!checkingLock &&
          (lockInfo ? (
            <span
              className="text-[10px]"
              style={{ color: "var(--forest-sage)" }}
            >
              ✓ Period dikunci —{" "}
              {new Date(lockInfo.lockedAt).toLocaleDateString("id-ID")}
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: "var(--gold)" }}>
              🔒 Period belum dikunci
            </span>
          ))}
        <div className="ml-auto flex gap-2">
          <button
            onClick={handlePreviewPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Preview PDF
          </button>
          <button
            onClick={handleLock}
            disabled={locking || !!lockInfo || checkingLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-all"
            style={{
              background: lockInfo
                ? "rgba(45,90,46,0.12)"
                : "var(--forest-sage)",
              color: lockInfo ? "var(--forest-sage)" : "white",
              border: lockInfo ? "0.5px solid rgba(45,90,46,0.35)" : "none",
              opacity: locking ? 0.6 : 1,
              cursor: lockInfo ? "default" : "pointer",
            }}
          >
            <i className="fas fa-lock text-[9px]" />
            {lockInfo
              ? "Period Dikunci"
              : locking
                ? "Mengunci..."
                : "Kunci Period"}
          </button>
        </div>
      </div>

      {lockError && (
        <p className="text-[10px] mb-2" style={{ color: "#f87171" }}>
          Gagal mengunci: {lockError}
        </p>
      )}

      <div
        className="grid gap-2.5 mb-4"
        style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
      >
        {METRICS.map((m) => (
          <div
            key={m.code}
            className="rounded-lg"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "16px",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: m.dot }}
              />
              <span
                className="text-[9px] tracking-wider uppercase"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                {m.code}
              </span>
            </div>
            <p
              className="text-[11px] mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {m.title}
            </p>

            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-semibold"
                style={{
                  fontSize: "26px",
                  color: m.valueColor,
                  letterSpacing: "-0.02em",
                }}
              >
                {m.value}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {m.unit}
              </span>
              <span
                className="ml-auto text-[10px] px-2 py-px rounded"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-muted)",
                  border: "0.5px solid var(--border-subtle)",
                }}
              >
                {m.badge}
              </span>
            </div>

            <div
              className="mb-3"
              style={{ height: "0.5px", background: "var(--border-subtle)" }}
            />

            <div className="grid grid-cols-2 gap-1.5">
              {m.sub.map((s) => (
                <div key={s.label}>
                  <p
                    className="text-[9px] uppercase tracking-wider mb-0.5"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-space-mono)",
                      letterSpacing: "0.07em",
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-xs font-medium"
                    style={{
                      color: (s as any).isWarn
                        ? "var(--coffee-latte)"
                        : (s as any).isGreen
                          ? "var(--forest-sage)"
                          : "var(--text-primary)",
                    }}
                  >
                    {s.val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
        }}
      >
        <p className="text-[11px] mb-2" style={{ color: "var(--text-muted)" }}>
          Tren 6 Bulan — Sampah Didaur Ulang (ton) · SDG 12.5.1(a)
        </p>
        <div
          className="rounded-md flex items-center justify-center"
          style={{
            height: "90px",
            background: "var(--bg-elevated)",
            border: "1px dashed var(--border-subtle)",
          }}
        >
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            📊 Tren historis multi-bulan — segera hadir (backlog)
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Kontribusi Partner
// ─────────────────────────────────────────────────────────────────────────────

function typeLabel(jenisUsaha: string): string {
  if (jenisUsaha.startsWith("Hotel")) return "Hotel";
  if (jenisUsaha.startsWith("Cafe")) return "Cafe";
  if (jenisUsaha === "Restoran") return "Resto";
  if (jenisUsaha.startsWith("Catering")) return "Catering";
  if (jenisUsaha.startsWith("Kantor")) return "Kantor";
  return jenisUsaha;
}

type PartnerRow = EsgPartnerBreakdownBasic & {
  biocharKg?: number;
  komposKg?: number;
  co2eKg?: number;
};

function downloadPartnerCsv(rows: PartnerRow[]) {
  const header = [
    "Partner",
    "Kategori",
    "Dry (kg)",
    "Stock (%)",
    "Biochar (kg)",
    "Kompos (kg)",
    "CO2e (kg)",
    "Pickup Selesai",
    "Pickup Total",
  ];
  const lines = rows.map((r) => [
    r.organization,
    typeLabel(r.jenisUsaha),
    r.dryKg,
    r.dryPct,
    r.biocharKg ?? "",
    r.komposKg ?? "",
    r.co2eKg ?? "",
    r.pickupDone,
    r.pickupTotal,
  ]);

  const csvContent = [header, ...lines]
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell);
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  link.href = url;
  link.download = `esg-kontribusi-partner-${yearMonth}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Fungsi bersama: dipakai tombol PDF di dalam modal DAN ikon PDF di baris tabel ──
// Supaya logika "susun isi PDF laporan partner" cuma ditulis SATU KALI.
async function exportPartnerPdf(
  partnerId: string,
  yearMonth: string,
  onError: (msg: string) => void,
) {
  try {
    const { start, end } = getMonthRangeISO(yearMonth);
    const [detail, stops] = await Promise.all([
      fetchEsgPartnerDetail(partnerId),
      fetchEsgPartnerPickupStops(partnerId, start, end),
    ]);

    if (!detail) {
      onError("Data partner tidak ditemukan.");
      return;
    }

    const doc = createReportDoc(
      `Laporan Partner — ${detail.organization}`,
      `Periode: ${yearMonth} · Kategori: ${detail.jenisUsaha}`,
    );

    let y = addSectionTitle(doc, 46, "Informasi Partner");
    y = addKpiGrid(doc, y + 4, [
      { label: "PIC", value: detail.picName },
      { label: "Telepon", value: detail.phone },
      { label: "Volume Limbah", value: detail.volumeLimbah },
      { label: "Alamat", value: detail.alamatDetail },
    ]);

    y = addSectionTitle(doc, y + 4, `Riwayat Pickup (${stops.length})`);
    y = addTable(
      doc,
      y + 2,
      ["Tanggal", "Berat (kg)", "Status", "Kondisi"],
      stops.length > 0
        ? stops.map((s) => [
            new Date(s.routeDate).toLocaleDateString("id-ID"),
            s.actualKg !== null ? String(s.actualKg) : "—",
            s.status,
            s.condition ?? "—",
          ])
        : [["—", "Belum ada pickup periode ini", "—", "—"]],
    );

    addDisclaimer(
      doc,
      y,
      "Dokumen ini bersifat data pendukung untuk customer — pelaporan resmi ke DLH dilakukan oleh customer masing-masing.",
    );

    const safeSlug = detail.organization.toLowerCase().replace(/\s+/g, "-");
    downloadReport(doc, `rebru-laporan-${safeSlug}-${yearMonth}.pdf`);
  } catch (err) {
    reportError("EsgSection.exportPartnerPdf", err);
    onError(err instanceof Error ? err.message : "Gagal membuat PDF.");
  }
}

function generateEsgReportPdf(
  format: ReportFormat,
  kpi: EsgKpiSummary,
  materials: EsgMaterialBreakdown[],
  partners: EsgPartnerBreakdownBasic[],
  yearMonth: string,
) {
  const formatLabel =
    format === "sipsn"
      ? "Format SIPSN"
      : format === "sdg"
        ? "Format Indikator SDG"
        : format === "ghg"
          ? "Format GHG Protocol"
          : "Laporan Komprehensif";

  const doc = createReportDoc(
    formatLabel,
    `Periode: ${yearMonth} · Seluruh Partner (${partners.length})`,
  );

  let y = 46;

  if (format === "sipsn" || format === "komprehensif") {
    y = addSectionTitle(doc, y, "Data Pengurangan & Penanganan Sampah");
    y = addKpiGrid(doc, y + 4, [
      {
        label: "Total Timbulan Ditangani",
        value: `${(kpi.totalPickupKg / 1000).toFixed(2)} ton`,
      },
      {
        label: "Total Didaur Ulang (Kering)",
        value: `${(kpi.totalDryKg / 1000).toFixed(2)} ton`,
      },
      { label: "Jumlah Pickup", value: `${kpi.pickupCount} kali` },
      { label: "Partner Terlibat", value: `${kpi.pickupPartnerCount} partner` },
    ]);
    y += 4;
  }

  if (format === "sdg" || format === "komprehensif") {
    const foodWasteMaterials = materials.filter((m) => m.isFoodWaste);
    const foodWasteDryKg = foodWasteMaterials.reduce(
      (sum, m) => sum + m.dryKg,
      0,
    );
    const foodWastePct =
      kpi.totalDryKg > 0 ? (foodWasteDryKg / kpi.totalDryKg) * 100 : 0;

    y = addSectionTitle(doc, y, "Indikator Resmi — Perpres 111/2022");
    y = addTable(
      doc,
      y + 2,
      ["Kode", "Deskripsi", "Nilai"],
      [
        [
          "12.5.1(a)",
          "Timbulan sampah didaur ulang",
          `${(kpi.totalDryKg / 1000).toFixed(2)} ton`,
        ],
        [
          "12.3.1(a)",
          "Persentase sisa makanan (food waste)",
          foodWasteMaterials.length > 0 ? `${foodWastePct.toFixed(1)}%` : "N/A",
        ],
        [
          "12.4.2",
          "Total volume limbah ditangani",
          `${(kpi.totalPickupKg / 1000).toFixed(2)} ton`,
        ],
        ["12.6.1(a)", "Penerapan SNI ISO 14001", "N/A"],
      ],
    );
    y += 4;
  }

  if (format === "ghg" || format === "komprehensif") {
    y = addSectionTitle(doc, y, "Emisi CO₂e Dihindari — Metodologi IPCC 2006");
    y = addKpiGrid(doc, y + 4, [
      {
        label: "Dari Kompos",
        value: kpi.komposFactorDefined
          ? `${((kpi.totalCo2eKomposKg ?? 0) / 1000).toFixed(2)} ton CO₂e`
          : "Belum dihitung",
      },
      {
        label: "Dari Biochar",
        value: kpi.biocharFactorDefined
          ? `${((kpi.totalCo2eBiocharKg ?? 0) / 1000).toFixed(2)} ton CO₂e`
          : "Belum dihitung",
      },
      {
        label: "Total CO₂e Dihindari",
        value: `${(kpi.totalCo2eKg / 1000).toFixed(2)} ton CO₂e`,
      },
      {
        label: "Status Validasi",
        value: "Estimasi internal — perlu ahli lingkungan",
      },
    ]);
    y += 4;
  }

  if (format === "komprehensif" && partners.length > 0) {
    y = addSectionTitle(doc, y, `Kontribusi Partner (${partners.length})`);
    y = addTable(
      doc,
      y + 2,
      ["Partner", "Kategori", "Dry (kg)", "Kontribusi (%)", "Pickup"],
      partners.map((p) => [
        p.organization,
        p.jenisUsaha,
        String(p.dryKg),
        `${p.dryPct}%`,
        `${p.pickupDone}/${p.pickupTotal}`,
      ]),
    );
  }

  addDisclaimer(
    doc,
    y,
    "Dokumen ini bersifat data pendukung untuk customer — pelaporan resmi ke DLH dilakukan oleh customer masing-masing. Metodologi CO₂e (IPCC 2006) merupakan estimasi internal yang belum divalidasi ahli lingkungan.",
  );

  downloadReport(doc, `rebru-laporan-${format}-${yearMonth}.pdf`);
}

function PartnerDetailModal({
  partnerId,
  yearMonth,
  onClose,
}: {
  partnerId: string;
  yearMonth: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<EsgPartnerDetail | null>(null);
  const [stops, setStops] = useState<EsgPartnerPickupStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { start, end } = getMonthRangeISO(yearMonth);
        const [detailData, stopsData] = await Promise.all([
          fetchEsgPartnerDetail(partnerId),
          fetchEsgPartnerPickupStops(partnerId, start, end),
        ]);
        if (!cancelled) {
          setDetail(detailData);
          setStops(stopsData);
        }
      } catch (err) {
        reportError("EsgSection.PartnerDetailModal.load", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [partnerId, yearMonth]);

  async function handleExportPdf() {
    setExporting(true);
    setExportError(null);
    await exportPartnerPdf(partnerId, yearMonth, setExportError);
    setExporting(false);
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-lg w-full max-w-[440px] max-h-[80vh] overflow-y-auto"
        style={{
          background: "var(--bg-surface)",
          border: "0.5px solid var(--border-default)",
          padding: "20px",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {detail?.organization ?? "Detail Partner"}
            </h3>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Periode: {yearMonth}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {loading && (
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Memuat...
          </p>
        )}

        {error && (
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Gagal memuat data. ({error})
          </p>
        )}

        {!loading && !error && detail && (
          <>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div>
                <p
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Kategori
                </p>
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                  {detail.jenisUsaha}
                </p>
              </div>
              <div>
                <p
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Volume Limbah
                </p>
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                  {detail.volumeLimbah}
                </p>
              </div>
              <div>
                <p
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  PIC
                </p>
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                  {detail.picName}
                </p>
              </div>
              <div>
                <p
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Telepon
                </p>
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                  {detail.phone}
                </p>
              </div>
              <div className="col-span-2">
                <p
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Alamat
                </p>
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>
                  {detail.alamatDetail}
                </p>
              </div>
            </div>

            <p
              className="text-[10px] uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Riwayat Pickup Periode Ini ({stops.length})
            </p>
            <div className="flex flex-col gap-1.5 mb-4">
              {stops.length === 0 && (
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Belum ada pickup periode ini.
                </p>
              )}
              {stops.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-2.5 py-2 rounded"
                  style={{
                    background: "var(--bg-card)",
                    border: "0.5px solid var(--border-subtle)",
                  }}
                >
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {new Date(s.routeDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {s.actualKg !== null ? `${s.actualKg} kg` : "—"}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-px rounded"
                    style={{
                      background:
                        s.status === "done"
                          ? "rgba(45,90,46,0.12)"
                          : "rgba(196,136,47,0.12)",
                      color:
                        s.status === "done"
                          ? "var(--forest-sage)"
                          : "var(--coffee-latte)",
                    }}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>

            {exportError && (
              <p className="text-[10px] mb-2" style={{ color: "#f87171" }}>
                Gagal export: {exportError}
              </p>
            )}

            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="w-full py-2.5 rounded-md text-xs font-medium flex items-center justify-center gap-2"
              style={{
                background: "var(--forest-sage)",
                color: "white",
                border: "none",
                opacity: exporting ? 0.6 : 1,
              }}
            >
              <i
                className={`fas ${exporting ? "fa-circle-notch fa-spin" : "fa-file-pdf"}`}
              />
              {exporting ? "Membuat PDF..." : "Export PDF Laporan Partner"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PartnerTab() {
  const COL = "1.3fr 65px 65px 60px 70px 70px 80px 100px";
  const { show } = useDashToast();

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [rows, setRows] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [komposFactorMissing, setKomposFactorMissing] = useState(false);
  const [detailPartnerId, setDetailPartnerId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { start, end } = getMonthRangeISO(yearMonth);

        const [basic, production] = await Promise.all([
          fetchEsgPartnerBreakdownBasic(start, end),
          fetchEsgPartnerProductionBreakdown(start, end),
        ]);

        const productionMap = new Map(production.map((p) => [p.partnerId, p]));
        const merged: PartnerRow[] = basic.map((r) => {
          const p = productionMap.get(r.partnerId);
          return p
            ? {
                ...r,
                biocharKg: p.biocharKg,
                komposKg: p.komposKg,
                co2eKg: p.co2eKg,
              }
            : r;
        });

        if (!cancelled) {
          setRows(merged);
          setKomposFactorMissing(
            production.some((p) => !p.komposFactorDefined),
          );
        }
      } catch (err) {
        reportError("EsgSection.PartnerTab.load", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRowExport(partnerId: string) {
    setExportingId(partnerId);
    await exportPartnerPdf(partnerId, yearMonth, (msg) =>
      show(`Gagal export PDF: ${msg}`, "error"),
    );
    setExportingId(null);
  }

  const filteredRows = rows.filter((r) =>
    typeFilter === "all" ? true : typeLabel(r.jenisUsaha) === typeFilter,
  );
  const topBars = filteredRows.slice(0, 6);
  const restRows = filteredRows.slice(6);
  const restDry = restRows.reduce((sum, r) => sum + r.dryKg, 0);
  const maxDry = filteredRows[0]?.dryKg ?? 0;
  const totalDry = filteredRows.reduce((sum, r) => sum + r.dryKg, 0);
  const totalCo2eKg = filteredRows.reduce((sum, r) => sum + (r.co2eKg ?? 0), 0);

  if (loading) {
    return (
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Memuat data partner...
      </p>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
          color: "var(--text-muted)",
        }}
      >
        Gagal memuat data partner. ({error})
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded px-2.5 py-1.5 text-[11px] outline-none"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <option value="all">Semua Partner</option>
          <option value="Hotel">Hotel</option>
          <option value="Cafe">Cafe</option>
          <option value="Resto">Restoran</option>
        </select>
        <span
          className="text-[10px] px-2.5 py-1 rounded"
          style={{
            background: "rgba(196,136,47,0.08)",
            border: "0.5px solid rgba(196,136,47,0.3)",
            color: "var(--coffee-latte)",
          }}
        >
          ⚡ Atribusi CO₂e = proporsional dry weight ke stock
        </span>
        {komposFactorMissing && (
          <span className="text-[10px]" style={{ color: "var(--gold)" }}>
            ⚠ CO₂e kompos belum terhitung — faktor belum ditetapkan
          </span>
        )}
        <button
          onClick={() => downloadPartnerCsv(filteredRows)}
          className="ml-auto text-[11px] px-3 py-1.5 rounded"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <i className="fas fa-file-csv text-[10px] mr-1.5" />
          Export Semua CSV
        </button>
      </div>

      <div className="flex gap-3">
        <div
          className="rounded-lg flex-shrink-0"
          style={{
            width: "260px",
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            padding: "16px",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mb-3"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
              letterSpacing: "0.08em",
            }}
          >
            Top Kontributor — Dry Weight (kg)
          </p>
          <div className="flex flex-col gap-2.5">
            {topBars.map((b) => (
              <div key={b.partnerId}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span
                    style={{ color: "var(--text-primary)", fontWeight: 500 }}
                  >
                    {b.organization}
                  </span>
                  <span
                    style={{ color: "var(--coffee-latte)", fontWeight: 600 }}
                  >
                    {b.dryKg} kg
                  </span>
                </div>
                <div
                  className="rounded-full"
                  style={{ height: "6px", background: "var(--bg-elevated)" }}
                >
                  <div
                    className="rounded-full h-full"
                    style={{
                      width: `${maxDry > 0 ? (b.dryKg / maxDry) * 100 : 0}%`,
                      background: "var(--coffee-latte)",
                      opacity: 0.75,
                    }}
                  />
                </div>
              </div>
            ))}
            {restRows.length > 0 && (
              <div
                style={{
                  paddingTop: "6px",
                  borderTop: "0.5px solid var(--border-subtle)",
                }}
              >
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color: "var(--text-muted)" }}>
                    +{restRows.length} partner lainnya
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    ~{restDry.toFixed(0)} kg
                  </span>
                </div>
                <div
                  className="rounded-full"
                  style={{ height: "6px", background: "var(--bg-elevated)" }}
                >
                  <div
                    className="rounded-full h-full"
                    style={{
                      width: `${maxDry > 0 ? (restDry / maxDry) * 100 : 0}%`,
                      background: "var(--text-muted)",
                      opacity: 0.25,
                    }}
                  />
                </div>
              </div>
            )}
            {filteredRows.length === 0 && (
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Belum ada data periode ini.
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "0.5px solid var(--border-subtle)" }}
          >
            <div
              className="grid px-3 py-2.5"
              style={{
                gridTemplateColumns: COL,
                background: "var(--bg-elevated)",
                borderBottom: "0.5px solid var(--border-subtle)",
              }}
            >
              {[
                "Partner",
                "Dry kg",
                "Stock%",
                "Biochar",
                "Kompos",
                "CO₂e",
                "Pickup",
                "",
              ].map((h, i) => (
                <div
                  key={i}
                  className="text-[9px] uppercase tracking-wider"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-space-mono)",
                    textAlign: i > 0 && i < 7 ? "right" : "left",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {filteredRows.map((r) => (
              <div
                key={r.partnerId}
                className="grid px-3 py-2.5 items-center transition-all"
                style={{
                  gridTemplateColumns: COL,
                  borderBottom: "0.5px solid var(--border-subtle)",
                  background: "var(--bg-card)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-elevated)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--bg-card)")
                }
              >
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {r.organization}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {typeLabel(r.jenisUsaha)} · {r.pickupDone} pickup
                  </p>
                </div>
                <div
                  className="text-right text-xs font-medium"
                  style={{ color: "var(--coffee-latte)" }}
                >
                  {r.dryKg} kg
                </div>
                <div
                  className="text-right text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {r.dryPct}%
                </div>
                <div
                  className="text-right text-xs"
                  style={{ color: "var(--forest-sage)" }}
                >
                  {r.biocharKg !== undefined ? `~${r.biocharKg} kg` : "—"}
                </div>
                <div
                  className="text-right text-xs"
                  style={{ color: "var(--teal)" }}
                >
                  {r.komposKg !== undefined ? `~${r.komposKg} kg` : "—"}
                </div>
                <div
                  className="text-right text-xs"
                  style={{ color: "var(--gold)" }}
                >
                  {r.co2eKg !== undefined
                    ? `${(r.co2eKg / 1000).toFixed(2)} ton`
                    : "—"}
                </div>
                <div className="text-right">
                  <span
                    className="text-[9px] px-1.5 py-px rounded"
                    style={{
                      background:
                        r.pickupTotal > 0 && r.pickupDone === r.pickupTotal
                          ? "rgba(45,90,46,0.12)"
                          : "rgba(196,136,47,0.12)",
                      color:
                        r.pickupTotal > 0 && r.pickupDone === r.pickupTotal
                          ? "var(--forest-sage)"
                          : "var(--coffee-latte)",
                      border: `0.5px solid ${
                        r.pickupTotal > 0 && r.pickupDone === r.pickupTotal
                          ? "rgba(45,90,46,0.3)"
                          : "rgba(196,136,47,0.4)"
                      }`,
                    }}
                  >
                    {r.pickupDone}/{r.pickupTotal}
                  </span>
                </div>
                <div className="text-right flex justify-end gap-1.5">
                  <button
                    onClick={() => setDetailPartnerId(r.partnerId)}
                    title="Lihat detail"
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "0.5px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <i className="fas fa-eye text-[10px]" />
                  </button>
                  <button
                    onClick={() => handleRowExport(r.partnerId)}
                    disabled={exportingId === r.partnerId}
                    title="Export PDF"
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "0.5px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                      opacity: exportingId === r.partnerId ? 0.5 : 1,
                    }}
                  >
                    <i
                      className={`fas ${exportingId === r.partnerId ? "fa-circle-notch fa-spin" : "fa-file-pdf"} text-[10px]`}
                    />
                  </button>
                </div>
              </div>
            ))}

            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={{ background: "var(--bg-elevated)" }}
            >
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {filteredRows.length} partner · Total dry {totalDry.toFixed(0)}{" "}
                kg · Total CO₂e {(totalCo2eKg / 1000).toFixed(2)} ton
              </span>
            </div>
          </div>
        </div>
      </div>

      {detailPartnerId && (
        <PartnerDetailModal
          partnerId={detailPartnerId}
          yearMonth={yearMonth}
          onClose={() => setDetailPartnerId(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Indikator Resmi
// ─────────────────────────────────────────────────────────────────────────────

function IndikatorTab({
  kpi,
  materials,
  loading,
  error,
}: {
  kpi: EsgKpiSummary | null;
  materials: EsgMaterialBreakdown[];
  loading: boolean;
  error: string | null;
}) {
  const foodWasteMaterials = materials.filter((m) => m.isFoodWaste);
  const foodWasteDryKg = foodWasteMaterials.reduce(
    (sum, m) => sum + m.dryKg,
    0,
  );
  const foodWastePct =
    kpi && kpi.totalDryKg > 0 ? (foodWasteDryKg / kpi.totalDryKg) * 100 : 0;
  const dryRatioPct =
    kpi && kpi.totalPickupKg > 0
      ? (kpi.totalDryKg / kpi.totalPickupKg) * 100
      : 0;

  const INDICATORS = kpi
    ? [
        {
          code: "12.5.1(a)",
          codeColor: "var(--forest-sage)",
          desc: "Jumlah timbulan sampah yang didaur ulang",
          value: `${(kpi.totalDryKg / 1000).toFixed(2)} ton`,
          barWidth: Math.min(dryRatioPct, 100),
          barColor: "var(--forest-sage)",
          note: "Target 30% pengurangan — sumber: WasteLog per partner",
        },
        {
          code: "12.3.1(a)",
          codeColor: "var(--teal)",
          desc: "Persentase sisa makanan (food waste index)",
          value:
            foodWasteMaterials.length > 0
              ? `${foodWastePct.toFixed(1)}%`
              : "N/A",
          barWidth:
            foodWasteMaterials.length > 0 ? Math.min(foodWastePct, 100) : 0,
          barColor: "var(--teal)",
          note:
            foodWasteMaterials.length > 0
              ? "Target pengurangan 50% (SDG 2030) — metodologi FAO"
              : "Tidak berlaku — belum ada material food waste terdaftar",
        },
        {
          code: "12.4.2",
          codeColor: "var(--coffee-latte)",
          desc: "Limbah yang dihasilkan & ditangani",
          value: `${(kpi.totalPickupKg / 1000).toFixed(2)} ton`,
          barWidth: 0,
          barColor: "transparent",
          note: `Total volume dikelola Rebru periode ini — ${kpi.pickupPartnerCount} partner, ${kpi.pickupCount} pickup`,
        },
        {
          code: "12.6.1(a)",
          codeColor: "var(--text-muted)",
          desc: "Penerapan SNI ISO 14001",
          value: "N/A",
          barWidth: 0,
          barColor: "transparent",
          note: "Tidak berlaku untuk tahap operasional saat ini",
        },
      ]
    : [];

  if (loading) {
    return (
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Memuat data indikator...
      </p>
    );
  }

  if (error || !kpi) {
    return (
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
          color: "var(--text-muted)",
        }}
      >
        Gagal memuat data indikator.{error ? ` (${error})` : ""}
      </div>
    );
  }

  return (
    <div>
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
        }}
      >
        <p className="text-[11px] mb-4" style={{ color: "var(--text-muted)" }}>
          Pemetaan Indikator Resmi — Perpres 111/2022 · Rebru Kota Makassar ·
          Bulan ini
        </p>

        <div className="flex flex-col gap-4">
          {INDICATORS.map((ind) => (
            <div key={ind.code}>
              <div className="flex justify-between mb-1.5 text-[11px]">
                <span>
                  <span
                    className="font-medium mr-2"
                    style={{ color: ind.codeColor }}
                  >
                    {ind.code}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>{ind.desc}</span>
                </span>
                <span className="font-medium" style={{ color: ind.codeColor }}>
                  {ind.value}
                </span>
              </div>
              <div
                className="rounded-full mb-1"
                style={{ height: "4px", background: "var(--bg-elevated)" }}
              >
                {ind.barWidth > 0 && (
                  <div
                    className="rounded-full h-full"
                    style={{
                      width: `${ind.barWidth}%`,
                      background: ind.barColor,
                      opacity: 0.8,
                    }}
                  />
                )}
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {ind.note}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mt-4 rounded-md px-3 py-2.5 text-[11px]"
          style={{
            background: "rgba(196,136,47,0.08)",
            border: "0.5px solid rgba(196,136,47,0.35)",
            color: "var(--coffee-latte)",
          }}
        >
          ⚠ Angka CO₂e menggunakan metodologi IPCC 2006 — perlu validasi ahli
          lingkungan sebelum dilaporkan ke pemerintah.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4 — Governance
// ─────────────────────────────────────────────────────────────────────────────

function GovernanceTab({ kpi }: { kpi: EsgKpiSummary | null }) {
  const COC_CHAIN = [
    { label: "Partner (HoReCa)", amber: false },
    { label: "Pickup (Collector)", amber: false },
    { label: "Dryer-Dome", amber: false },
    { label: "Stock (Mixed)", amber: true },
    { label: "Produksi", amber: false },
    { label: "Buyer / Laporan", amber: false },
  ];

  const [items, setItems] = useState<EsgComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEsgComplianceChecklist();
        if (!cancelled) setItems(data);
      } catch (err) {
        reportError("EsgSection.GovernanceTab.load", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleDone(item: EsgComplianceItem) {
    setSavingId(item.id);
    const nextDone = !item.done;
    setItems((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, done: nextDone } : p)),
    );
    try {
      await updateEsgComplianceDone(item.id, nextDone);
    } catch (err) {
      reportError("EsgSection.GovernanceTab.toggleDone", err);
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, done: !nextDone } : p)),
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
        }}
      >
        {/* Chain of Custody */}
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
          Chain of Custody — Keterlacakan Penuh
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {COC_CHAIN.map((c, i) => (
            <React.Fragment key={c.label}>
              <span
                className="text-[11px] rounded px-2.5 py-1.5"
                style={{
                  background: c.amber
                    ? "rgba(196,136,47,0.08)"
                    : "var(--bg-elevated)",
                  border: `0.5px solid ${c.amber ? "rgba(196,136,47,0.4)" : "var(--border-subtle)"}`,
                  color: c.amber
                    ? "var(--coffee-latte)"
                    : "var(--text-secondary)",
                }}
              >
                {c.label}
              </span>
              {i < COC_CHAIN.length - 1 && (
                <span style={{ color: "var(--text-muted)" }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] mb-5" style={{ color: "var(--text-muted)" }}>
          {kpi
            ? `Aktivitas periode ini: ${kpi.pickupCount} pickup dari ${kpi.pickupPartnerCount} partner → ${(kpi.totalDryKg / 1000).toFixed(2)} ton dikeringkan → ${(kpi.totalCo2eKg / 1000).toFixed(2)} ton CO₂e dihindari.`
            : "Memuat ringkasan aktivitas periode..."}
        </p>

        {/* Compliance checklist */}
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
          Kepatuhan Regulasi
        </p>

        {loading && (
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Memuat checklist...
          </p>
        )}

        {error && (
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Gagal memuat checklist. ({error})
          </p>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-2.5">
            {items.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <button
                  onClick={() => toggleDone(c)}
                  disabled={savingId === c.id}
                  className="text-sm flex-shrink-0"
                  style={{
                    color: c.done
                      ? "var(--forest-sage)"
                      : "var(--coffee-latte)",
                    cursor: "pointer",
                    opacity: savingId === c.id ? 0.5 : 1,
                  }}
                  title="Klik untuk ubah status"
                >
                  {c.done ? "✓" : "○"}
                </button>
                <span
                  className="text-xs flex-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {c.label}
                </span>
                {c.tag && (
                  <span
                    className="text-[10px] px-2 py-px rounded flex-shrink-0"
                    style={{
                      background: "rgba(196,136,47,0.1)",
                      color: "var(--coffee-latte)",
                      border: "0.5px solid rgba(196,136,47,0.35)",
                    }}
                  >
                    {c.tag}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5 — Laporan & Export
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_FORMATS: {
  id: ReportFormat;
  label: string;
  desc: string;
  recommended?: boolean;
  warn?: string;
}[] = [
  {
    id: "sipsn",
    label: "Format SIPSN",
    recommended: true,
    desc: "Data pengurangan & penanganan sampah — format Pemkot Makassar/DLH",
  },
  {
    id: "sdg",
    label: "Format Indikator SDG",
    desc: "Laporan indikator 12.5.1(a), 12.3.1(a), 12.4.2 — Perpres 111/2022",
  },
  {
    id: "ghg",
    label: "Format GHG Protocol",
    desc: "Carbon sequestration — investor/KLHK",
    warn: "(perlu validasi metodologi)",
  },
  {
    id: "komprehensif",
    label: "Laporan Komprehensif Rebru",
    desc: "Semua metrik + kontribusi partner — untuk customer sebagai laporan internal",
  },
];

function LaporanTab({ yearMonth }: { yearMonth: string }) {
  const [scope, setScope] = useState<ReportScope>("all");
  const [format, setFormat] = useState<ReportFormat>("sipsn");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  const [kpi, setKpi] = useState<EsgKpiSummary | null>(null);
  const [materials, setMaterials] = useState<EsgMaterialBreakdown[]>([]);
  const [partners, setPartners] = useState<EsgPartnerBreakdownBasic[]>([]);
  const [lockInfo, setLockInfo] = useState<EsgReportPeriodLock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { start, end } = getMonthRangeISO(yearMonth);
        const [kpiData, materialData, partnerData, lock] = await Promise.all([
          fetchEsgKpiSummary(start, end),
          fetchEsgMaterialBreakdown(start, end),
          fetchEsgPartnerBreakdownBasic(start, end),
          fetchEsgReportPeriodLock(yearMonth),
        ]);
        if (!cancelled) {
          setKpi(kpiData);
          setMaterials(materialData);
          setPartners(partnerData);
          setLockInfo(lock);
        }
      } catch (err) {
        reportError("EsgSection.LaporanTab.load", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [yearMonth]);

  async function handleGenerate() {
    setGenerateError(null);

    if (scope === "partner") {
      if (!selectedPartnerId) {
        setGenerateError("Pilih partner terlebih dahulu.");
        return;
      }
      setGenerating(true);
      await exportPartnerPdf(selectedPartnerId, yearMonth, setGenerateError);
      setGenerating(false);
      return;
    }

    if (!kpi) return;
    setGenerating(true);
    try {
      generateEsgReportPdf(format, kpi, materials, partners, yearMonth);
    } catch (err) {
      reportError("EsgSection.LaporanTab.handleGenerate", err);
      setGenerateError(
        err instanceof Error ? err.message : "Gagal membuat PDF.",
      );
    } finally {
      setGenerating(false);
    }
  }

  const periodLabel = new Date(`${yearMonth}-01T00:00:00`).toLocaleDateString(
    "id-ID",
    { month: "long", year: "numeric" },
  );

  if (loading) {
    return (
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Memuat data laporan...
      </p>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
          color: "var(--text-muted)",
        }}
      >
        Gagal memuat data laporan. ({error})
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Left: scope + period */}
      <div
        className="flex-shrink-0 flex flex-col gap-3"
        style={{ width: "220px" }}
      >
        <div
          className="rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            padding: "14px",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mb-3"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
              letterSpacing: "0.08em",
            }}
          >
            Scope Laporan
          </p>
          {(["all", "partner"] as ReportScope[]).map((s) => (
            <label
              key={s}
              className="flex gap-2.5 items-start p-2.5 rounded-md cursor-pointer mb-2"
              style={{
                background:
                  scope === s ? "rgba(196,136,47,0.08)" : "transparent",
                border: `0.5px solid ${scope === s ? "var(--coffee-latte)" : "var(--border-subtle)"}`,
              }}
            >
              <input
                type="radio"
                name="scope"
                checked={scope === s}
                onChange={() => setScope(s)}
                style={{ accentColor: "var(--coffee-latte)", marginTop: "2px" }}
              />
              <div>
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s === "all" ? "Seluruh Partner" : "Per Partner"}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s === "all"
                    ? `Semua ${partners.length} partner`
                    : "Pilih satu partner"}
                </p>
              </div>
            </label>
          ))}
          {scope === "partner" && (
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="w-full rounded px-2.5 py-1.5 text-[11px] outline-none mt-1"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <option value="">Pilih partner...</option>
              {partners.map((p) => (
                <option key={p.partnerId} value={p.partnerId}>
                  {p.organization}
                </option>
              ))}
            </select>
          )}
        </div>

        <div
          className="rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            padding: "14px",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mb-3"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
              letterSpacing: "0.08em",
            }}
          >
            Periode
          </p>
          <p className="text-xs mb-2" style={{ color: "var(--text-primary)" }}>
            {periodLabel}
          </p>
          {lockInfo ? (
            <p className="text-[10px]" style={{ color: "var(--forest-sage)" }}>
              ✓ Period dikunci admin
            </p>
          ) : (
            <p className="text-[10px]" style={{ color: "var(--coffee-latte)" }}>
              🔒 Period belum dikunci admin
            </p>
          )}
        </div>
      </div>

      {/* Right: format + generate */}
      <div
        className="flex-1 rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
        }}
      >
        {scope === "all" && (
          <>
            <p
              className="text-[11px] mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Pilih format laporan pendukung:
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_FORMATS.map((f) => (
                <label
                  key={f.id}
                  className="flex gap-2.5 items-start p-3 rounded-md cursor-pointer transition-all"
                  style={{
                    border: `0.5px solid ${format === f.id ? "var(--forest-sage)" : "var(--border-subtle)"}`,
                    background:
                      format === f.id ? "rgba(45,90,46,0.07)" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="format"
                    checked={format === f.id}
                    onChange={() => setFormat(f.id)}
                    style={{
                      accentColor: "var(--forest-sage)",
                      marginTop: "2px",
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {f.label}
                      </span>
                      {f.recommended && (
                        <span
                          className="text-[9px] px-1.5 py-px rounded"
                          style={{
                            background: "rgba(45,90,46,0.12)",
                            color: "var(--forest-sage)",
                            border: "0.5px solid rgba(45,90,46,0.3)",
                          }}
                        >
                          Direkomendasikan
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {f.desc}
                      {f.warn && (
                        <span style={{ color: "var(--coffee-latte)" }}>
                          {" "}
                          {f.warn}
                        </span>
                      )}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {scope === "partner" && (
          <p
            className="text-[11px] mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Laporan per partner berisi info kontak, kategori, dan riwayat pickup
            periode ini.
          </p>
        )}

        {generateError && (
          <p className="text-[11px] mb-3" style={{ color: "#f87171" }}>
            {generateError}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
          style={{
            background: "var(--forest-sage)",
            color: "white",
            border: "none",
            opacity: generating ? 0.6 : 1,
          }}
        >
          <i
            className={`fas ${generating ? "fa-circle-notch fa-spin" : "fa-file-pdf"}`}
          />
          {generating
            ? "Membuat PDF..."
            : `Generate PDF Laporan — ${periodLabel}`}
        </button>

        <div
          className="mt-3 rounded-md px-3 py-2.5 text-center text-[10px]"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
          }}
        >
          Dokumen ini bersifat{" "}
          <strong style={{ color: "var(--text-secondary)" }}>
            data pendukung
          </strong>{" "}
          untuk customer — pelaporan resmi ke DLH dilakukan oleh customer
          masing-masing
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EsgSection — main export
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";

export default function EsgSection() {
  const [activeTab, setActiveTab] = useState<SubTab>("ringkasan");
  const [summary, setSummary] = useState<EsgKpiSummary | null>(null);
  const [materials, setMaterials] = useState<EsgMaterialBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { start: periodStart, end: periodEnd } = getMonthRangeISO(yearMonth);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [kpiData, materialData] = await Promise.all([
          fetchEsgKpiSummary(periodStart, periodEnd),
          fetchEsgMaterialBreakdown(periodStart, periodEnd),
        ]);
        if (!cancelled) {
          setSummary(kpiData);
          setMaterials(materialData);
        }
      } catch (err) {
        reportError("EsgSection.loadKpiSummary", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // sengaja [] — cukup jalan sekali saat tab admin dibuka, periodStart/periodEnd
    // stabil selama sesi ini (bulan tidak berganti di tengah sesi kerja admin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">ESG Report</h2>
        <p className="dash-section-sub">
          {loading
            ? "Memuat data..."
            : summary
              ? `${(summary.totalPickupKg / 1000).toFixed(2)} ton diproses · ${(summary.totalDryKg / 1000).toFixed(2)} ton didaur ulang · ${(summary.totalCo2eKg / 1000).toFixed(2)} ton CO₂e dihindari — bulan ini`
              : "Data tidak tersedia"}
        </p>
      </div>
      <KpiRow summary={summary} loading={loading} error={error} />
      <SubTabBar active={activeTab} onChange={setActiveTab} />
      {activeTab === "ringkasan" && (
        <RingkasanTab
          kpi={summary}
          materials={materials}
          loading={loading}
          error={error}
          yearMonth={yearMonth}
          periodStart={periodStart}
          periodEnd={periodEnd}
        />
      )}
      {activeTab === "partner" && <PartnerTab />}
      {activeTab === "indikator" && (
        <IndikatorTab
          kpi={summary}
          materials={materials}
          loading={loading}
          error={error}
        />
      )}
      {activeTab === "governance" && <GovernanceTab kpi={summary} />}
      {activeTab === "laporan" && <LaporanTab yearMonth={yearMonth} />}{" "}
    </div>
  );
}
