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

import React, { useState } from "react";
import { cn } from "@/utils";

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

function KpiRow() {
  const kpis = [
    {
      label: "Total Pickup Bulan Ini",
      value: "682 kg",
      sub: "berat basah · 24 partner",
      color: "var(--coffee-latte)",
    },
    {
      label: "Setelah Pengeringan",
      value: "423 kg",
      sub: "rata-rata loss 38%",
      color: "var(--teal)",
    },
    {
      label: "Stok Tersedia",
      value: "318 kg",
      sub: "siap produksi",
      color: "var(--text-primary)",
    },
    {
      label: "Total Produksi",
      value: "200 kg",
      sub: "biochar + kompos",
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

function Pipeline() {
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

  const stages = [
    {
      num: "1",
      label: "Pickup",
      value: "682 kg",
      sub: "berat basah · per partner",
      note: "📍 Traceability 100% — data per partner tersedia",
      noteColor: "var(--text-muted)",
      noteBg: "var(--bg-primary)",
      numBg: "rgba(196,136,47,0.12)",
      numColor: "var(--coffee-latte)",
      numBorder: "var(--coffee-latte)",
      valueColor: "var(--coffee-latte)",
      badge: "✓ 138 trip",
      badgeBg: "rgba(45,90,46,0.12)",
      badgeColor: "var(--forest-sage)",
      badgeBorder: "rgba(45,90,46,0.3)",
      radius: "7px 0 0 7px",
    },
    {
      num: "2",
      label: "Dryer-Dome",
      value: "423 kg",
      sub: "berat kering · avg loss 38%",
      note: "📍 Traceability 100% — perubahan massa per batch tercatat",
      noteColor: "var(--text-muted)",
      noteBg: "var(--bg-primary)",
      numBg: "var(--teal-bg)",
      numColor: "var(--teal)",
      numBorder: "var(--teal)",
      valueColor: "var(--teal)",
      badge: "14 batch",
      badgeBg: "var(--teal-bg)",
      badgeColor: "var(--teal)",
      badgeBorder: "var(--teal-border)",
      radius: "0",
    },
    {
      num: "3",
      label: "Stock",
      value: "318 kg",
      sub: "tersedia · 2 batch aktif",
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
      value: "200 kg",
      sub: "biochar 115 kg · kompos 85 kg",
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
        Alur Proses Operasional — Mei 2026
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

const PARTNER_DATA = [
  { name: "Hotel Aryaduta", dry: 78, pct: 18.4 },
  { name: "Café Phoenam", dry: 65, pct: 15.4 },
  { name: "Anomali Coffee", dry: 54, pct: 12.8 },
  { name: "Hotel Sahid", dry: 48, pct: 11.3 },
  { name: "Makassar Ramen", dry: 43, pct: 10.2 },
  { name: "Dalton Coffee", dry: 36, pct: 8.5 },
];

function DashboardTab() {
  return (
    <div className="flex gap-3">
      {/* Left: Sankey + Active Batches */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Sankey SVG card */}
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
            Aliran Konversi Agregat — Mei 2026
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
              423 kg kering
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
              115 kg
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
              85 kg
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
              Residu
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
            {[
              {
                id: "DRY-014",
                label: "Dryer Batch — Hotel Aryaduta",
                detail: "Input 80 kg basah · Mulai 24 Mei",
                metricLabel: "Progress",
                metricVal: "67%",
                metricColor: "var(--coffee-latte)",
                tagBg: "rgba(196,136,47,0.12)",
                tagColor: "var(--coffee-latte)",
                tagBorder: "rgba(196,136,47,0.35)",
              },
              {
                id: "STK-007",
                label: "Stock Batch — Mixed (8 partner)",
                detail: "318 kg kering tersedia · Threshold 400 kg",
                metricLabel: "Terisi",
                metricVal: "79.5%",
                metricColor: "var(--teal)",
                tagBg: "var(--teal-bg)",
                tagColor: "var(--teal)",
                tagBorder: "var(--teal-border)",
              },
            ].map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-md px-3 py-2.5"
                style={{ background: "var(--bg-elevated)" }}
              >
                <span
                  className="text-[10px] px-2 py-px rounded flex-shrink-0 font-mono"
                  style={{
                    background: b.tagBg,
                    color: b.tagColor,
                    border: `0.5px solid ${b.tagBorder}`,
                  }}
                >
                  {b.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {b.label}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {b.detail}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {b.metricLabel}
                  </p>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: b.metricColor }}
                  >
                    {b.metricVal}
                  </p>
                </div>
              </div>
            ))}
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
            Mei 2026
          </span>
        </div>

        <div
          className="flex flex-col gap-2 overflow-y-auto"
          style={{ maxHeight: "380px" }}
        >
          {PARTNER_DATA.map((p) => (
            <div
              key={p.name}
              className="rounded-md px-2.5 py-2"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div className="flex justify-between mb-1">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {p.name}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "var(--coffee-latte)" }}
                >
                  {p.dry} kg
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
                    width: `${(p.pct / 18.4) * 100}%`,
                    background: "var(--coffee-latte)",
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          ))}
          <div
            className="text-center text-[10px] py-2 rounded cursor-pointer"
            style={{
              color: "var(--text-muted)",
              border: "0.5px dashed var(--border-default)",
            }}
          >
            +18 partner lainnya · lihat semua →
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Manajemen Batch
// ─────────────────────────────────────────────────────────────────────────────

function BatchTab() {
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

  // Stage bar colors for the stock composition bar
  const COMP_COLORS = [
    "var(--coffee-latte)",
    "var(--forest-sage)",
    "var(--teal)",
    "#7A7AD4",
    "var(--color-error)",
    "#A0826B",
    "#8B8B8B",
    "#C4AA70",
  ];
  const COMP_PCTS = [18.4, 15.4, 12.8, 11.3, 10.2, 8.5, 12.1, 11.3];

  return (
    <div>
      {/* Action bar */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <i className="fas fa-filter text-[9px]" /> Filter
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
          style={{
            background: "var(--coffee-latte)",
            color: "var(--bg-primary)",
            border: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <i className="fas fa-plus text-[9px]" /> Catat Batch Baru
        </button>
      </div>

      {/* Stage 2 — Dryer */}
      {STAGE_HEADER("Tahap 2 — Dryer-Dome", "var(--teal)", "var(--teal-bg)")}
      <div className="flex flex-col gap-2 mb-5">
        {[
          {
            id: "DRY-014",
            idBg: "var(--teal-bg)",
            idColor: "var(--teal)",
            idBorder: "var(--teal-border)",
            name: "Hotel Aryaduta",
            detail: "Input: 80 kg basah · Mulai 24 Mei 2026",
            m1l: "Dry est.",
            m1v: "~50 kg",
            m1c: "var(--teal)",
            m2l: "Progress",
            m2v: "67%",
            m2c: "var(--coffee-latte)",
            statusLabel: "Berlangsung",
            statusBg: "rgba(196,136,47,0.12)",
            statusColor: "var(--coffee-latte)",
            statusBorder: "rgba(196,136,47,0.4)",
            dim: false,
          },
          {
            id: "DRY-013",
            idBg: "rgba(45,90,46,0.12)",
            idColor: "var(--forest-sage)",
            idBorder: "rgba(45,90,46,0.3)",
            name: "Café Phoenam + Dalton Coffee",
            detail: "Input: 164 kg basah · Selesai 22 Mei",
            m1l: "Dry output",
            m1v: "101 kg",
            m1c: "var(--forest-sage)",
            m2l: "Moisture loss",
            m2v: "38.4%",
            m2c: "var(--text-primary)",
            statusLabel: "✓ Selesai",
            statusBg: "rgba(45,90,46,0.12)",
            statusColor: "var(--forest-sage)",
            statusBorder: "rgba(45,90,46,0.3)",
            dim: true,
          },
        ].map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 rounded-lg"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "13px 14px",
              opacity: b.dim ? 0.7 : 1,
            }}
          >
            <div>
              <span
                className="inline-block text-[10px] px-2 py-px rounded font-mono mb-1.5"
                style={{
                  background: b.idBg,
                  color: b.idColor,
                  border: `0.5px solid ${b.idBorder}`,
                }}
              >
                {b.id}
              </span>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {b.name}
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {b.detail}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-5">
              <div className="text-center">
                <p
                  className="text-[10px] mb-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {b.m1l}
                </p>
                <p className="font-semibold text-sm" style={{ color: b.m1c }}>
                  {b.m1v}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-[10px] mb-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {b.m2l}
                </p>
                <p className="font-semibold text-sm" style={{ color: b.m2c }}>
                  {b.m2v}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-[10px] mb-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Status
                </p>
                <span
                  className="text-[10px] px-2 py-px rounded"
                  style={{
                    background: b.statusBg,
                    color: b.statusColor,
                    border: `0.5px solid ${b.statusBorder}`,
                  }}
                >
                  {b.statusLabel}
                </span>
              </div>
            </div>
            <button
              className="flex-shrink-0 px-3 py-1.5 rounded text-[11px]"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              Detail
            </button>
          </div>
        ))}
      </div>

      {/* Stage 3 — Stock */}
      {STAGE_HEADER(
        "Tahap 3 — Stock (Mixed)",
        "var(--coffee-latte)",
        "rgba(196,136,47,0.08)",
      )}
      <div className="flex flex-col gap-2 mb-5">
        <div
          className="rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            padding: "13px 14px",
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
                STK-007
              </span>
              <p
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Stock Batch Aktif — 8 Partner
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Threshold: 400 kg · Tersedia: 318 kg
              </p>
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
                  79.5%
                </p>
              </div>
              <span
                className="text-[10px] px-2 py-px rounded"
                style={{
                  background: "rgba(196,136,47,0.12)",
                  color: "var(--coffee-latte)",
                  border: "0.5px solid rgba(196,136,47,0.4)",
                }}
              >
                Akumulasi
              </span>
            </div>
            <button
              className="flex-shrink-0 px-3 py-1.5 rounded text-[11px]"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              Detail
            </button>
          </div>
          {/* Composition bar */}
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
            {COMP_PCTS.map((pct, i) => (
              <div
                key={i}
                style={{
                  width: `${pct}%`,
                  background: COMP_COLORS[i],
                  opacity: 0.8,
                }}
                title={`${pct}%`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stage 4 — Produksi */}
      {STAGE_HEADER(
        "Tahap 4 — Produksi",
        "var(--forest-sage)",
        "rgba(45,90,46,0.08)",
      )}
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center gap-3 rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            padding: "13px 14px",
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
              PRD-006
            </span>
            <p
              className="text-xs font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Produksi Mei — Stock Batch STK-007
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Input: 318 kg kering · Mulai 20 Mei 2026
            </p>
          </div>
          <div className="ml-auto flex items-center gap-5">
            <div className="text-center">
              <p
                className="text-[10px] mb-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Biochar
              </p>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--forest-sage)" }}
              >
                115 kg
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-[10px] mb-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Kompos
              </p>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--teal)" }}
              >
                85 kg
              </p>
            </div>
            <span
              className="text-[10px] px-2 py-px rounded"
              style={{
                background: "rgba(45,90,46,0.12)",
                color: "var(--forest-sage)",
                border: "0.5px solid rgba(45,90,46,0.3)",
              }}
            >
              ✓ Selesai
            </span>
          </div>
          <button
            className="flex-shrink-0 px-3 py-1.5 rounded text-[11px]"
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Detail
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Laporan Yield
// ─────────────────────────────────────────────────────────────────────────────

const YIELD_ROWS = [
  {
    partner: "Hotel Aryaduta",
    type: "Hotel",
    kec: "Ujung Pandang",
    wet: 118,
    dry: 78,
    loss: "33.9%",
    lossColor: "var(--color-error)",
    stock: "18.4%",
    biochar: "~21 kg",
    kompos: "~16 kg",
  },
  {
    partner: "Café Phoenam",
    type: "Cafe",
    kec: "Rappocini",
    wet: 104,
    dry: 65,
    loss: "37.5%",
    lossColor: "var(--coffee-latte)",
    stock: "15.4%",
    biochar: "~18 kg",
    kompos: "~13 kg",
  },
  {
    partner: "Anomali Coffee",
    type: "Cafe",
    kec: "Tamalate",
    wet: 90,
    dry: 54,
    loss: "40.0%",
    lossColor: "var(--coffee-latte)",
    stock: "12.8%",
    biochar: "~15 kg",
    kompos: "~11 kg",
  },
  {
    partner: "Hotel Sahid",
    type: "Hotel",
    kec: "Makassar",
    wet: 80,
    dry: 48,
    loss: "40.0%",
    lossColor: "var(--coffee-latte)",
    stock: "11.3%",
    biochar: "~13 kg",
    kompos: "~10 kg",
  },
  {
    partner: "Makassar Ramen House",
    type: "Resto",
    kec: "Rappocini",
    wet: 70,
    dry: 43,
    loss: "38.6%",
    lossColor: "var(--forest-sage)",
    stock: "10.2%",
    biochar: "~12 kg",
    kompos: "~9 kg",
  },
];

function YieldTab() {
  const COL = "1.4fr 70px 70px 60px 60px 72px 72px 82px";
  const TH = "text-[9px] uppercase tracking-wider";

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center gap-2 mb-4">
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
        </select>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px]"
          style={{
            background: "rgba(196,136,47,0.08)",
            border: "0.5px solid rgba(196,136,47,0.3)",
            color: "var(--coffee-latte)",
          }}
        >
          ⚡ Atribusi produksi = proporsional berdasarkan dry weight kontribusi
          ke stock
        </div>
        <div className="ml-auto flex gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <i className="fas fa-file-csv text-[9px]" /> Export Semua CSV
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
            style={{
              background: "var(--coffee-latte)",
              color: "var(--bg-primary)",
              border: "none",
            }}
          >
            <i className="fas fa-file-pdf text-[9px]" /> Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "0.5px solid var(--border-subtle)" }}
      >
        {/* Header */}
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
            "Wet kg",
            "Dry kg",
            "Loss%",
            "Stock%",
            "Biochar",
            "Kompos",
            "",
          ].map((h, i) => (
            <div
              key={i}
              className={cn(TH, i > 0 && i < 7 ? "text-right" : "")}
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {YIELD_ROWS.map((r) => (
          <div
            key={r.partner}
            className="grid px-3 py-2.5 items-center cursor-pointer transition-all"
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
                {r.partner}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {r.type} · Kec. {r.kec}
              </p>
            </div>
            <div
              className="text-right text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {r.wet} kg
            </div>
            <div
              className="text-right text-xs font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {r.dry} kg
            </div>
            <div className="text-right text-xs" style={{ color: r.lossColor }}>
              {r.loss}
            </div>
            <div
              className="text-right text-xs font-medium"
              style={{ color: "var(--coffee-latte)" }}
            >
              {r.stock}
            </div>
            <div
              className="text-right text-xs"
              style={{ color: "var(--forest-sage)" }}
            >
              {r.biochar}
            </div>
            <div
              className="text-right text-xs"
              style={{ color: "var(--teal)" }}
            >
              {r.kompos}
            </div>
            <div className="text-right">
              <button
                className="px-2 py-1 rounded text-[10px]"
                style={{
                  background: "var(--bg-elevated)",
                  border: "0.5px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <i className="fas fa-file-pdf text-[9px] mr-1" /> Export
              </button>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{
            background: "var(--bg-elevated)",
            borderTop: "0.5px solid var(--border-subtle)",
          }}
        >
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Menampilkan 5 dari 24 partner · Total 682 kg basah → 423 kg kering
          </span>
          <button
            className="text-[11px] px-3 py-1.5 rounded"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Lihat semua partner →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BioConversionSection — main export
// ─────────────────────────────────────────────────────────────────────────────

export default function BioConversionSection() {
  const [activeTab, setActiveTab] = useState<SubTab>("dashboard");

  return (
    <div>
      {/* Section header */}
      <div className="dash-section-header">
        <h2 className="dash-section-title">Bio Conversion</h2>
        <p className="dash-section-sub">
          682 kg pickup · 423 kg kering · 200 kg produksi — Mei 2026
        </p>
      </div>

      {/* KPI */}
      <KpiRow />

      {/* Pipeline */}
      <Pipeline />

      {/* Sub-tab navigation */}
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "batch" && <BatchTab />}
      {activeTab === "yield" && <YieldTab />}
    </div>
  );
}
