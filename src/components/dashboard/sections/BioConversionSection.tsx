"use client";
// src/components/dashboard/sections/BioConversionSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FASE 8 — Section Bio Conversion
//
// Layout:
//   - KPI row (4 stat card)
//   - 4-Stage Pipeline visual (Pickup → Dryer-Dome → Stock → Produksi)
//   - 3 sub-tab:
//       1. Dashboard Konversi — Sankey SVG + batch aktif + partner breakdown
//       2. Manajemen Batch    — daftar batch per tahap
//       3. Laporan Yield      — tabel per-partner dengan Export PDF per baris
//
// Data: mock static, ported langsung dari rebru_dashboard_v2.html
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/utils";
import { todayWITA, addDays } from "@/utils/date";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  fetchBioKpiSummary,
  fetchActiveBatches,
  fetchPartnerContributionBreakdown,
  fetchStockBatches,
  fetchProductionRuns,
  fetchBatches,
  fetchEligibleStopsForBatch,
  fetchBatchAllocatedTotals,
  fetchStockUsage,
  createBatch,
  completeBatch,
  openNewStockBatch,
  allocateBatchToStock,
  fetchStockBatchComposition,
  createProductionRun,
  completeProductionRun,
  fetchYieldReport,
  type BioKpiSummary,
  type BatchWithPartner,
  type PartnerContribution,
  type StockBatch,
  type ProductionRun,
  type EligibleStop,
  type StockComposition,
  type StockUsageInfo,
  type YieldReportRow,
  type ProductType,
} from "@/lib/supabase-bioconversion";
import { reportError } from "@/lib/report-error";
import { useDashToast } from "@/components/dashboard/DashToastContext";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SubTab = "dashboard" | "batch" | "yield";

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
    { id: "dashboard", label: "Dashboard Konversi" },
    { id: "batch", label: "Manajemen Batch" },
    { id: "yield", label: "Laporan Yield" },
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
  onRetry,
}: {
  summary: BioKpiSummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  // ── Loading — skeleton 4 kartu, tampil HANYA sebelum data pertama ada ──────
  if (loading && !summary) {
    return (
      <div className="dash-kpi-grid">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg animate-pulse"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "14px 16px",
              height: "84px",
            }}
          />
        ))}
      </div>
    );
  }

  // ── Error — HANYA kalau belum pernah punya data sama sekali ────────────────
  if (error && !summary) {
    return (
      <div
        className="rounded-lg px-5 py-4 flex items-center gap-3"
        style={{
          background: "rgba(160,72,72,0.08)",
          border: "0.5px solid rgba(160,72,72,0.3)",
        }}
      >
        <i
          className="fas fa-exclamation-triangle text-xs"
          style={{ color: "var(--color-error)" }}
        />
        <p className="text-sm flex-1" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
        <button
          onClick={onRetry}
          className="text-xs underline"
          style={{ color: "var(--color-error)" }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const lossRate =
    summary.totalPickupKg > 0
      ? Math.round((1 - summary.totalDryKg / summary.totalPickupKg) * 100)
      : 0;

  const kpis = [
    {
      label: "Total Pickup Bulan Ini",
      value: `${summary.totalPickupKg} kg`,
      sub: "berat basah",
      color: "var(--coffee-latte)",
    },
    {
      label: "Setelah Pengeringan",
      value: `${summary.totalDryKg} kg`,
      sub:
        summary.totalPickupKg > 0
          ? `rata-rata loss ${lossRate}%`
          : "belum ada data",
      color: "var(--teal)",
    },
    {
      label: "Stok Tersedia",
      value: `${summary.stockAvailableKg} kg`,
      sub: "siap produksi",
      color: "var(--text-primary)",
    },
    {
      label: "Total Produksi",
      value: `${summary.totalProductionKg} kg`,
      sub: "biochar + kompos + briket + ecogoods",
      color: "var(--forest-sage)",
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
// 4-Stage Pipeline
// ─────────────────────────────────────────────────────────────────────────────

function Pipeline({
  summary,
  activeBatchCount,
  activeStockCount,
  productionByType,
  monthLabel,
}: {
  summary: BioKpiSummary | null;
  activeBatchCount: number;
  activeStockCount: number;
  productionByType: { biochar: number; kompos: number };
  monthLabel: string;
}) {
  const ARROW = (
    <div className="flex items-center px-1 flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path
          d="M4 9h10M10 5l4 4-4 4"
          stroke="#574E44"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  const lossRate =
    summary && summary.totalPickupKg > 0
      ? Math.round((1 - summary.totalDryKg / summary.totalPickupKg) * 100)
      : 0;

  const stages = [
    {
      num: "1",
      label: "Pickup",
      value: `${summary?.totalPickupKg ?? 0} kg`,
      sub: "berat basah · per partner",
      note: "📍 Traceability 100% — data per partner tersedia",
      noteColor: "var(--text-muted)",
      noteBg: "var(--bg-primary)",
      numBg: "rgba(196,136,47,0.12)",
      numColor: "var(--coffee-latte)",
      numBorder: "var(--coffee-latte)",
      valueColor: "var(--coffee-latte)",
      badge: "Live",
      badgeBg: "rgba(45,90,46,0.12)",
      badgeColor: "var(--forest-sage)",
      badgeBorder: "rgba(45,90,46,0.3)",
      radius: "7px 0 0 7px",
    },
    {
      num: "2",
      label: "Dryer-Dome",
      value: `${summary?.totalDryKg ?? 0} kg`,
      sub:
        summary && summary.totalPickupKg > 0
          ? `berat kering · avg loss ${lossRate}%`
          : "berat kering",
      note: "📍 Traceability 100% — perubahan massa per batch tercatat",
      noteColor: "var(--text-muted)",
      noteBg: "var(--bg-primary)",
      numBg: "var(--teal-bg)",
      numColor: "var(--teal)",
      numBorder: "var(--teal)",
      valueColor: "var(--teal)",
      badge: `${activeBatchCount} batch aktif`,
      badgeBg: "var(--teal-bg)",
      badgeColor: "var(--teal)",
      badgeBorder: "var(--teal-border)",
      radius: "0",
    },
    {
      num: "3",
      label: "Stock",
      value: `${summary?.stockAvailableKg ?? 0} kg`,
      sub: `tersedia · ${activeStockCount} pool aktif`,
      note: "⚡ Titik mixing — atribusi menjadi proporsional (dry weight)",
      noteColor: "var(--coffee-latte)",
      noteBg: "rgba(196,136,47,0.06)",
      numBg: "rgba(196,136,47,0.12)",
      numColor: "var(--coffee-latte)",
      numBorder: "var(--coffee-latte)",
      valueColor: "var(--gold)",
      badge: "Mixed",
      badgeBg: "rgba(196,136,47,0.12)",
      badgeColor: "var(--coffee-latte)",
      badgeBorder: "rgba(196,136,47,0.4)",
      radius: "0",
    },
    {
      num: "4",
      label: "Produksi",
      value: `${summary?.totalProductionKg ?? 0} kg`,
      sub: `biochar ${productionByType.biochar} kg · kompos ${productionByType.kompos} kg`,
      note: "📊 Atribusi proporsional berdasarkan dry weight kontribusi",
      noteColor: "var(--text-muted)",
      noteBg: "var(--bg-primary)",
      numBg: "rgba(45,90,46,0.12)",
      numColor: "var(--forest-sage)",
      numBorder: "var(--forest-sage)",
      valueColor: "var(--forest-sage)",
      badge: "Aktif",
      badgeBg: "rgba(45,90,46,0.12)",
      badgeColor: "var(--forest-sage)",
      badgeBorder: "rgba(45,90,46,0.3)",
      radius: "0 7px 7px 0",
    },
  ];

  return (
    <div
      className="rounded-lg mb-4"
      style={{
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
        Alur Proses Operasional — {monthLabel}
      </p>
      <div className="flex items-stretch">
        {stages.map((s, i) => (
          <React.Fragment key={s.num}>
            <div
              key={s.num}
              className="flex-1"
              style={{
                background: "var(--bg-elevated)",
                borderRadius: s.radius,
                border: "0.5px solid var(--border-subtle)",
                padding: "12px 14px",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                  style={{
                    background: s.numBg,
                    border: `0.5px solid ${s.numBorder}`,
                    color: s.numColor,
                  }}
                >
                  {s.num}
                </div>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.label}
                </span>
                <span
                  className="ml-auto text-[9px] px-2 py-px rounded-full"
                  style={{
                    background: s.badgeBg,
                    color: s.badgeColor,
                    border: `0.5px solid ${s.badgeBorder}`,
                  }}
                >
                  {s.badge}
                </span>
              </div>
              {/* Value */}
              <p
                className="font-semibold mb-0.5"
                style={{
                  fontSize: "20px",
                  color: s.valueColor,
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </p>
              <p
                className="text-[10px] mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {s.sub}
              </p>
              {/* Note */}
              <div
                className="rounded text-[9px] px-2 py-1.5"
                style={{ background: s.noteBg, color: s.noteColor }}
              >
                {s.note}
              </div>
            </div>
            {i < stages.length - 1 && ARROW}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Dashboard Konversi
// ─────────────────────────────────────────────────────────────────────────────

// PARTNER_DATA mock DIHAPUS — digantikan fetchPartnerContributionBreakdown()
// yang dipanggil di komponen induk BioConversionSection, dikirim sebagai prop.

function DashboardTab({
  summary,
  activeBatches,
  partnerBreakdown,
  productionByType,
  loading,
  error,
  onRetry,
  monthLabel,
}: {
  summary: BioKpiSummary | null;
  activeBatches: BatchWithPartner[];
  partnerBreakdown: PartnerContribution[];
  productionByType: { biochar: number; kompos: number };
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  monthLabel: string;
}) {
  // ── Loading — hanya sebelum data pertama pernah ada ─────────────────────
  if (loading && activeBatches.length === 0 && partnerBreakdown.length === 0) {
    return (
      <div className="flex gap-3">
        <div
          className="flex-1 rounded-lg animate-pulse"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            height: "320px",
          }}
        />
        <div
          className="flex-shrink-0 rounded-lg animate-pulse"
          style={{
            width: "260px",
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            height: "320px",
          }}
        />
      </div>
    );
  }

  // ── Error — hanya kalau belum pernah ada data sama sekali ────────────────
  if (error && activeBatches.length === 0 && partnerBreakdown.length === 0) {
    return (
      <div
        className="rounded-lg px-5 py-4 flex items-center gap-3"
        style={{
          background: "rgba(160,72,72,0.08)",
          border: "0.5px solid rgba(160,72,72,0.3)",
        }}
      >
        <i
          className="fas fa-exclamation-triangle text-xs"
          style={{ color: "var(--color-error)" }}
        />
        <p className="text-sm flex-1" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
        <button
          onClick={onRetry}
          className="text-xs underline"
          style={{ color: "var(--color-error)" }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const topPct = partnerBreakdown[0]?.pct ?? 1;
  const dryKg = summary?.totalDryKg ?? 0;
  // Residu = sisa dry stock yang belum terpakai biochar/kompos (perkiraan
  // kasar — briket & ecogoods TIDAK dihitung terpisah di visual Sankey ini,
  // lihat catatan di bawah).
  const residuKg = Math.max(
    0,
    Number(
      (dryKg - productionByType.biochar - productionByType.kompos).toFixed(1),
    ),
  );

  return (
    <div className="flex gap-3">
      {/* Left: Sankey + Active Batches */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Sankey SVG card */}
        {/* CATATAN: proporsi visual (path/rect) TETAP statis — cuma label
            angka yang sekarang nyata. Sankey proporsional penuh (bentuk
            mengikuti rasio asli) adalah pekerjaan visualisasi tersendiri,
            di luar scope BC-3 (wiring data). Briket & ecogoods belum
            direpresentasikan di diagram ini (masih 3 alur: biochar/kompos/
            residu, sesuai bentuk SVG asli). */}
        <div
          className="rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            padding: "16px",
          }}
        >
          <p
            className="text-[11px] mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Aliran Konversi Agregat — {monthLabel}
          </p>
          <svg
            viewBox="0 0 480 190"
            style={{ width: "100%", maxHeight: "185px" }}
            aria-label="Sankey diagram konversi bio"
          >
            <defs>
              <linearGradient id="sankey-biochar" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#C4882F" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4A8C5C" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="sankey-kompos" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#C4882F" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2D8080" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Input bar — Dry Stock */}
            <text
              x="40"
              y="9"
              textAnchor="middle"
              fill="#C4882F"
              fontSize="11"
              fontFamily="DM Sans,sans-serif"
              fontWeight="600"
            >
              {dryKg} kg kering
            </text>
            <rect
              x="20"
              y="15"
              width="40"
              height="155"
              rx="4"
              fill="#C4882F"
              opacity="0.5"
            />
            <text
              x="40"
              y="185"
              textAnchor="middle"
              fill="#574E44"
              fontSize="10"
              fontFamily="DM Sans,sans-serif"
            >
              Dry Stock
            </text>

            {/* Flow → Biochar */}
            <path
              d="M60,15 C190,15 190,15 320,15 L320,70 C190,70 190,79 60,79 Z"
              fill="url(#sankey-biochar)"
            />
            <rect
              x="320"
              y="15"
              width="36"
              height="58"
              rx="4"
              fill="#4A8C5C"
              opacity="0.7"
            />
            <text
              x="338"
              y="9"
              textAnchor="middle"
              fill="#4A8C5C"
              fontSize="11"
              fontFamily="DM Sans,sans-serif"
              fontWeight="600"
            >
              {productionByType.biochar} kg
            </text>
            <text
              x="338"
              y="89"
              textAnchor="middle"
              fill="#4A8C5C"
              fontSize="10"
              fontFamily="DM Sans,sans-serif"
            >
              Biochar
            </text>

            {/* Flow → Kompos */}
            <path
              d="M60,83 C190,83 190,83 320,83 L320,130 C190,130 190,140 60,140 Z"
              fill="url(#sankey-kompos)"
            />
            <rect
              x="320"
              y="83"
              width="36"
              height="47"
              rx="4"
              fill="#2D8080"
              opacity="0.7"
            />
            <text
              x="338"
              y="77"
              textAnchor="middle"
              fill="#2D8080"
              fontSize="11"
              fontFamily="DM Sans,sans-serif"
              fontWeight="600"
            >
              {productionByType.kompos} kg
            </text>
            <text
              x="338"
              y="146"
              textAnchor="middle"
              fill="#2D8080"
              fontSize="10"
              fontFamily="DM Sans,sans-serif"
            >
              Kompos
            </text>

            {/* Flow → Residu */}
            <path
              d="M60,144 C190,144 190,150 320,150 L320,170 C190,170 190,170 60,170 Z"
              fill="#574E44"
              opacity="0.3"
            />
            <rect
              x="320"
              y="150"
              width="36"
              height="20"
              rx="4"
              fill="#574E44"
              opacity="0.45"
            />
            <text
              x="338"
              y="185"
              textAnchor="middle"
              fill="#574E44"
              fontSize="10"
              fontFamily="DM Sans,sans-serif"
            >
              Residu ({residuKg} kg)
            </text>

            {/* Labels kanan */}
            <text
              x="400"
              y="46"
              fill="#4A8C5C"
              fontSize="10"
              fontFamily="DM Sans,sans-serif"
            >
              → Produk jual
            </text>
            <text
              x="400"
              y="110"
              fill="#2D8080"
              fontSize="10"
              fontFamily="DM Sans,sans-serif"
            >
              → Pertanian
            </text>
            <text
              x="400"
              y="164"
              fill="#574E44"
              fontSize="10"
              fontFamily="DM Sans,sans-serif"
            >
              → Proses lanjut
            </text>
          </svg>
        </div>

        {/* Active Batches */}
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
            Batch Aktif Saat Ini
          </p>
          <div className="flex flex-col gap-2">
            {activeBatches.length === 0 ? (
              <p
                className="text-[11px] py-3 text-center"
                style={{ color: "var(--text-muted)" }}
              >
                Belum ada batch yang sedang dikeringkan.
              </p>
            ) : (
              activeBatches.map((b) => {
                const daysSinceStart = Math.max(
                  0,
                  Math.floor(
                    (Date.now() - new Date(b.started_at).getTime()) /
                      86_400_000,
                  ),
                );
                const startedLabel = new Date(b.started_at).toLocaleDateString(
                  "id-ID",
                  { day: "numeric", month: "short" },
                );
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <span
                      className="text-[10px] px-2 py-px rounded flex-shrink-0 font-mono"
                      style={{
                        background: "rgba(196,136,47,0.12)",
                        color: "var(--coffee-latte)",
                        border: "0.5px solid rgba(196,136,47,0.35)",
                      }}
                    >
                      {b.batch_code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Dryer Batch — {b.partner?.organization ?? "—"}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Input {b.input_wet_kg} kg basah · Mulai {startedLabel}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Berjalan
                      </p>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "var(--coffee-latte)" }}
                      >
                        {daysSinceStart} hari
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right: Partner Breakdown */}
      <div
        className="flex-shrink-0 rounded-lg"
        style={{
          width: "260px",
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "14px",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-[10px] uppercase tracking-wider"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
              letterSpacing: "0.08em",
            }}
          >
            Kontribusi Partner (Dry)
          </p>
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {monthLabel}
          </span>
        </div>

        <div
          className="flex flex-col gap-2 overflow-y-auto"
          style={{ maxHeight: "380px" }}
        >
          {partnerBreakdown.length === 0 ? (
            <p
              className="text-[11px] py-3 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              Belum ada data kontribusi bulan ini.
            </p>
          ) : (
            partnerBreakdown.map((p) => (
              <div
                key={p.partnerId}
                className="rounded-md px-2.5 py-2"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex justify-between mb-1">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {p.organization}
                  </span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "var(--coffee-latte)" }}
                  >
                    {p.dryKg} kg
                  </span>
                </div>
                <div
                  className="flex justify-between text-[10px] mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span>dry weight contribution</span>
                  <span style={{ color: "var(--teal)" }}>{p.pct}%</span>
                </div>
                {/* Proportional bar */}
                <div
                  className="rounded-full"
                  style={{ height: "3px", background: "var(--bg-primary)" }}
                >
                  <div
                    className="rounded-full h-full"
                    style={{
                      width: `${(p.pct / topPct) * 100}%`,
                      background: "var(--coffee-latte)",
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Manajemen Batch
// ─────────────────────────────────────────────────────────────────────────────

// ── Modal shell & helper (dipakai semua modal BC-4) ─────────────────────────

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-lg w-full max-w-[380px] mx-4"
        style={{
          background: "var(--bg-surface)",
          border: "0.5px solid var(--border-default)",
          padding: "20px",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <i className="fas fa-times text-xs" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label
        className="block text-[10px] uppercase tracking-wider mb-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const modalInputClass = "w-full px-3 py-2 rounded text-xs outline-none";
const modalInputStyle = {
  background: "var(--bg-card)",
  border: "0.5px solid var(--border-default)",
  color: "var(--text-primary)",
};

function ModalSubmitButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 rounded text-xs font-medium mt-2 disabled:opacity-50"
      style={{
        background: "var(--coffee-latte)",
        color: "var(--bg-primary)",
      }}
    >
      {label}
    </button>
  );
}

// ── AddBatchModal — Tahap 2, catat batch baru dari stop yang eligible ───────

function AddBatchModal({
  eligibleStops,
  onClose,
  onSubmit,
}: {
  eligibleStops: EligibleStop[];
  onClose: () => void;
  onSubmit: (stopId: string, partnerId: string, wetKg: number) => Promise<void>;
}) {
  const [stopId, setStopId] = useState("");
  const [wetKg, setWetKg] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = eligibleStops.find((s) => s.id === stopId);

  useEffect(() => {
    if (selected) setWetKg(String(selected.actualKg));
  }, [selected]);

  const handleSubmit = async () => {
    if (!selected || !wetKg) return;
    setSaving(true);
    try {
      await onSubmit(selected.id, selected.partnerId, Number(wetKg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Catat Batch Baru" onClose={onClose}>
      <ModalField label="Pilih Stop — urut FIFO, paling lama menunggu duluan">
        <select
          value={stopId}
          onChange={(e) => setStopId(e.target.value)}
          className={modalInputClass}
          style={modalInputStyle}
        >
          <option value="">— pilih —</option>
          {eligibleStops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.orderNumber ?? "—"} · {s.organization} ·{" "}
              {new Date(s.completedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
      </ModalField>

      {eligibleStops.length === 0 && (
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
          Tidak ada stop yang eligible — semua pickup selesai sudah punya batch.
        </p>
      )}

      <ModalField label="Berat Basah (kg)">
        <input
          type="number"
          value={wetKg}
          onChange={(e) => setWetKg(e.target.value)}
          className={modalInputClass}
          style={modalInputStyle}
        />
      </ModalField>

      <ModalSubmitButton
        label={saving ? "Menyimpan..." : "Buat Batch"}
        disabled={!stopId || !wetKg || saving}
        onClick={handleSubmit}
      />
    </ModalShell>
  );
}

// ── NumberPromptModal — generic, dipakai "Selesaikan Batch" (cuma butuh
// 1 angka: berat kering). "Selesaikan Produksi" sekarang pakai
// CompleteProductionModal sendiri (butuh 2 field: aktual + output) ─────────

function NumberPromptModal({
  title,
  fieldLabel,
  onClose,
  onSubmit,
}: {
  title: string;
  fieldLabel: string;
  onClose: () => void;
  onSubmit: (value: number) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!value) return;
    setSaving(true);
    try {
      await onSubmit(Number(value));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={title} onClose={onClose}>
      <ModalField label={fieldLabel}>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={modalInputClass}
          style={modalInputStyle}
          autoFocus
        />
      </ModalField>
      <ModalSubmitButton
        label={saving ? "Menyimpan..." : "Simpan"}
        disabled={!value || saving}
        onClick={handleSubmit}
      />
    </ModalShell>
  );
}

// ── CompleteProductionModal — Selesaikan produksi, dengan opsi "kembalikan
// sisa" ke pool stock (FASE BC-4.2) ─────────────────────────────────────────

function CompleteProductionModal({
  run,
  onClose,
  onSubmit,
}: {
  run: ProductionRun;
  onClose: () => void;
  onSubmit: (outputKg: number, actualInputKg: number) => Promise<void>;
}) {
  const [outputKg, setOutputKg] = useState("");
  const [actualInputKg, setActualInputKg] = useState(String(run.input_kg));
  const [saving, setSaving] = useState(false);

  const sisaDikembalikan = Math.max(
    0,
    Number((run.input_kg - Number(actualInputKg || run.input_kg)).toFixed(1)),
  );

  const handleSubmit = async () => {
    if (!outputKg || !actualInputKg) return;
    setSaving(true);
    try {
      await onSubmit(Number(outputKg), Number(actualInputKg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Selesaikan ${run.run_code}`} onClose={onClose}>
      <ModalField
        label={`Pemakaian Aktual (kg) — rencana awal ${run.input_kg} kg`}
      >
        <input
          type="number"
          value={actualInputKg}
          max={run.input_kg}
          onChange={(e) => {
            const v = Number(e.target.value);
            setActualInputKg(
              v > run.input_kg ? String(run.input_kg) : e.target.value,
            );
          }}
          className={modalInputClass}
          style={modalInputStyle}
        />
        {sisaDikembalikan > 0 && (
          <p className="text-[10px] mt-1" style={{ color: "var(--teal)" }}>
            {sisaDikembalikan} kg akan dikembalikan ke pool stock, bisa dipakai
            produksi lain.
          </p>
        )}
      </ModalField>
      <ModalField label="Output Produk Jadi (kg)">
        <input
          type="number"
          value={outputKg}
          onChange={(e) => setOutputKg(e.target.value)}
          className={modalInputClass}
          style={modalInputStyle}
        />
      </ModalField>
      <ModalSubmitButton
        label={saving ? "Menyimpan..." : "Selesaikan"}
        disabled={!outputKg || !actualInputKg || saving}
        onClick={handleSubmit}
      />
    </ModalShell>
  );
}

// ── AllocateStockModal — Tahap 2→3, alokasikan batch kering ke pool stock ───

function AllocateStockModal({
  batch,
  remainingBatchKg,
  stockPools,
  onClose,
  onSubmit,
}: {
  batch: BatchWithPartner;
  remainingBatchKg: number;
  stockPools: StockBatch[];
  onClose: () => void;
  onSubmit: (stockBatchId: string, dryKg: number) => Promise<void>;
}) {
  const openPools = stockPools.filter((p) => p.status === "accumulating");
  const [stockBatchId, setStockBatchId] = useState("");
  const [dryKg, setDryKg] = useState(String(remainingBatchKg));
  const [saving, setSaving] = useState(false);

  const selectedPool = openPools.find((p) => p.id === stockBatchId);
  const poolRemaining = selectedPool
    ? Number((selectedPool.threshold_kg - selectedPool.current_kg).toFixed(1))
    : null;
  // Batas maksimal alokasi = yang PALING KECIL antara sisa dry output batch
  // dan sisa kapasitas pool yang dipilih (fix over-allocation).
  const maxAllocatable =
    poolRemaining !== null
      ? Math.min(remainingBatchKg, poolRemaining)
      : remainingBatchKg;

  const handleSubmit = async () => {
    if (!stockBatchId || !dryKg) return;
    setSaving(true);
    try {
      await onSubmit(stockBatchId, Number(dryKg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Alokasikan ${batch.batch_code} ke Stock`}
      onClose={onClose}
    >
      <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
        Sisa dry output batch ini yang belum dialokasikan:{" "}
        <strong style={{ color: "var(--coffee-latte)" }}>
          {remainingBatchKg} kg
        </strong>
      </p>

      <ModalField label="Pilih Pool Stock (accumulating)">
        <select
          value={stockBatchId}
          onChange={(e) => setStockBatchId(e.target.value)}
          className={modalInputClass}
          style={modalInputStyle}
        >
          <option value="">— pilih —</option>
          {openPools.map((p) => (
            <option key={p.id} value={p.id}>
              {p.stock_code} · {p.current_kg}/{p.threshold_kg} kg
            </option>
          ))}
        </select>
      </ModalField>

      {openPools.length === 0 && (
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
          Belum ada pool stock yang terbuka — buka pool baru dulu di Tahap 3.
        </p>
      )}

      <ModalField
        label={`Dry Kg Dialokasikan (maks ${maxAllocatable.toFixed(1)} kg)`}
      >
        <input
          type="number"
          value={dryKg}
          max={maxAllocatable}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDryKg(
              v > maxAllocatable ? String(maxAllocatable) : e.target.value,
            );
          }}
          className={modalInputClass}
          style={modalInputStyle}
        />
      </ModalField>

      <ModalSubmitButton
        label={saving ? "Menyimpan..." : "Alokasikan"}
        disabled={!stockBatchId || !dryKg || Number(dryKg) <= 0 || saving}
        onClick={handleSubmit}
      />
    </ModalShell>
  );
}

// ── OpenStockModal — Tahap 3, buka pool stock baru ──────────────────────────

function OpenStockModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (thresholdKg: number) => Promise<void>;
}) {
  const [threshold, setThreshold] = useState(30);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(threshold);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Buka Pool Stock Baru" onClose={onClose}>
      <ModalField label="Ukuran Pool">
        <div className="flex gap-2">
          {[15, 30, 50].map((t) => (
            <button
              key={t}
              onClick={() => setThreshold(t)}
              className="flex-1 py-2 rounded text-xs"
              style={{
                background:
                  threshold === t ? "var(--coffee-latte)" : "var(--bg-card)",
                color:
                  threshold === t
                    ? "var(--bg-primary)"
                    : "var(--text-secondary)",
                border: "0.5px solid var(--border-default)",
              }}
            >
              {t} kg
            </button>
          ))}
        </div>
      </ModalField>
      <ModalSubmitButton
        label={saving ? "Membuka..." : "Buka Pool"}
        disabled={saving}
        onClick={handleSubmit}
      />
    </ModalShell>
  );
}

// ── StartProductionModal — Tahap 3→4, mulai proses produksi dari 1 pool ────

const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  biochar: "Biochar (Pyrolysis)",
  kompos: "Kompos (Composting)",
  briket: "Briket (Karbonisasi)",
  ecogoods: "Eco-goods (Langsung Pakai)",
};

function StartProductionModal({
  stock,
  remainingKg,
  onClose,
  onSubmit,
}: {
  stock: StockBatch;
  remainingKg: number;
  onClose: () => void;
  onSubmit: (productType: ProductType, inputKg: number) => Promise<void>;
}) {
  const [productType, setProductType] = useState<ProductType>("biochar");
  const [inputKg, setInputKg] = useState(String(remainingKg));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!inputKg) return;
    setSaving(true);
    try {
      await onSubmit(productType, Number(inputKg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Mulai Produksi — ${stock.stock_code}`}
      onClose={onClose}
    >
      <ModalField label="Jenis Produk">
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value as ProductType)}
          className={modalInputClass}
          style={modalInputStyle}
        >
          {(Object.keys(PRODUCT_TYPE_LABEL) as ProductType[]).map((pt) => (
            <option key={pt} value={pt}>
              {PRODUCT_TYPE_LABEL[pt]}
            </option>
          ))}
        </select>
      </ModalField>
      <ModalField label={`Input Kg (sisa tersedia ${remainingKg} kg)`}>
        <input
          type="number"
          value={inputKg}
          max={remainingKg}
          onChange={(e) => {
            const v = Number(e.target.value);
            setInputKg(v > remainingKg ? String(remainingKg) : e.target.value);
          }}
          className={modalInputClass}
          style={modalInputStyle}
        />
      </ModalField>
      <ModalSubmitButton
        label={saving ? "Memulai..." : "Mulai Produksi"}
        disabled={!inputKg || Number(inputKg) <= 0 || saving}
        onClick={handleSubmit}
      />
    </ModalShell>
  );
}

// ── BatchTab — Tahap 2, 3, 4 dengan CRUD penuh (BC-4) ───────────────────────

// FASE BC-4.3 (poin 2 & 3) — diferensiasi visual per kondisi kartu, dipakai
// SAMA di kartu Batch (Tahap 2) dan Stock (Tahap 3) supaya bahasa visualnya
// konsisten di seluruh tab, bukan token warna baru per tempat:
//   "active"     = sedang berjalan (drying / accumulating) — netral, teal
//   "actionable" = butuh aksi admin sekarang (siap dialokasikan/produksi) — gold
//   "done"       = tuntas, tidak perlu diapa-apakan lagi — hijau redup
type CardState = "active" | "actionable" | "done";

const CARD_STATE_STYLE: Record<
  CardState,
  { background: string; border: string; opacity?: number }
> = {
  active: {
    background: "var(--teal-bg)",
    border: "0.5px solid var(--teal-border)",
  },
  actionable: {
    background: "rgba(196,136,47,0.06)",
    border: "0.5px solid rgba(196,136,47,0.35)",
  },
  done: {
    background: "rgba(45,90,46,0.05)",
    border: "0.5px solid rgba(45,90,46,0.25)",
    opacity: 0.75,
  },
};

type BatchModalState =
  | { type: "addBatch" }
  | { type: "completeBatch"; batch: BatchWithPartner }
  | { type: "allocateStock"; batch: BatchWithPartner }
  | { type: "openStock" }
  | { type: "startProduction"; stock: StockBatch }
  | { type: "completeProduction"; run: ProductionRun }
  | null;

function BatchTab() {
  const { show: showToast } = useDashToast();

  const [batches, setBatches] = useState<BatchWithPartner[]>([]);
  const [stockPools, setStockPools] = useState<StockBatch[]>([]);
  const [productionRuns, setProductionRuns] = useState<ProductionRun[]>([]);
  const [compositions, setCompositions] = useState<
    Record<string, StockComposition[]>
  >({});
  const [eligibleStops, setEligibleStops] = useState<EligibleStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<BatchModalState>(null);
  // FASE BC-4.1 — sisa dry output batch (cegah over-allocation) & breakdown
  // pemakaian tiap pool stock (used/remaining/dipakai untuk apa).
  const [allocatedTotals, setAllocatedTotals] = useState<
    Record<string, number>
  >({});
  const [stockUsage, setStockUsage] = useState<Record<string, StockUsageInfo>>(
    {},
  );

  const STAGE_HEADER = (label: string, color: string, bg: string) => (
    <div
      className="flex items-center gap-2 mb-2"
      style={{
        fontSize: "10px",
        color,
        fontFamily: "var(--font-space-mono)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, sp, pr, stops, allocTotals] = await Promise.all([
        fetchBatches(),
        fetchStockBatches(),
        fetchProductionRuns(),
        fetchEligibleStopsForBatch(),
        fetchBatchAllocatedTotals(),
      ]);
      setBatches(b);
      setStockPools(sp);
      setProductionRuns(pr);
      setEligibleStops(stops);
      setAllocatedTotals(allocTotals);

      const comps: Record<string, StockComposition[]> = {};
      const usage: Record<string, StockUsageInfo> = {};
      await Promise.all(
        sp.map(async (pool) => {
          comps[pool.id] = await fetchStockBatchComposition(pool.id);
          usage[pool.id] = await fetchStockUsage(pool.id);
        }),
      );
      setCompositions(comps);
      setStockUsage(usage);
    } catch (err: any) {
      reportError("BioConversionSection.BatchTab.load", err);
      setError(err?.message ?? "Gagal memuat data batch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Handlers — semua try/catch, toast, tutup modal, refresh data ──────────

  const handleAddBatch = async (
    stopId: string,
    partnerId: string,
    wetKg: number,
  ) => {
    try {
      await createBatch(stopId, partnerId, wetKg);
      showToast("Batch baru berhasil dicatat.", "success");
      setModal(null);
      load();
    } catch (err: any) {
      reportError("BioConversionSection.BatchTab.handleAddBatch", err);
      showToast(err?.message ?? "Gagal mencatat batch.", "error");
    }
  };

  const handleCompleteBatch = async (batchId: string, dryKg: number) => {
    try {
      await completeBatch(batchId, dryKg);
      showToast("Batch ditandai selesai.", "success");
      setModal(null);
      load();
    } catch (err: any) {
      reportError("BioConversionSection.BatchTab.handleCompleteBatch", err);
      showToast(err?.message ?? "Gagal menyelesaikan batch.", "error");
    }
  };

  const handleAllocate = async (
    batchId: string,
    stockBatchId: string,
    dryKg: number,
  ) => {
    try {
      await allocateBatchToStock(batchId, stockBatchId, dryKg);
      showToast("Alokasi ke stock berhasil.", "success");
      setModal(null);
      load();
    } catch (err: any) {
      reportError("BioConversionSection.BatchTab.handleAllocate", err);
      showToast(err?.message ?? "Gagal alokasi ke stock.", "error");
    }
  };

  const handleOpenStock = async (thresholdKg: number) => {
    try {
      await openNewStockBatch(thresholdKg);
      showToast("Pool stock baru berhasil dibuka.", "success");
      setModal(null);
      load();
    } catch (err: any) {
      reportError("BioConversionSection.BatchTab.handleOpenStock", err);
      showToast(err?.message ?? "Gagal membuka pool stock.", "error");
    }
  };

  const handleStartProduction = async (
    stockBatchId: string,
    productType: ProductType,
    inputKg: number,
  ) => {
    try {
      await createProductionRun(stockBatchId, productType, inputKg);
      showToast("Proses produksi dimulai.", "success");
      setModal(null);
      load();
    } catch (err: any) {
      reportError("BioConversionSection.BatchTab.handleStartProduction", err);
      showToast(err?.message ?? "Gagal memulai produksi.", "error");
    }
  };

  const handleCompleteProduction = async (
    runId: string,
    outputKg: number,
    actualInputKg: number,
    stockBatchId: string,
  ) => {
    try {
      await completeProductionRun(runId, outputKg, actualInputKg);
      // FASE BC-4.2 — cek sisa pool LANGSUNG setelah update (bukan dari
      // state React yang belum tentu sinkron di titik ini) supaya toast
      // menampilkan kondisi yang benar-benar akurat.
      const usage = await fetchStockUsage(stockBatchId);
      if (usage.remainingKg <= 0.001) {
        showToast(`Pool stock telah habis terpakai.`, "success");
      } else {
        showToast(
          `Produksi selesai. Sisa ${usage.remainingKg} kg di pool siap dipakai produksi lain.`,
          "success",
        );
      }
      setModal(null);
      load();
    } catch (err: any) {
      reportError(
        "BioConversionSection.BatchTab.handleCompleteProduction",
        err,
      );
      showToast(err?.message ?? "Gagal menyelesaikan produksi.", "error");
    }
  };

  // ── Loading / error — hanya sebelum data pertama pernah ada ────────────────

  if (loading && batches.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg animate-pulse"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              height: "64px",
            }}
          />
        ))}
      </div>
    );
  }

  if (error && batches.length === 0) {
    return (
      <div
        className="rounded-lg px-5 py-4 flex items-center gap-3"
        style={{
          background: "rgba(160,72,72,0.08)",
          border: "0.5px solid rgba(160,72,72,0.3)",
        }}
      >
        <i
          className="fas fa-exclamation-triangle text-xs"
          style={{ color: "var(--color-error)" }}
        />
        <p className="text-sm flex-1" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
        <button
          onClick={load}
          className="text-xs underline"
          style={{ color: "var(--color-error)" }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const nonCancelledBatches = batches.filter((b) => b.status !== "cancelled");
  const compColors = [
    "var(--coffee-latte)",
    "var(--forest-sage)",
    "var(--teal)",
    "#7A7AD4",
    "var(--color-error)",
    "#A0826B",
    "#8B8B8B",
    "#C4AA70",
  ];

  return (
    <div>
      {/* Action bar */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setModal({ type: "addBatch" })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
          style={{
            background: "var(--coffee-latte)",
            color: "var(--bg-primary)",
            border: "none",
          }}
        >
          <i className="fas fa-plus text-[9px]" /> Catat Batch Baru
        </button>
      </div>

      {/* Stage 2 — Dryer */}
      {STAGE_HEADER("Tahap 2 — Dryer-Dome", "var(--teal)", "var(--teal-bg)")}
      <div className="flex flex-col gap-2 mb-5">
        {nonCancelledBatches.length === 0 ? (
          <p
            className="text-[11px] py-3 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Belum ada batch dryer tercatat.
          </p>
        ) : (
          nonCancelledBatches.map((b) => {
            const isDrying = b.status === "drying";
            const allocatedSoFar = allocatedTotals[b.id] ?? 0;
            const remainingToAllocate = Number(
              ((b.output_dry_kg ?? 0) - allocatedSoFar).toFixed(1),
            );
            const isFullyAllocated =
              !isDrying && b.output_dry_kg != null && remainingToAllocate <= 0;
            const cardState: CardState = isDrying
              ? "active"
              : isFullyAllocated
                ? "done"
                : "actionable";
            const cardStyle = CARD_STATE_STYLE[cardState];
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-lg"
                style={{
                  background: cardStyle.background,
                  border: cardStyle.border,
                  padding: "13px 14px",
                  opacity: cardStyle.opacity ?? 1,
                }}
              >
                <div>
                  <span
                    className="inline-block text-[10px] px-2 py-px rounded font-mono mb-1.5"
                    style={{
                      background: isDrying
                        ? "var(--teal-bg)"
                        : "rgba(45,90,46,0.12)",
                      color: isDrying ? "var(--teal)" : "var(--forest-sage)",
                      border: `0.5px solid ${
                        isDrying ? "var(--teal-border)" : "rgba(45,90,46,0.3)"
                      }`,
                    }}
                  >
                    {b.batch_code}
                  </span>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {b.partner?.organization ?? "—"}
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Order: {b.stop?.order_number ?? "—"} · Input:{" "}
                    {b.input_wet_kg} kg basah · {isDrying ? "Mulai" : "Selesai"}{" "}
                    {new Date(
                      isDrying
                        ? b.started_at
                        : (b.completed_at ?? b.started_at),
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {/* FASE BC-4.3 (poin 1) — chip, bukan teks polos, supaya
                      tidak mudah terlewat saat masih ada sisa alokasi */}
                  {!isDrying && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded mt-1.5"
                      style={
                        isFullyAllocated
                          ? {
                              background: "rgba(45,90,46,0.12)",
                              color: "var(--forest-sage)",
                              border: "0.5px solid rgba(45,90,46,0.3)",
                            }
                          : {
                              background: "rgba(196,136,47,0.12)",
                              color: "var(--coffee-latte)",
                              border: "0.5px solid rgba(196,136,47,0.35)",
                            }
                      }
                    >
                      <i
                        className={`fas ${isFullyAllocated ? "fa-check" : "fa-box"} text-[8px]`}
                      />
                      {isFullyAllocated
                        ? "Teralokasi Penuh"
                        : `Sisa ${remainingToAllocate} kg belum dialokasikan`}
                    </span>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-5">
                  <div className="text-center">
                    <p
                      className="text-[10px] mb-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {isDrying ? "Status" : "Dry output"}
                    </p>
                    <p
                      className="font-semibold text-sm"
                      style={{
                        color: isDrying
                          ? "var(--coffee-latte)"
                          : "var(--forest-sage)",
                      }}
                    >
                      {isDrying ? "Berlangsung" : `${b.output_dry_kg} kg`}
                    </p>
                  </div>
                </div>
                {isDrying ? (
                  <button
                    onClick={() =>
                      setModal({ type: "completeBatch", batch: b })
                    }
                    className="flex-shrink-0 px-3 py-1.5 rounded text-[11px]"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "0.5px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Selesaikan
                  </button>
                ) : isFullyAllocated ? (
                  <span
                    className="flex-shrink-0 px-3 py-1.5 rounded text-[11px]"
                    style={{
                      background: "rgba(45,90,46,0.1)",
                      color: "var(--forest-sage)",
                      border: "0.5px solid rgba(45,90,46,0.25)",
                    }}
                  >
                    Selesai
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      setModal({ type: "allocateStock", batch: b })
                    }
                    className="flex-shrink-0 px-3 py-1.5 rounded text-[11px]"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "0.5px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Alokasikan
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stage 3 — Stock */}
      <div className="flex items-center justify-between mb-2">
        {STAGE_HEADER(
          "Tahap 3 — Stock (Mixed)",
          "var(--coffee-latte)",
          "rgba(196,136,47,0.08)",
        )}
        <button
          onClick={() => setModal({ type: "openStock" })}
          className="text-[10px] px-2.5 py-1 rounded"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          + Buka Pool Baru
        </button>
      </div>
      <div className="flex flex-col gap-2 mb-5">
        {stockPools.length === 0 ? (
          <p
            className="text-[11px] py-3 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Belum ada pool stock dibuka.
          </p>
        ) : (
          stockPools.map((p) => {
            const comp = compositions[p.id] ?? [];
            const usage = stockUsage[p.id];
            const usedKg = usage?.usedKg ?? 0;
            const remainingKg = usage?.remainingKg ?? p.current_kg;
            const pct =
              p.threshold_kg > 0
                ? Math.round((p.current_kg / p.threshold_kg) * 100)
                : 0;
            const canProduce = p.status === "full" && remainingKg > 0;
            const poolCardState: CardState =
              p.status === "accumulating"
                ? "active"
                : p.status === "used"
                  ? "done"
                  : "actionable"; // status "full" — siap diproduksi, butuh aksi
            const poolCardStyle = CARD_STATE_STYLE[poolCardState];
            return (
              <div
                key={p.id}
                className="rounded-lg"
                style={{
                  background: poolCardStyle.background,
                  border: poolCardStyle.border,
                  padding: "13px 14px",
                  opacity: poolCardStyle.opacity ?? 1,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <span
                      className="inline-block text-[10px] px-2 py-px rounded font-mono mb-1.5"
                      style={{
                        background: "rgba(196,136,47,0.12)",
                        color: "var(--coffee-latte)",
                        border: "0.5px solid rgba(196,136,47,0.4)",
                      }}
                    >
                      {p.stock_code}
                    </span>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Stock Batch — {comp.length} Partner
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Threshold: {p.threshold_kg} kg · Terisi: {p.current_kg} kg
                    </p>
                    {/* FASE BC-4.1 — pemakaian produksi: dipakai berapa, sisa
                        berapa, dan status habis/masih ada sisa */}
                    <p
                      className="text-[10px] mt-0.5"
                      style={{
                        color:
                          p.status === "used"
                            ? "var(--forest-sage)"
                            : "var(--coffee-latte)",
                      }}
                    >
                      {p.status === "used"
                        ? `✓ Habis terpakai (${usedKg} kg untuk produksi)`
                        : usedKg > 0
                          ? `Terpakai ${usedKg} kg · Sisa ${remainingKg} kg untuk produksi`
                          : p.status === "full"
                            ? "Siap diproduksi"
                            : "Masih menerima alokasi batch"}
                    </p>
                    {usage && usage.runs.length > 0 && (
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Dipakai untuk:{" "}
                        {usage.runs
                          .map(
                            (r) =>
                              `${PRODUCT_TYPE_LABEL[r.productType]} (${r.inputKg} kg)`,
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-5">
                    <div className="text-center">
                      <p
                        className="text-[10px] mb-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Terisi
                      </p>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "var(--coffee-latte)" }}
                      >
                        {pct}%
                      </p>
                    </div>
                    <span
                      className="text-[10px] px-2 py-px rounded"
                      style={{
                        background:
                          poolCardState === "active"
                            ? "var(--teal-bg)"
                            : poolCardState === "done"
                              ? "rgba(45,90,46,0.12)"
                              : "rgba(196,136,47,0.12)",
                        color:
                          poolCardState === "active"
                            ? "var(--teal)"
                            : poolCardState === "done"
                              ? "var(--forest-sage)"
                              : "var(--coffee-latte)",
                        border: `0.5px solid ${
                          poolCardState === "active"
                            ? "var(--teal-border)"
                            : poolCardState === "done"
                              ? "rgba(45,90,46,0.3)"
                              : "rgba(196,136,47,0.4)"
                        }`,
                      }}
                    >
                      {p.status === "accumulating"
                        ? "Akumulasi"
                        : p.status === "full"
                          ? "Penuh"
                          : "Terpakai"}
                    </span>
                  </div>
                  {canProduce && (
                    <button
                      onClick={() =>
                        setModal({ type: "startProduction", stock: p })
                      }
                      className="flex-shrink-0 px-3 py-1.5 rounded text-[11px]"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "0.5px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Mulai Produksi
                    </button>
                  )}
                </div>
                {comp.length > 0 && (
                  <>
                    <p
                      className="text-[10px] mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Komposisi dry weight dalam batch ini:
                    </p>
                    <div
                      className="flex rounded overflow-hidden gap-px"
                      style={{ height: "8px" }}
                    >
                      {comp.map((c, i) => {
                        const cPct =
                          p.current_kg > 0
                            ? (c.dryKgAllocated / p.current_kg) * 100
                            : 0;
                        return (
                          <div
                            key={i}
                            style={{
                              width: `${cPct}%`,
                              background: compColors[i % compColors.length],
                              opacity: 0.8,
                            }}
                            title={`${c.partnerOrganization}: ${c.dryKgAllocated} kg`}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stage 4 — Produksi */}
      {STAGE_HEADER(
        "Tahap 4 — Produksi",
        "var(--forest-sage)",
        "rgba(45,90,46,0.08)",
      )}
      <div className="flex flex-col gap-2">
        {productionRuns.length === 0 ? (
          <p
            className="text-[11px] py-3 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Belum ada proses produksi tercatat.
          </p>
        ) : (
          productionRuns.map((r) => {
            const isProcessing = r.status === "processing";
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg"
                style={{
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border-subtle)",
                  padding: "13px 14px",
                  opacity: isProcessing ? 1 : 0.75,
                }}
              >
                <div>
                  <span
                    className="inline-block text-[10px] px-2 py-px rounded font-mono mb-1.5"
                    style={{
                      background: "rgba(45,90,46,0.12)",
                      color: "var(--forest-sage)",
                      border: "0.5px solid rgba(45,90,46,0.3)",
                    }}
                  >
                    {r.run_code}
                  </span>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {PRODUCT_TYPE_LABEL[r.product_type]}
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Input: {r.input_kg} kg kering · Mulai{" "}
                    {new Date(r.started_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-5">
                  <div className="text-center">
                    <p
                      className="text-[10px] mb-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {isProcessing ? "Status" : "Output"}
                    </p>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: "var(--forest-sage)" }}
                    >
                      {isProcessing ? "Berlangsung" : `${r.output_kg} kg`}
                    </p>
                  </div>
                </div>
                {isProcessing && (
                  <button
                    onClick={() =>
                      setModal({ type: "completeProduction", run: r })
                    }
                    className="flex-shrink-0 px-3 py-1.5 rounded text-[11px]"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "0.5px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Selesaikan
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === "addBatch" && (
        <AddBatchModal
          eligibleStops={eligibleStops}
          onClose={() => setModal(null)}
          onSubmit={handleAddBatch}
        />
      )}
      {modal?.type === "completeBatch" && (
        <NumberPromptModal
          title={`Selesaikan ${modal.batch.batch_code}`}
          fieldLabel="Berat Kering (kg)"
          onClose={() => setModal(null)}
          onSubmit={(v) => handleCompleteBatch(modal.batch.id, v)}
        />
      )}
      {modal?.type === "allocateStock" && (
        <AllocateStockModal
          batch={modal.batch}
          remainingBatchKg={Number(
            (
              (modal.batch.output_dry_kg ?? 0) -
              (allocatedTotals[modal.batch.id] ?? 0)
            ).toFixed(1),
          )}
          stockPools={stockPools}
          onClose={() => setModal(null)}
          onSubmit={(stockBatchId, dryKg) =>
            handleAllocate(modal.batch.id, stockBatchId, dryKg)
          }
        />
      )}
      {modal?.type === "openStock" && (
        <OpenStockModal
          onClose={() => setModal(null)}
          onSubmit={handleOpenStock}
        />
      )}
      {modal?.type === "startProduction" && (
        <StartProductionModal
          stock={modal.stock}
          remainingKg={
            stockUsage[modal.stock.id]?.remainingKg ?? modal.stock.current_kg
          }
          onClose={() => setModal(null)}
          onSubmit={(productType, inputKg) =>
            handleStartProduction(modal.stock.id, productType, inputKg)
          }
        />
      )}
      {modal?.type === "completeProduction" && (
        <CompleteProductionModal
          run={modal.run}
          onClose={() => setModal(null)}
          onSubmit={(outputKg, actualInputKg) =>
            handleCompleteProduction(
              modal.run.id,
              outputKg,
              actualInputKg,
              modal.run.stock_batch_id,
            )
          }
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Laporan Yield
// ─────────────────────────────────────────────────────────────────────────────

function YieldTab() {
  const [rows, setRows] = useState<YieldReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = todayWITA();
  const currentMonthValue = today.slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);

  // 6 bulan terakhir (termasuk bulan berjalan), paling baru duluan
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() - i);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return {
      value: `${y}-${m}`,
      label: `${BULAN_PANJANG[d.getUTCMonth()]} ${y}`,
    };
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      const periodStart = `${selectedMonth}-01`;
      const isCurrentMonth = selectedMonth === currentMonthValue;
      const periodEnd = isCurrentMonth
        ? addDays(today, 1) // eksklusif — sampai akhir hari ini
        : m === 12
          ? `${y + 1}-01-01`
          : `${y}-${String(m + 1).padStart(2, "0")}-01`;

      const data = await fetchYieldReport(periodStart, periodEnd);
      setRows(data);
    } catch (err: any) {
      reportError("BioConversionSection.YieldTab.load", err);
      setError(err?.message ?? "Gagal memuat laporan yield");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, currentMonthValue, today]);

  useEffect(() => {
    load();
  }, [load]);

  const monthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  // ── Export CSV — bulk (semua baris) ────────────────────────────────────
  const exportCSV = () => {
    if (rows.length === 0) return;
    const headers = [
      "Partner",
      "Jenis Usaha",
      "Kecamatan",
      "Wet (kg)",
      "Dry (kg)",
      "Loss (%)",
      "Stock Share (%)",
      "Biochar (kg)",
      "Kompos (kg)",
      "Briket (kg)",
      "Ecogoods (kg)",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.organization,
          r.jenisUsaha,
          r.kecamatan,
          r.wetKg,
          r.dryKg,
          r.lossPct,
          r.stockPct,
          r.biocharKg,
          r.komposKg,
          r.briketKg,
          r.ecogoodsKg,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yield-report-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Export PDF — generate LANGSUNG dari data (jsPDF), BUKAN window.print().
  // window.print() merender halaman sungguhan (termasuk MobileGuard) di
  // jendela print preview browser — kalau jendela itu sempit (<1024px),
  // MobileGuard mengira layar kecil dan menampilkan "Buka di Desktop".
  // jsPDF membangun PDF murni dari data, tidak menyentuh DOM/CSS halaman
  // sama sekali, jadi langsung ter-download tanpa preview apa pun.
  const exportPDF = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(13);
    doc.text(`Laporan Yield — ${monthLabel}`, 14, 15);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Atribusi produksi proporsional berdasarkan dry weight kontribusi ke stock",
      14,
      21,
    );

    autoTable(doc, {
      startY: 26,
      head: [
        [
          "Partner",
          "Jenis Usaha",
          "Kecamatan",
          "Wet (kg)",
          "Dry (kg)",
          "Loss %",
          "Stock %",
          "Biochar",
          "Kompos",
          "Briket",
          "Ecogoods",
        ],
      ],
      body: rows.map((r) => [
        r.organization,
        r.jenisUsaha,
        r.kecamatan,
        r.wetKg,
        r.dryKg,
        `${r.lossPct}%`,
        `${r.stockPct}%`,
        r.biocharKg,
        r.komposKg,
        r.briketKg,
        r.ecogoodsKg,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [45, 90, 46] },
      foot: [
        [
          `${rows.length} partner`,
          "",
          "",
          totalWet.toFixed(1),
          totalDry.toFixed(1),
          "",
          "",
          "",
          "",
          "",
          "",
        ],
      ],
      footStyles: { fillColor: [240, 240, 240], textColor: 40 },
    });

    doc.save(`yield-report-${selectedMonth}.pdf`);
  };

  // ── Loading / error ────────────────────────────────────────────────────
  if (loading && rows.length === 0) {
    return (
      <div
        className="rounded-lg animate-pulse"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          height: "320px",
        }}
      />
    );
  }

  if (error && rows.length === 0) {
    return (
      <div
        className="rounded-lg px-5 py-4 flex items-center gap-3"
        style={{
          background: "rgba(160,72,72,0.08)",
          border: "0.5px solid rgba(160,72,72,0.3)",
        }}
      >
        <i
          className="fas fa-exclamation-triangle text-xs"
          style={{ color: "var(--color-error)" }}
        />
        <p className="text-sm flex-1" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
        <button
          onClick={load}
          className="text-xs underline"
          style={{ color: "var(--color-error)" }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const totalWet = rows.reduce((sum, r) => sum + r.wetKg, 0);
  const totalDry = rows.reduce((sum, r) => sum + r.dryKg, 0);

  return (
    <div>
      {/* Header: filter bulan + export */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-[11px] rounded px-3 py-1.5"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={rows.length === 0}
            className="text-[11px] px-3 py-1.5 rounded disabled:opacity-40"
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <i className="fas fa-file-csv text-[10px] mr-1.5" /> Export CSV
          </button>
          <button
            onClick={exportPDF}
            disabled={rows.length === 0}
            className="text-[11px] px-3 py-1.5 rounded disabled:opacity-40"
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <i className="fas fa-print text-[10px] mr-1.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Note atribusi — dipertahankan dari mock asli, masih relevan */}
      <p className="text-[10px] mb-3" style={{ color: "var(--text-muted)" }}>
        ⚡ Atribusi produksi = proporsional berdasarkan dry weight kontribusi ke
        stock — {monthLabel}
      </p>

      {rows.length === 0 ? (
        <div
          className="rounded-lg py-12 text-center"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
          }}
        >
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Belum ada batch selesai di periode ini.
          </p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-x-auto"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
          }}
        >
          <table className="w-full text-[11px]" style={{ minWidth: "820px" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--border-subtle)" }}>
                {[
                  "Partner",
                  "Jenis Usaha",
                  "Wet (kg)",
                  "Dry (kg)",
                  "Loss %",
                  "Stock %",
                  "Biochar",
                  "Kompos",
                  "Briket",
                  "Ecogoods",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-2.5 font-mono uppercase tracking-wider ${i === 0 ? "text-left" : "text-right"}`}
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "9px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.partnerId}
                  style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
                >
                  <td className="px-3 py-2.5">
                    <p
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.organization}
                    </p>
                    <p
                      className="text-[9px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {r.kecamatan}
                    </p>
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {r.jenisUsaha}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {r.wetKg}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-medium"
                    style={{ color: "var(--coffee-latte)" }}
                  >
                    {r.dryKg}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {r.lossPct}%
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    style={{ color: "var(--teal)" }}
                  >
                    {r.stockPct}%
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    style={{ color: "var(--forest-sage)" }}
                  >
                    {r.biocharKg}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    style={{ color: "var(--teal)" }}
                  >
                    {r.komposKg}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    style={{ color: "#d4783a" }}
                  >
                    {r.briketKg}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right"
                    style={{ color: "var(--gold)" }}
                  >
                    {r.ecogoodsKg}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="flex items-center justify-between px-3 py-2.5"
            style={{ borderTop: "0.5px solid var(--border-subtle)" }}
          >
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {rows.length} partner berkontribusi di {monthLabel}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Total: {totalWet.toFixed(1)} kg basah → {totalDry.toFixed(1)} kg
              kering
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BioConversionSection — main export
// ─────────────────────────────────────────────────────────────────────────────

// Label bulan Indonesia — lokal ke file ini (bukan reuse internal date.ts
// yang tidak meng-export array bulan).
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

export default function BioConversionSection() {
  const [activeTab, setActiveTab] = useState<SubTab>("dashboard");

  // ── FASE BC-2 — KPI summary bulan berjalan (tanggal 1 s.d. hari ini) ───────
  const [summary, setSummary] = useState<BioKpiSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const today = todayWITA();
  const periodStart = today.slice(0, 8) + "01";
  const [year, month] = today.split("-");
  const monthLabel = `${BULAN_PANJANG[Number(month) - 1]} ${year}`;

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await fetchBioKpiSummary(periodStart, today);
      setSummary(data);
    } catch (err: any) {
      reportError("BioConversionSection.loadSummary", err);
      setSummaryError(err?.message ?? "Gagal memuat ringkasan Bio-Conversion");
    } finally {
      setSummaryLoading(false);
    }
  }, [periodStart, today]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ── FASE BC-3 — data untuk Pipeline (badge) + DashboardTab ─────────────────
  const [activeBatches, setActiveBatches] = useState<BatchWithPartner[]>([]);
  const [partnerBreakdown, setPartnerBreakdown] = useState<
    PartnerContribution[]
  >([]);
  const [stockPools, setStockPools] = useState<StockBatch[]>([]);
  const [productionByType, setProductionByType] = useState({
    biochar: 0,
    kompos: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const [batches, partners, accumulating, full, doneRuns] =
        await Promise.all([
          fetchActiveBatches(),
          fetchPartnerContributionBreakdown(periodStart, today),
          fetchStockBatches({ status: "accumulating" }),
          fetchStockBatches({ status: "full" }),
          fetchProductionRuns({ status: "done" }),
        ]);

      setActiveBatches(batches);
      setPartnerBreakdown(partners);
      setStockPools([...accumulating, ...full]);

      const biochar = doneRuns
        .filter((r) => r.product_type === "biochar")
        .reduce((sum, r) => sum + (r.output_kg ?? 0), 0);
      const kompos = doneRuns
        .filter((r) => r.product_type === "kompos")
        .reduce((sum, r) => sum + (r.output_kg ?? 0), 0);
      setProductionByType({
        biochar: Number(biochar.toFixed(1)),
        kompos: Number(kompos.toFixed(1)),
      });
    } catch (err: any) {
      reportError("BioConversionSection.loadDashboardData", err);
      setDashboardError(err?.message ?? "Gagal memuat data dashboard");
    } finally {
      setDashboardLoading(false);
    }
  }, [periodStart, today]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div>
      {/* Section header */}
      <div className="dash-section-header">
        <h2 className="dash-section-title">Bio Conversion</h2>
        <p className="dash-section-sub">
          {summary
            ? `${summary.totalPickupKg} kg pickup · ${summary.totalDryKg} kg kering · ${summary.totalProductionKg} kg produksi — ${monthLabel}`
            : `Memuat ringkasan — ${monthLabel}`}
        </p>
      </div>

      {/* KPI */}
      <KpiRow
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        onRetry={loadSummary}
      />

      {/* Pipeline */}
      <Pipeline
        summary={summary}
        activeBatchCount={activeBatches.length}
        activeStockCount={stockPools.length}
        productionByType={productionByType}
        monthLabel={monthLabel}
      />

      {/* Sub-tab navigation */}
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "dashboard" && (
        <DashboardTab
          summary={summary}
          activeBatches={activeBatches}
          partnerBreakdown={partnerBreakdown}
          productionByType={productionByType}
          loading={dashboardLoading}
          error={dashboardError}
          onRetry={loadDashboardData}
          monthLabel={monthLabel}
        />
      )}
      {activeTab === "batch" && <BatchTab />}
      {activeTab === "yield" && <YieldTab />}
    </div>
  );
}
