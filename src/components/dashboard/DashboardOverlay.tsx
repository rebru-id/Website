"use client";
// src/components/dashboard/DashboardOverlay.tsx

import Image from "next/image";
import { cn } from "@/utils";
import BlogManagementTab from "@/components/dashboard/BlogManagementTab";
import { useState, useEffect } from "react";
import { useAuthModal } from "./AuthModalContext";
import { useLogo } from "@/hooks/useLogo";
import { type UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Tab config per role
// ─────────────────────────────────────────────────────────────────────────────

interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  group: "core" | "analytics" | "content";
}

const TABS_BY_ROLE: Record<UserRole, Tab[]> = {
  admin: [
    { id: "overview", label: "Overview", icon: "fa-home", group: "core" },
    {
      id: "waste",
      label: "Waste Log",
      icon: "fa-recycle",
      badge: 3,
      group: "core",
    },
    {
      id: "partners",
      label: "Partners",
      icon: "fa-handshake",
      badge: 2,
      group: "core",
    },
    { id: "esg", label: "ESG", icon: "fa-chart-bar", group: "analytics" },
    {
      id: "reports",
      label: "Reports",
      icon: "fa-file-download",
      group: "analytics",
    },
    { id: "blog", label: "Blog", icon: "fa-newspaper", group: "content" },
  ],
  mitra: [
    { id: "overview", label: "My Dashboard", icon: "fa-home", group: "core" },
    {
      id: "waste",
      label: "Contribution Log",
      icon: "fa-recycle",
      group: "core",
    },
    { id: "impact", label: "Impact", icon: "fa-leaf", group: "analytics" },
    {
      id: "certificate",
      label: "Certificate",
      icon: "fa-certificate",
      group: "analytics",
    },
  ],
  government: [
    { id: "overview", label: "Impact Summary", icon: "fa-home", group: "core" },
    { id: "esg", label: "ESG Data", icon: "fa-chart-bar", group: "analytics" },
    {
      id: "reports",
      label: "Public Reports",
      icon: "fa-file-download",
      group: "analytics",
    },
  ],
  // Collector tidak menggunakan DashboardOverlay — mereka punya halaman /collector.
  // Key ini wajib ada karena Record<UserRole, Tab[]> setelah "collector"
  // ditambahkan ke UserRole. Tanpa ini TypeScript error dan runtime crash.
  collector: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline — mini SVG trend line
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({
  trend,
  color,
}: {
  trend: "up" | "down" | "flat";
  color: string;
}) {
  const points =
    trend === "up"
      ? "0,28 20,24 40,20 60,15 80,10 100,6 120,3 140,1"
      : trend === "down"
        ? "0,4 20,8 40,12 60,16 80,20 100,24 120,26 140,28"
        : "0,16 20,14 40,17 60,13 80,15 100,14 120,16 140,15";

  const fillPoints = points + " 140,32 0,32";

  return (
    <svg
      viewBox="0 0 140 32"
      className="w-full h-8 mt-2"
      preserveAspectRatio="none"
    >
      <polyline points={fillPoints} fill={`${color}14`} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card v2 — with delta & sparkline
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  trend,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaLabel?: string;
  trend?: "up" | "down" | "flat";
}) {
  const trendColor =
    trend === "up"
      ? "var(--forest-sage)"
      : trend === "down"
        ? "var(--color-error)"
        : "var(--coffee-latte)";

  const deltaClass =
    trend === "up"
      ? "dash-delta dash-delta-up"
      : trend === "down"
        ? "dash-delta dash-delta-down"
        : "dash-delta dash-delta-neutral";

  return (
    <div className="dash-stat-card">
      <p className="font-mono text-[0.62rem] tracking-[0.15em] uppercase text-text-muted mb-2">
        {label}
      </p>
      <p className="font-display text-[2rem] font-bold text-text-primary leading-none">
        {value}
        {unit && (
          <span className="text-[0.85rem] text-text-muted font-normal ml-1.5">
            {unit}
          </span>
        )}
      </p>
      {delta && (
        <div className="flex items-center gap-2 mt-2.5">
          <span className={deltaClass}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "·"} {delta}
          </span>
          {deltaLabel && (
            <span className="text-[0.72rem] text-text-muted">{deltaLabel}</span>
          )}
        </div>
      )}
      {trend && <Sparkline trend={trend} color={trendColor} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State — actionable with numbered steps
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
  table,
  steps,
}: {
  icon: string;
  title: string;
  description: string;
  table: string;
  steps: string[];
}) {
  return (
    <div className="dash-empty-state">
      <div className="dash-empty-icon">
        <i className={`fas ${icon}`} />
      </div>
      <p className="font-display text-[1.1rem] text-text-primary">{title}</p>
      <p className="text-[0.85rem] text-text-muted max-w-[360px] leading-relaxed">
        {description}
      </p>
      <div className="dash-empty-steps">
        {steps.map((step, i) => (
          <div key={i} className="dash-empty-step">
            <span className="dash-step-num">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: step }} />
          </div>
        ))}
      </div>
      <p
        className="font-mono text-[0.6rem] tracking-[0.1em] mt-2 px-3 py-1.5 rounded-md"
        style={{
          background: "rgba(45,90,46,0.08)",
          border: "1px solid rgba(122,171,126,0.15)",
          color: "var(--forest-sage)",
        }}
      >
        ⚡ Connect table: <span className="text-text-muted">{table}</span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Content
// ─────────────────────────────────────────────────────────────────────────────

function TabContent({ tabId, role }: { tabId: string; role: UserRole }) {
  // ── Overview ──────────────────────────────────────────────────────────────
  if (tabId === "overview") {
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total waste collected"
            value="—"
            unit="kg"
            delta="—"
            deltaLabel="vs. bulan lalu"
            trend="up"
          />
          <StatCard
            label="CO₂ saved"
            value="—"
            unit="ton"
            delta="—"
            deltaLabel="vs. bulan lalu"
            trend="up"
          />
          <StatCard
            label="Active partners"
            value="—"
            delta="—"
            deltaLabel="bergabung bulan ini"
            trend="flat"
          />
          <StatCard
            label="Products sold"
            value="—"
            unit="units"
            delta="—"
            deltaLabel="vs. bulan lalu"
            trend="flat"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Activity feed */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-mono text-[0.68rem] tracking-[0.15em] uppercase text-text-muted">
                Recent activity
              </h4>
              <span
                className="font-mono text-[0.58rem] tracking-[0.08em] uppercase px-2 py-0.5 rounded"
                style={{
                  background: "rgba(45,90,46,0.1)",
                  color: "var(--forest-sage)",
                }}
              >
                Live
              </span>
            </div>
            {[
              {
                dot: "var(--forest-sage)",
                text: "Supabase terhubung — data akan muncul di sini",
                time: "—",
              },
              {
                dot: "var(--coffee-latte)",
                text: "Submission mitra baru akan ternotifikasi otomatis",
                time: "—",
              },
              {
                dot: "var(--text-muted)",
                text: "Export laporan ESG tersedia setelah data masuk",
                time: "—",
              },
            ].map((item, i) => (
              <div key={i} className="dash-activity-item">
                <span
                  className="dash-activity-dot"
                  style={{ background: item.dot }}
                />
                <p className="flex-1 text-[0.83rem] text-text-secondary leading-snug">
                  {item.text}
                </p>
                <span className="font-mono text-[0.62rem] text-text-muted flex-shrink-0">
                  {item.time}
                </span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <h4 className="font-mono text-[0.68rem] tracking-[0.15em] uppercase text-text-muted mb-5">
              Quick actions
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
                {
                  icon: "fa-recycle",
                  label: "Lihat waste log terbaru",
                  sub: "Waste Log tab",
                },
                {
                  icon: "fa-handshake",
                  label: "Review aplikasi partner",
                  sub: "2 pending",
                },
                {
                  icon: "fa-chart-bar",
                  label: "Update ESG scorecard",
                  sub: "ESG tab",
                },
                {
                  icon: "fa-file-download",
                  label: "Export laporan sustainability",
                  sub: "Reports tab",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-md transition-all cursor-pointer"
                  style={{ border: "1px solid var(--border-subtle)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border-strong)";
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border-subtle)";
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                >
                  <i
                    className={cn("fas", item.icon, "text-[0.85rem] w-4")}
                    style={{ color: "var(--coffee-latte)" }}
                  />
                  <p className="flex-1 text-[0.85rem] text-text-primary">
                    {item.label}
                  </p>
                  <span className="font-mono text-[0.62rem] text-text-muted">
                    {item.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-5 rounded-md px-5 py-3.5"
          style={{
            background: "rgba(45,90,46,0.07)",
            border: "1px solid rgba(74,124,78,0.15)",
          }}
        >
          <p className="font-mono text-[0.65rem] text-forest-sage tracking-[0.08em]">
            ⚡ SUPABASE READY — Connect to load live data from:{" "}
            <span className="text-text-muted">
              global_stats → waste_collections → impact_logs → mitra →
              order_items
            </span>
          </p>
        </div>
      </>
    );
  }

  // ── Waste Log ──────────────────────────────────────────────────────────────
  if (tabId === "waste") {
    return (
      <>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-[1.3rem] font-semibold text-text-primary">
              {role === "mitra"
                ? "Contribution Log"
                : "Waste Collection Records"}
            </h3>
            <p className="font-mono text-[0.62rem] tracking-[0.1em] uppercase text-text-muted mt-0.5">
              Sumber: waste_collections
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-[0.68rem] tracking-[0.08em] uppercase transition-all"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--coffee-latte)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-strong)";
              (e.currentTarget as HTMLElement).style.background =
                "var(--bg-card)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            onClick={() =>
              alert("Connect Supabase untuk mengaktifkan input manual")
            }
          >
            <i className="fas fa-plus text-[0.6rem]" /> Add Entry
          </button>
        </div>

        <div className="dash-filter-bar">
          <input
            type="text"
            placeholder="Cari mitra atau jenis sampah..."
            className="dash-search-input"
          />
          {["Semua", "Pending", "Verified", "Rejected"].map((f) => (
            <button
              key={f}
              className={cn("dash-filter-btn", f === "Semua" && "active")}
            >
              {f}
            </button>
          ))}
        </div>

        <div
          className="overflow-x-auto rounded-md"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          <table className="dash-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mitra</th>
                <th>Waste Type</th>
                <th>Weight (kg)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon="fa-recycle"
                    title="Belum ada data waste collection"
                    description="Data akan muncul setelah koneksi Supabase aktif dan mitra pertama melakukan submission."
                    table="waste_collections"
                    steps={[
                      "Tambahkan Supabase URL & anon key ke <code>.env.local</code>",
                      "Jalankan migration schema <code>waste_collections</code>",
                      "Onboard mitra pertama via tab Partners",
                    ]}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ── Partners ───────────────────────────────────────────────────────────────
  if (tabId === "partners") {
    return (
      <>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-[1.3rem] font-semibold text-text-primary">
              Partner Applications
            </h3>
            <p className="font-mono text-[0.62rem] tracking-[0.1em] uppercase text-text-muted mt-0.5">
              Sumber: partner_applications
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-[0.68em] tracking-[0.08em] uppercase transition-all"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--coffee-latte)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-strong)";
              (e.currentTarget as HTMLElement).style.background =
                "var(--bg-card)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            onClick={() => alert("Connect Supabase untuk invite partner")}
          >
            <i className="fas fa-user-plus text-[0.6rem]" /> Invite Partner
          </button>
        </div>

        <div className="dash-filter-bar">
          <input
            type="text"
            placeholder="Cari nama atau organisasi..."
            className="dash-search-input"
          />
          {["Semua", "Pending", "Approved", "Rejected"].map((f) => (
            <button
              key={f}
              className={cn("dash-filter-btn", f === "Semua" && "active")}
            >
              {f}
            </button>
          ))}
        </div>

        <div
          className="rounded-md"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          <EmptyState
            icon="fa-handshake"
            title="Belum ada aplikasi partner"
            description="Partner baru akan muncul di sini setelah mendaftar melalui halaman publik atau diundang secara manual."
            table="partner_applications"
            steps={[
              "Setup tabel <code>partner_applications</code> di Supabase",
              "Aktifkan form pendaftaran partner di halaman publik",
              "Atau gunakan tombol 'Invite Partner' di atas untuk onboard manual",
            ]}
          />
        </div>

        {/* Preview cards */}
        <div className="mt-6">
          <p className="font-mono text-[0.62rem] tracking-[0.1em] uppercase text-text-muted mb-3">
            Preview — tampilan saat data tersedia
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-40 pointer-events-none select-none">
            {[
              {
                name: "Kopi Kenangan",
                org: "F&B Chain",
                type: "Mitra Utama",
                status: "Approved",
                dot: "var(--forest-sage)",
              },
              {
                name: "Anomali Coffee",
                org: "Coffee Shop",
                type: "Mitra Reguler",
                status: "Pending",
                dot: "var(--gold)",
              },
            ].map((p) => (
              <div key={p.name} className="dash-partner-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-[0.65rem]"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[0.9rem] font-medium text-text-primary">
                        {p.name}
                      </p>
                      <p className="font-mono text-[0.62rem] text-text-muted">
                        {p.org}
                      </p>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] tracking-[0.08em] uppercase px-2.5 py-1 rounded-pill"
                    style={{
                      background: `${p.dot}20`,
                      color: p.dot,
                      border: `1px solid ${p.dot}30`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: p.dot }}
                    />
                    {p.status}
                  </span>
                </div>
                <p className="font-mono text-[0.62rem] text-text-muted mb-3">
                  {p.type}
                </p>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-1.5 rounded text-[0.72rem] font-mono tracking-[0.06em] uppercase"
                    style={{
                      background: "rgba(45,90,46,0.15)",
                      color: "var(--forest-sage)",
                      border: "1px solid rgba(45,90,46,0.25)",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="py-1.5 px-3 rounded text-[0.72rem] font-mono tracking-[0.06em] uppercase"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── ESG ────────────────────────────────────────────────────────────────────
  if (tabId === "esg") {
    const cats = [
      {
        key: "E",
        label: "Environment",
        color: "var(--forest-sage)",
        bg: "rgba(45,90,46,0.15)",
        metrics: [
          { label: "Waste diverted", value: "—", unit: "kg", fill: 0 },
          { label: "CO₂ avoided", value: "—", unit: "ton", fill: 0 },
          { label: "Recycling rate", value: "—", unit: "%", fill: 0 },
        ],
      },
      {
        key: "S",
        label: "Social",
        color: "var(--coffee-latte)",
        bg: "rgba(196,149,106,0.12)",
        metrics: [
          { label: "Active contributors", value: "—", unit: "", fill: 0 },
          { label: "Community reach", value: "—", unit: "org", fill: 0 },
          { label: "UMKM engaged", value: "—", unit: "", fill: 0 },
        ],
      },
      {
        key: "G",
        label: "Governance",
        color: "var(--gold)",
        bg: "rgba(200,168,75,0.1)",
        metrics: [
          { label: "Data verified", value: "—", unit: "", fill: 0 },
          { label: "Traceability", value: "Ready", unit: "", fill: 90 },
          { label: "Audit trail", value: "—", unit: "", fill: 0 },
        ],
      },
    ];

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-[1.3rem] font-semibold text-text-primary">
              ESG Scorecard
            </h3>
            <p className="font-mono text-[0.62rem] tracking-[0.1em] uppercase text-text-muted mt-0.5">
              Environmental · Social · Governance
            </p>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-md"
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--bg-card)",
            }}
          >
            <div>
              <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-text-muted">
                Composite score
              </p>
              <p className="font-display text-[1.6rem] font-bold text-text-primary leading-none mt-0.5">
                —
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {cats.map((cat) => (
            <div
              key={cat.key}
              className="rounded-lg p-5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center font-mono text-[0.65rem] font-bold"
                    style={{ background: cat.bg, color: cat.color }}
                  >
                    {cat.key}
                  </span>
                  <span className="font-mono text-[0.68rem] tracking-[0.1em] uppercase text-text-muted">
                    {cat.label}
                  </span>
                </div>
                <span
                  className="font-mono text-[0.6rem] tracking-[0.08em] uppercase px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(200,168,75,0.12)",
                    color: "var(--gold)",
                  }}
                >
                  Pending
                </span>
              </div>
              <div className="flex flex-col gap-3.5">
                {cat.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.78rem] text-text-muted">
                        {m.label}
                      </span>
                      <span className="font-mono text-[0.75rem] text-text-primary">
                        {m.value}
                        {m.unit && (
                          <span className="text-text-muted ml-0.5">
                            {m.unit}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="dash-progress-track">
                      <div
                        className="dash-progress-fill"
                        style={{
                          width: `${m.fill}%`,
                          background: cat.color,
                          opacity: m.fill === 0 ? 0.2 : 0.8,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-md px-5 py-3.5"
          style={{
            background: "rgba(45,90,46,0.07)",
            border: "1px solid rgba(74,124,78,0.15)",
          }}
        >
          <p className="font-mono text-[0.65rem] text-forest-sage tracking-[0.08em]">
            ⚡ SUPABASE READY — Connect to populate:{" "}
            <span className="text-text-muted">
              impact_logs → waste_collections → partner_applications
            </span>
          </p>
        </div>
      </>
    );
  }

  // ── Reports ────────────────────────────────────────────────────────────────
  if (tabId === "reports") {
    const reports = [
      {
        icon: "fa-file-pdf",
        title: "Executive Summary",
        description:
          "Ringkasan high-level untuk leadership dan investor. Meliputi waste metrics, ESG highlights, dan proyeksi.",
        period: "Q1 2025",
        sources: "global_stats, impact_logs",
        color: "var(--forest-sage)",
        bg: "rgba(45,90,46,0.12)",
        border: "rgba(74,124,78,0.2)",
      },
      {
        icon: "fa-file-pdf",
        title: "Sustainability Report",
        description:
          "Laporan lengkap ESG untuk keperluan pelaporan CSR dan verifikasi pihak ketiga.",
        period: "Full Year 2024",
        sources: "waste_collections, impact_logs, partner_applications",
        color: "var(--forest-sage)",
        bg: "rgba(45,90,46,0.12)",
        border: "rgba(74,124,78,0.2)",
      },
      {
        icon: "fa-file-excel",
        title: "Export Data (Excel)",
        description:
          "Raw data export dari semua tabel operasional. Cocok untuk analisis mandiri di Excel / Google Sheets.",
        period: "All time",
        sources: "waste_collections, partner_applications, order_items",
        color: "var(--coffee-latte)",
        bg: "rgba(196,149,106,0.1)",
        border: "rgba(196,149,106,0.2)",
      },
    ];

    return (
      <>
        <div className="mb-6">
          <h3 className="font-display text-[1.3rem] font-semibold text-text-primary">
            Reports & Exports
          </h3>
          <p className="font-mono text-[0.62rem] tracking-[0.1em] uppercase text-text-muted mt-0.5">
            Generated dari live Supabase data
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((r) => (
            <div
              key={r.title}
              className="dash-report-card"
              onClick={() =>
                alert("Connect Supabase untuk mengaktifkan export")
              }
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: r.bg, border: `1px solid ${r.border}` }}
                >
                  <i
                    className={cn("fas", r.icon, "text-[0.85rem]")}
                    style={{ color: r.color }}
                  />
                </div>
                <h4 className="text-[0.92rem] font-medium text-text-primary leading-tight">
                  {r.title}
                </h4>
              </div>
              <p className="text-[0.8rem] text-text-muted leading-relaxed mb-4">
                {r.description}
              </p>
              <div
                className="rounded-md px-3 py-2.5 mb-4"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[0.58rem] tracking-[0.08em] uppercase text-text-muted">
                    Period
                  </span>
                  <span className="font-mono text-[0.65rem] text-text-secondary">
                    {r.period}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.58rem] tracking-[0.08em] uppercase text-text-muted">
                    Sources
                  </span>
                  <span className="font-mono text-[0.58rem] text-text-muted truncate max-w-[130px]">
                    {r.sources}
                  </span>
                </div>
              </div>
              <button
                className="w-full py-2 rounded-md font-mono text-[0.68rem] tracking-[0.08em] uppercase transition-all"
                style={{
                  border: `1px solid ${r.border}`,
                  color: r.color,
                  background: r.bg,
                }}
              >
                <i className={cn("fas", r.icon, "mr-2 text-[0.6rem]")} />
                Download
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  // ── Blog ───────────────────────────────────────────────────────────────────
  if (tabId === "blog") return <BlogManagementTab />;

  // ── Mitra: Impact ──────────────────────────────────────────────────────────
  if (tabId === "impact") {
    return (
      <>
        <h3 className="font-display text-[1.3rem] font-semibold text-text-primary mb-5">
          Your Impact Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <StatCard
            label="Waste contributed"
            value="—"
            unit="kg"
            trend="up"
            delta="—"
            deltaLabel="vs. bulan lalu"
          />
          <StatCard
            label="CO₂ avoided"
            value="—"
            unit="ton"
            trend="up"
            delta="—"
            deltaLabel="vs. bulan lalu"
          />
        </div>
        <div
          className="rounded-md px-5 py-3.5"
          style={{
            background: "rgba(45,90,46,0.07)",
            border: "1px solid rgba(74,124,78,0.15)",
          }}
        >
          <p className="font-mono text-[0.65rem] text-forest-sage tracking-[0.08em]">
            ⚡ SUPABASE READY — Connect:{" "}
            <span className="text-text-muted">impact_logs</span>
          </p>
        </div>
      </>
    );
  }

  // ── Mitra: Certificate ────────────────────────────────────────────────────
  if (tabId === "certificate") {
    return (
      <div
        className="max-w-[560px] mx-auto text-center rounded-lg p-16"
        style={{
          border: "2px solid var(--border-default)",
          background:
            "linear-gradient(135deg, rgba(74,44,26,0.15), rgba(45,90,46,0.12))",
        }}
      >
        <div className="text-[3rem] mb-5" style={{ color: "var(--gold)" }}>
          <i className="fas fa-certificate" />
        </div>
        <h3 className="font-display text-[1.8rem] text-text-primary mb-3">
          Impact Certificate
        </h3>
        <p className="text-text-secondary text-[0.9rem]">
          Certificates will be generated when contribution data is verified via
          Supabase.
        </p>
      </div>
    );
  }

  return <p className="text-text-secondary">Content coming soon.</p>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Navigation — grouped with separator & badges
// ─────────────────────────────────────────────────────────────────────────────

function TabNav({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: Tab[];
  activeTab: string;
  onSelect: (id: string) => void;
}) {
  const groups = ["core", "analytics", "content"] as const;

  return (
    <div
      className="flex items-center gap-0.5 overflow-x-auto mb-8"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      {groups.map((group, gi) => {
        const groupTabs = tabs.filter((t) => t.group === group);
        if (!groupTabs.length) return null;
        return (
          <div key={group} className="flex items-center gap-0.5">
            {gi > 0 && (
              <div
                className="w-px h-4 mx-2 flex-shrink-0"
                style={{ background: "var(--border-default)" }}
              />
            )}
            {groupTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-[0.78rem] tracking-[0.06em] uppercase whitespace-nowrap border-b-2 -mb-px transition-all duration-200",
                  activeTab === tab.id
                    ? "text-coffee-latte border-coffee-latte"
                    : "text-text-muted border-transparent hover:text-text-secondary",
                )}
              >
                <i className={cn("fas", tab.icon, "text-[0.72rem]")} />
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="dash-tab-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Overlay
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardOverlay() {
  const { session, setSession } = useAuthModal();
  const [activeTab, setActiveTab] = useState("overview");
  const logoSrc = useLogo();

  // ── Sembunyikan navbar publik saat dashboard aktif ──────────────────────
  useEffect(() => {
    const publicHeader = document.querySelector<HTMLElement>("header");
    if (session) {
      if (publicHeader) publicHeader.style.display = "none";
    }
    return () => {
      if (publicHeader) publicHeader.style.display = "";
    };
  }, [session]);

  if (!session) return null;

  // Collector memiliki halaman operasional tersendiri di /collector.
  // DashboardOverlay tidak dirancang untuk mereka — kembalikan null
  // agar overlay tidak terbuka dan tidak ada tab yang perlu dirender.
  if (session.role === "collector") return null;

  const tabs = TABS_BY_ROLE[session.role];
  const initials = getInitials(session.name);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 px-8 py-3.5 flex items-center justify-between backdrop-blur-xl border-b"
        style={{
          backgroundColor: "var(--nav-scrolled-bg)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Left: brand + breadcrumb */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src={logoSrc}
              alt="Rebru"
              width={24}
              height={24}
              className="transition-opacity duration-300"
            />
            <span className="font-display text-[1.15rem] text-text-primary">
              rebru
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 font-mono text-[0.65rem] tracking-[0.08em] uppercase">
            <span className="text-text-muted">Dashboard</span>
            <span className="text-text-muted opacity-40">/</span>
            <span className="text-coffee-latte capitalize">
              {tabs.find((t) => t.id === activeTab)?.label ?? activeTab}
            </span>
          </div>
        </div>

        {/* Center: quick stats */}
        <div className="hidden lg:flex items-center">
          {[
            { value: "—", label: "kg this month" },
            { value: "—", label: "active partners" },
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-baseline gap-1.5 px-5"
              style={{
                borderLeft: i > 0 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <span className="font-display text-[1.1rem] font-semibold text-text-primary">
                {s.value}
              </span>
              <span className="font-mono text-[0.62rem] text-text-muted tracking-[0.06em]">
                {s.label}
              </span>
            </div>
          ))}
          <div
            className="flex items-center gap-1.5 px-5 font-mono text-[0.62rem] tracking-[0.08em] uppercase"
            style={{ borderLeft: "1px solid var(--border-subtle)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--text-muted)" }}
            />
            <span className="text-text-muted">Supabase: offline</span>
          </div>
        </div>

        {/* Right: back + avatar + logout */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSession(null);
              setActiveTab("overview");
            }}
            className="hidden md:flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.08em] uppercase text-text-muted hover:text-coffee-latte transition-colors"
          >
            <i className="fas fa-arrow-left text-[0.6rem]" /> Back to site
          </button>

          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[0.65rem] font-bold flex-shrink-0"
              style={{
                background: "rgba(196,149,106,0.15)",
                border: "1px solid var(--border-default)",
                color: "var(--coffee-latte)",
              }}
            >
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-[0.85rem] font-medium text-text-primary leading-none">
                {session.name}
              </p>
              <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-forest-sage mt-0.5">
                {session.role}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSession(null);
              setActiveTab("overview");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-mono text-[0.65rem] tracking-[0.06em] uppercase text-text-muted hover:text-text-primary transition-all"
            style={{ borderColor: "var(--border-subtle)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-strong)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-subtle)";
            }}
          >
            <i className="fas fa-sign-out-alt text-[0.6rem]" /> Logout
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-8 py-10">
        <div className="mb-8">
          <h2 className="font-display text-[2.2rem] font-semibold text-text-primary">
            Welcome back, {session.name}
          </h2>
          <p className="text-text-secondary text-[0.9rem] mt-1">
            Role:{" "}
            <strong className="text-forest-sage">
              {session.role.charAt(0).toUpperCase() + session.role.slice(1)}
            </strong>
            {" · "}
            <span className="text-text-muted">
              Supabase integration ready to connect
            </span>
          </p>
        </div>

        <TabNav tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
        <TabContent tabId={activeTab} role={session.role} />
      </div>
    </div>
  );
}
