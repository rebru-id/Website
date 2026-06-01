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

import { useState } from "react";
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

function KpiRow() {
  const kpis = [
    {
      label: "Total Diproses",
      value: "6.75 ton",
      sub: "24 partner · Mei 2026",
      color: "var(--coffee-latte)",
    },
    {
      label: "Didaur Ulang",
      value: "4.82 ton",
      sub: "SDG 12.5.1(a) · 71.4%",
      color: "var(--forest-sage)",
    },
    {
      label: "CO₂e Dihindari",
      value: "6.43 ton",
      sub: "IPCC 2006 · perlu validasi",
      color: "var(--teal)",
    },
    {
      label: "Partner Terlacak",
      value: "24 / 24",
      sub: "100% traceability",
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

function RingkasanTab() {
  const [locked, setLocked] = useState(false);

  // 4 metric cards config
  const METRICS = [
    {
      dot: "var(--forest-sage)",
      code: "SDG 12.5.1(a) — Perpres 111/2022",
      title: "Timbulan Sampah Didaur Ulang",
      value: "4.82",
      unit: "ton / bulan",
      valueColor: "var(--forest-sage)",
      delta: "↑ +12% vs Apr",
      deltaColor: "var(--forest-sage)",
      deltaBg: "rgba(45,90,46,0.12)",
      deltaBorder: "rgba(45,90,46,0.3)",
      sub: [
        { label: "Organik", val: "3.14 ton" },
        { label: "Non-Organik", val: "1.68 ton" },
        { label: "Rasio daur ulang", val: "71.4% dari total" },
        { label: "Target KLHK 2025", val: "Reduksi 30%" },
      ],
    },
    {
      dot: "var(--teal)",
      code: "SDG 12.3.1(a) — SIPSN",
      title: "Persentase Sisa Makanan (Food Waste)",
      value: "38.2",
      unit: "%",
      valueColor: "var(--teal)",
      delta: "↓ -3.1% vs Apr",
      deltaColor: "var(--forest-sage)",
      deltaBg: "rgba(45,90,46,0.12)",
      deltaBorder: "rgba(45,90,46,0.3)",
      sub: [
        { label: "Volume food waste", val: "1.84 ton" },
        { label: "Dikompos", val: "1.21 ton" },
        { label: "Target SDG 2030", val: "Kurangi 50%" },
        { label: "Metodologi", val: "FAO food waste index" },
      ],
    },
    {
      dot: "var(--gold)",
      code: "GHG Protocol — Emisi Dihindari",
      title: "Setara CO₂ Tidak Terlepas ke Atmosfer",
      value: "6.43",
      unit: "ton CO₂e",
      valueColor: "var(--gold)",
      delta: "↑ +8% vs Apr",
      deltaColor: "var(--forest-sage)",
      deltaBg: "rgba(45,90,46,0.12)",
      deltaBorder: "rgba(45,90,46,0.3)",
      sub: [
        { label: "Dari komposting", val: "3.82 ton CO₂e" },
        { label: "Dari daur ulang", val: "2.61 ton CO₂e" },
        { label: "Metodologi", val: "IPCC 2006" },
        { label: "⚠ Validasi", val: "Perlu ahli lingk.", isWarn: true },
      ],
    },
    {
      dot: "var(--coffee-latte)",
      code: "SDG 12.4.2 — Total Volume Diproses",
      title: "Semua Jenis Limbah Ditangani",
      value: "6.75",
      unit: "ton / bulan",
      valueColor: "var(--coffee-latte)",
      delta: "↑ +5% vs Apr",
      deltaColor: "var(--forest-sage)",
      deltaBg: "rgba(45,90,46,0.12)",
      deltaBorder: "rgba(45,90,46,0.3)",
      sub: [
        { label: "Partner aktif", val: "24 partner" },
        { label: "Pickup terlaksana", val: "138 kali" },
        { label: "Rata-rata / partner", val: "281 kg/bln" },
        { label: "Format SIPSN", val: "✓ Kompatibel", isGreen: true },
      ],
    },
  ];

  return (
    <div>
      {/* Period control bar */}
      <div className="flex items-center gap-2.5 mb-4">
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
        {!locked ? (
          <span className="text-[10px]" style={{ color: "var(--gold)" }}>
            🔒 Period belum dikunci
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: "var(--forest-sage)" }}>
            ✓ Period dikunci
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <button
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
            onClick={() => setLocked(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-all"
            style={{
              background: locked ? "rgba(45,90,46,0.12)" : "var(--forest-sage)",
              color: locked ? "var(--forest-sage)" : "white",
              border: locked ? "0.5px solid rgba(45,90,46,0.35)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!locked) e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              if (!locked) e.currentTarget.style.opacity = "1";
            }}
          >
            <i className="fas fa-lock text-[9px]" />
            {locked ? "Period Dikunci" : "Kunci Period"}
          </button>
        </div>
      </div>

      {/* 2×2 metric cards */}
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
            {/* Code label */}
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

            {/* Value row */}
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
                  background: m.deltaBg,
                  color: m.deltaColor,
                  border: `0.5px solid ${m.deltaBorder}`,
                }}
              >
                {m.delta}
              </span>
            </div>

            {/* Divider */}
            <div
              className="mb-3"
              style={{ height: "0.5px", background: "var(--border-subtle)" }}
            />

            {/* Sub metrics 2×2 */}
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

      {/* 6-month trend chart */}
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px",
        }}
      >
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
          Tren 6 Bulan — Sampah Didaur Ulang (ton) · SDG 12.5.1(a)
        </p>
        <svg
          viewBox="0 0 500 90"
          style={{ width: "100%", maxHeight: "90px" }}
          aria-label="Tren 6 bulan recycling"
        >
          <defs>
            <linearGradient id="esg-trend" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4A8C5C" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4A8C5C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1="15"
            x2="500"
            y2="15"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="45"
            x2="500"
            y2="45"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="72"
            x2="500"
            y2="72"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
          <path
            d="M50,65 L150,55 L250,48 L350,55 L450,18 L450,78 L350,78 L250,78 L150,78 L50,78 Z"
            fill="url(#esg-trend)"
          />
          <polyline
            points="50,65 150,55 250,48 350,55 450,18"
            fill="none"
            stroke="#4A8C5C"
            strokeWidth="1.5"
          />
          <circle cx="50" cy="65" r="3" fill="#4A8C5C" />
          <circle cx="150" cy="55" r="3" fill="#4A8C5C" />
          <circle cx="250" cy="48" r="3" fill="#4A8C5C" />
          <circle cx="350" cy="55" r="3" fill="#4A8C5C" />
          <circle cx="450" cy="18" r="4" fill="#4A8C5C" />
          <text
            x="50"
            y="88"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            Des'25
          </text>
          <text
            x="150"
            y="88"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            Jan
          </text>
          <text
            x="250"
            y="88"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            Feb–Mar
          </text>
          <text
            x="350"
            y="88"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            Apr
          </text>
          <text
            x="450"
            y="88"
            textAnchor="middle"
            fill="#4A8C5C"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
            fontWeight="500"
          >
            Mei ↑
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Kontribusi Partner
// ─────────────────────────────────────────────────────────────────────────────

const PARTNER_ESG = [
  {
    name: "Hotel Aryaduta",
    type: "Hotel",
    pickup: 8,
    dry: 78,
    stock: "18.4%",
    biochar: "~21 kg",
    kompos: "~16 kg",
    co2e: "1.18 ton",
    pickupTag: "✓ 8/8",
    pickupGreen: true,
  },
  {
    name: "Café Phoenam",
    type: "Cafe",
    pickup: 12,
    dry: 65,
    stock: "15.4%",
    biochar: "~18 kg",
    kompos: "~13 kg",
    co2e: "0.98 ton",
    pickupTag: "✓ 12/12",
    pickupGreen: true,
  },
  {
    name: "Anomali Coffee",
    type: "Cafe",
    pickup: 10,
    dry: 54,
    stock: "12.8%",
    biochar: "~15 kg",
    kompos: "~11 kg",
    co2e: "0.82 ton",
    pickupTag: "✓ 10/10",
    pickupGreen: true,
  },
  {
    name: "Hotel Sahid",
    type: "Hotel",
    pickup: 6,
    dry: 48,
    stock: "11.3%",
    biochar: "~13 kg",
    kompos: "~10 kg",
    co2e: "0.73 ton",
    pickupTag: "✓ 6/6",
    pickupGreen: true,
  },
  {
    name: "Makassar Ramen",
    type: "Resto",
    pickup: 6,
    dry: 43,
    stock: "10.2%",
    biochar: "~12 kg",
    kompos: "~9 kg",
    co2e: "0.65 ton",
    pickupTag: "5/6",
    pickupGreen: false,
  },
];

const BAR_DATA = [
  { name: "Hotel Aryaduta", dry: 78, pct: 100 },
  { name: "Café Phoenam", dry: 65, pct: 83 },
  { name: "Anomali Coffee", dry: 54, pct: 69 },
  { name: "Hotel Sahid", dry: 48, pct: 62 },
  { name: "Makassar Ramen", dry: 43, pct: 55 },
  { name: "Dalton Coffee", dry: 36, pct: 46 },
  { name: "Kopi Senja", dry: 29, pct: 37, dim: true },
  { name: "Excelso Pnk", dry: 24, pct: 31, dim: true },
];

function PartnerTab() {
  const COL = "1.3fr 65px 65px 60px 70px 70px 80px 90px";

  return (
    <div>
      {/* Control bar */}
      <div className="flex items-center gap-2.5 mb-4">
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
        <select
          className="rounded px-2.5 py-1.5 text-[11px] outline-none"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <option>Semua Partner</option>
          <option>Hotel</option>
          <option>Cafe</option>
          <option>Restoran</option>
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
        <div className="ml-auto">
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
        </div>
      </div>

      <div className="flex gap-3">
        {/* Ranked bar chart */}
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
            {BAR_DATA.map((b) => (
              <div key={b.name}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span
                    style={{
                      color: b.dim
                        ? "var(--text-secondary)"
                        : "var(--text-primary)",
                      fontWeight: b.dim ? 400 : 500,
                    }}
                  >
                    {b.name}
                  </span>
                  <span
                    style={{
                      color: b.dim
                        ? "var(--text-secondary)"
                        : "var(--coffee-latte)",
                      fontWeight: b.dim ? 400 : 600,
                    }}
                  >
                    {b.dry} kg
                  </span>
                </div>
                <div
                  className="rounded-full"
                  style={{ height: "6px", background: "var(--bg-elevated)" }}
                >
                  <div
                    className="rounded-full h-full"
                    style={{
                      width: `${b.pct}%`,
                      background: b.dim
                        ? "var(--text-muted)"
                        : "var(--coffee-latte)",
                      opacity: b.dim ? 0.4 : 0.75,
                    }}
                  />
                </div>
              </div>
            ))}
            {/* +16 others */}
            <div
              style={{
                paddingTop: "6px",
                borderTop: "0.5px solid var(--border-subtle)",
              }}
            >
              <div className="flex justify-between text-[11px] mb-1">
                <span style={{ color: "var(--text-muted)" }}>
                  +16 partner lainnya
                </span>
                <span style={{ color: "var(--text-muted)" }}>~146 kg</span>
              </div>
              <div
                className="rounded-full"
                style={{ height: "6px", background: "var(--bg-elevated)" }}
              >
                <div
                  className="rounded-full h-full"
                  style={{
                    width: "34%",
                    background: "var(--text-muted)",
                    opacity: 0.25,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detail table */}
        <div className="flex-1 min-w-0">
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

            {/* Rows */}
            {PARTNER_ESG.map((r) => (
              <div
                key={r.name}
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
                    {r.name}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {r.type} · {r.pickup} pickup
                  </p>
                </div>
                <div
                  className="text-right text-xs font-medium"
                  style={{ color: "var(--coffee-latte)" }}
                >
                  {r.dry} kg
                </div>
                <div
                  className="text-right text-xs"
                  style={{ color: "var(--text-secondary)" }}
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
                <div
                  className="text-right text-xs"
                  style={{ color: "var(--gold)" }}
                >
                  {r.co2e}
                </div>
                <div className="text-right">
                  <span
                    className="text-[9px] px-1.5 py-px rounded"
                    style={{
                      background: r.pickupGreen
                        ? "rgba(45,90,46,0.12)"
                        : "rgba(196,136,47,0.12)",
                      color: r.pickupGreen
                        ? "var(--forest-sage)"
                        : "var(--coffee-latte)",
                      border: `0.5px solid ${r.pickupGreen ? "rgba(45,90,46,0.3)" : "rgba(196,136,47,0.4)"}`,
                    }}
                  >
                    {r.pickupTag}
                  </span>
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
              style={{ background: "var(--bg-elevated)" }}
            >
              <span
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                5 dari 24 partner · Total dry 423 kg · Total CO₂e 6.43 ton
              </span>
              <button
                className="text-[11px] px-3 py-1.5 rounded"
                style={{
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Lihat semua →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Indikator Resmi
// ─────────────────────────────────────────────────────────────────────────────

function IndikatorTab() {
  const INDICATORS = [
    {
      code: "12.5.1(a)",
      codeColor: "var(--forest-sage)",
      desc: "Jumlah timbulan sampah yang didaur ulang",
      value: "4.82 ton",
      barWidth: 80,
      barColor: "var(--forest-sage)",
      note: "Target 30% pengurangan — sumber: WasteLog per partner",
    },
    {
      code: "12.3.1(a)",
      codeColor: "var(--teal)",
      desc: "Persentase sisa makanan (food waste index)",
      value: "38.2%",
      barWidth: 55,
      barColor: "var(--teal)",
      note: "Target pengurangan 50% (SDG 2030) — metodologi FAO",
    },
    {
      code: "12.4.2",
      codeColor: "var(--coffee-latte)",
      desc: "Limbah yang dihasilkan & ditangani",
      value: "6.75 ton",
      barWidth: 70,
      barColor: "var(--coffee-latte)",
      note: "Total volume dikelola Rebru periode ini",
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
  ];

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
          Mei 2026
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

        {/* Warning box */}
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

function GovernanceTab() {
  const COC_CHAIN = [
    { label: "Partner (HoReCa)", amber: false },
    { label: "Pickup (Collector)", amber: false },
    { label: "Dryer-Dome", amber: false },
    { label: "Stock (Mixed)", amber: true },
    { label: "Produksi", amber: false },
    { label: "Buyer / Laporan", amber: false },
  ];

  const COMPLIANCE = [
    { label: "UU No. 18/2008 Pengelolaan Sampah", done: true, tag: "" },
    {
      label: "PP No. 81/2012 Sampah Sejenis Rumah Tangga",
      done: true,
      tag: "",
    },
    { label: "Perda Kota Makassar No. 4/2011", done: true, tag: "" },
    {
      label: "Izin Pengelola Limbah Organik (DLH Makassar)",
      done: false,
      tag: "Proses pengajuan",
    },
    {
      label: "Konfirmasi format SIPSN dengan DLH",
      done: false,
      tag: "Perlu konfirmasi",
    },
  ];

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
        <div className="flex items-center gap-2 flex-wrap mb-5">
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

        {/* Compliance checklist */}
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
          Kepatuhan Regulasi
        </p>
        <div className="flex flex-col gap-2.5">
          {COMPLIANCE.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span
                className="text-sm flex-shrink-0"
                style={{
                  color: c.done ? "var(--forest-sage)" : "var(--coffee-latte)",
                }}
              >
                {c.done ? "✓" : "○"}
              </span>
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

function LaporanTab() {
  const [scope, setScope] = useState<ReportScope>("all");
  const [format, setFormat] = useState<ReportFormat>("sipsn");

  return (
    <div className="flex gap-3">
      {/* Left: scope + period */}
      <div
        className="flex-shrink-0 flex flex-col gap-3"
        style={{ width: "220px" }}
      >
        {/* Scope */}
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
                  {s === "all" ? "Semua 24 partner" : "Pilih satu partner"}
                </p>
              </div>
            </label>
          ))}
          {scope === "partner" && (
            <select
              className="w-full rounded px-2.5 py-1.5 text-[11px] outline-none mt-1"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <option>Pilih partner...</option>
              <option>Hotel Aryaduta</option>
              <option>Café Phoenam</option>
              <option>Anomali Coffee</option>
              <option>Hotel Sahid</option>
              <option>Makassar Ramen</option>
            </select>
          )}
        </div>

        {/* Period */}
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
          <select
            className="w-full rounded px-2.5 py-1.5 text-[11px] outline-none mb-2"
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <option>Mei 2026</option>
            <option>April 2026</option>
            <option>Q1 2026</option>
          </select>
          <p className="text-[10px]" style={{ color: "var(--coffee-latte)" }}>
            🔒 Period belum dikunci admin
          </p>
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
        <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
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
                style={{ accentColor: "var(--forest-sage)", marginTop: "2px" }}
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

        {/* Generate button */}
        <button
          className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all"
          style={{
            background: "var(--forest-sage)",
            color: "white",
            border: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <i className="fas fa-file-pdf" />
          Generate PDF Laporan Pendukung — Mei 2026
        </button>

        {/* Disclaimer */}
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

  return (
    <div>
      {/* Section header */}
      <div className="dash-section-header">
        <h2 className="dash-section-title">ESG Report</h2>
        <p className="dash-section-sub">
          6.75 ton diproses · 4.82 ton didaur ulang · 6.43 ton CO₂e dihindari —
          Mei 2026
        </p>
      </div>

      {/* KPI */}
      <KpiRow />

      {/* Sub-tab navigation */}
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "ringkasan" && <RingkasanTab />}
      {activeTab === "partner" && <PartnerTab />}
      {activeTab === "indikator" && <IndikatorTab />}
      {activeTab === "governance" && <GovernanceTab />}
      {activeTab === "laporan" && <LaporanTab />}
    </div>
  );
}
