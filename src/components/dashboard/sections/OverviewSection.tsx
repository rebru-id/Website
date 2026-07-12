"use client";
// src/components/dashboard/sections/OverviewSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Overview — halaman landing pertama saat admin login.
//
// Data yang di-fetch:
//   fetchTodayRoutes()         → KPI operasional + collector alerts
//   fetchActivePartners()      → partner urgent (untuk AlertSummaryCard)
//   fetchWeekRoutes()          → chart bar minggu ini + completionRate + skipRate
//   fetchPartnerApplications() → KPI mitra (aktif, pending, expiring)
//   fetchMonthlyStats()        → chart bulanan pickup kg per minggu
//   contact_messages           → KPI pesan unread + pesan terbaru
//
// Data yang BELUM tersedia (empty state ditampilkan):
//   batches / production_runs  → Bio-Conversion efficiency + Integration chart
//   Aktifkan dengan uncomment blok "TODO:Supabase" saat tabel tersedia.
//
// Tidak ada aksi di halaman ini — semua interaksi berupa navigasi ke section.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchTodayRoutes,
  fetchWeekRoutes,
  fetchActivePartners,
  fetchLatestStopsForPartners,
} from "@/lib/supabase-collector";

import {
  fetchPartnerApplications,
  countPartnersActivatedInRange,
} from "@/lib/supabase-partner";

import {
  getCollectorAlerts,
  computeUrgentQueue,
  buildDashboardAlerts,
  type DashboardAlert,
  type AlertCategory,
} from "@/lib/scheduling";

import {
  fetchContactMessages,
  countUnreadMessages,
  countMessagesInRange,
  type ContactMessage,
} from "@/lib/supabase-messages";

import {
  todayWITA,
  getMondayWITA,
  formatDisplayDate,
  addDays,
} from "@/utils/date";

import { cn, computeTrendPct } from "@/utils";
import { reportError } from "@/lib/report-error";
import { ModuleNotReadyBanner } from "@/components/ui/ModuleNotReadyBanner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// FASE 1.4 — dipecah jadi 2 interface, mengikuti pemisahan fetch:
//   CoreOverviewData    → tidak bergantung ke selectedMonth
//   MonthlyOverviewData → HANYA bergantung ke selectedMonth
// Supaya ganti dropdown bulan tidak perlu re-fetch data yang tidak berubah,
// dan supaya masing-masing bisa punya loading/error state independen (1.5).

interface CoreOverviewData {
  // Operasional
  stopsDone: number;
  stopsTotal: number;
  kgToday: number;
  // Alerts — FASE 1.2: gabungan partner urgent + collector macet + pesan
  // unread, dari buildDashboardAlerts(). Menggantikan alertCount: number.
  alerts: DashboardAlert[];
  // Mitra
  mitraAktif: number;
  mitraPending: number;
  mitraExpiring: number;
  // Pesan
  pesanUnread: number;
  pesanTerbaru: PesanItem[];
  // Chart minggu
  weekBars: WeekBar[];
  completionRate: number;
  skipRate: number;
  // Indikator tren — FASE 4.2. null = tidak ada basis pembanding.
  operasionalTrendPct: number | null;
  mitraTrendPct: number | null;
  pesanTrendPct: number | null;
  // Bio-Conversion — null = tabel belum tersedia
  bioEfficiency: number | null;
  bioTotalBatch: number | null;
  // Integration Chart — null = tabel belum tersedia
  integrationStages: IntegrationStage[] | null;
}

interface MonthlyOverviewData {
  monthlyBars: MonthBar[];
  monthlyKgTotal: number;
  monthlyKgPrev: number;
}

// PesanItem = alias ContactMessage dari supabase-messages.ts
// Field identik — tidak perlu definisi ulang
type PesanItem = ContactMessage;

interface WeekBar {
  day: string;
  date: string;
  kg: number;
  done: number;
  total: number;
  isToday: boolean;
}

interface MonthBar {
  label: string;
  kg: number;
}

// Struktur IntegrationStage — siap dipakai saat tabel batches tersedia.
// Setiap stage merepresentasikan satu titik dalam alur end-to-end:
//   pickupKg      → dari collection_stops.actual_kg (sudah tersedia)
//   dryKg         → dari batches.output_dry_kg (belum tersedia)
//   completionPct → dari stops done/total per periode
//   skipPct       → dari stops skipped/total per periode
export interface IntegrationStage {
  label: string; // nama stage / periode
  pickupKg: number;
  dryKg: number; // 0 sampai tabel batches tersedia
  completionPct: number;
  skipPct: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
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

function getMonthOptions(): { label: string; value: string }[] {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return options;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  primary,
  secondaryLines,
  accent,
  onClick,
  alert,
  trendPct,
}: {
  icon: string;
  label: string;
  primary: string;
  secondaryLines: string[];
  accent: string;
  onClick?: () => void;
  alert?: boolean;
  trendPct?: number | null;
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-lg px-5 py-4 flex flex-col gap-3 transition-all duration-200"
      style={{
        background: "var(--bg-card)",
        border: alert
          ? "0.5px solid rgba(160,72,72,0.35)"
          : "0.5px solid var(--border-subtle)",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (onClick)
          e.currentTarget.style.borderColor = alert
            ? "rgba(160,72,72,0.6)"
            : "var(--border-default)";
      }}
      onMouseLeave={(e) => {
        if (onClick)
          e.currentTarget.style.borderColor = alert
            ? "rgba(160,72,72,0.35)"
            : "var(--border-subtle)";
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[0.6rem] tracking-[0.12em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{
            background: alert ? "rgba(160,72,72,0.12)" : `${accent}18`,
            color: alert ? "var(--color-error)" : accent,
          }}
        >
          <i className={`fas ${icon} text-[0.6rem]`} />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <p
          className="font-display text-[1.9rem] font-semibold leading-none"
          style={{ color: alert ? "var(--color-error)" : accent }}
        >
          {primary}
        </p>
        {trendPct !== undefined && trendPct !== null && (
          <span
            className="inline-flex items-center gap-1 font-mono text-[0.68rem] font-medium mb-0.5"
            style={{
              color:
                trendPct >= 0 ? "var(--forest-sage)" : "var(--color-error)",
            }}
          >
            <i
              className={`fas ${trendPct >= 0 ? "fa-arrow-up" : "fa-arrow-down"} text-[0.5rem]`}
            />
            {Math.abs(trendPct)}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {secondaryLines.map((line, i) => (
          <p
            key={i}
            className="text-[0.72rem]"
            style={{ color: "var(--text-muted)" }}
          >
            {line}
          </p>
        ))}
      </div>

      {onClick && (
        <p
          className="font-mono text-[0.58rem] tracking-[0.08em] uppercase mt-auto"
          style={{ color: "var(--text-muted)" }}
        >
          Lihat detail →
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AlertSummaryCard — FASE 1.2
//
// Menggantikan KpiCard statis "Perlu Perhatian" yang sebelumnya cuma
// menampilkan SATU angka gabungan (collector macet saja, dari alertCount).
//
// Perubahan dari desain lama:
//   - Badge total SELALU terlihat tanpa perlu klik apa pun — total gabungan
//     partner urgent + collector macet + ringkasan pesan unread
//     (lihat buildDashboardAlerts di scheduling.ts).
//   - Klik header → expand jadi LIST LENGKAP yang bisa di-scroll di dalam
//     kartu (max-height + overflow-y-auto) — BUKAN carousel/rotasi
//     satu-per-satu. Keputusan ini disengaja: kalau alert "bergilir
//     tampil", ada risiko admin melewatkan salah satu yang kebetulan tidak
//     sempat dilihat sebelum berganti ke alert berikutnya. List lengkap +
//     scroll manual memastikan semua alert tetap bisa diakses admin kapan
//     pun, sekaligus tetap hemat ruang saat collapsed (lihat diskusi Fase 0.2).
// ─────────────────────────────────────────────────────────────────────────────

const ALERT_CATEGORY_ICON: Record<AlertCategory, string> = {
  partner: "fa-handshake",
  collector: "fa-route",
  pesan: "fa-envelope",
};

function AlertSummaryCard({
  alerts,
  onNavigate,
}: {
  alerts: DashboardAlert[];
  onNavigate: (section: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = alerts.length;

  // ── Kondisi aman — tidak ada alert sama sekali ──────────────────────────
  if (total === 0) {
    return (
      <div
        className="rounded-lg px-5 py-4 flex flex-col gap-3"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[0.6rem] tracking-[0.12em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Perlu Perhatian
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: "rgba(122,171,126,0.12)",
              color: "var(--forest-sage)",
            }}
          >
            <i className="fas fa-check text-[0.6rem]" />
          </div>
        </div>
        <p
          className="font-display text-[1.9rem] font-semibold leading-none"
          style={{ color: "var(--forest-sage)" }}
        >
          Aman
        </p>
        <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
          Semua partner &amp; collector on track
        </p>
      </div>
    );
  }

  // ── Ada alert — header ringkas selalu terlihat, badge = total ───────────
  return (
    <div
      className="rounded-lg flex flex-col transition-all duration-200"
      style={{
        background: "var(--bg-card)",
        border: "0.5px solid rgba(160,72,72,0.35)",
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="px-5 py-4 flex flex-col gap-3 text-left w-full"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[0.6rem] tracking-[0.12em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Perlu Perhatian
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{
              background: "rgba(160,72,72,0.12)",
              color: "var(--color-error)",
            }}
          >
            <i className="fas fa-exclamation-triangle text-[0.6rem]" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <p
            className="font-display text-[1.9rem] font-semibold leading-none"
            style={{ color: "var(--color-error)" }}
          >
            {total}
          </p>
          <i
            className={cn(
              "fas fa-chevron-down text-[0.65rem] transition-transform duration-200",
              expanded && "rotate-180",
            )}
            style={{ color: "var(--text-muted)" }}
          />
        </div>

        <p
          className="font-mono text-[0.58rem] tracking-[0.08em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          {expanded ? "Klik untuk tutup" : "Klik untuk lihat detail →"}
        </p>
      </button>

      {/* Expand — LIST LENGKAP dan scrollable, bukan rotasi satu-satu */}
      <div
        className="overflow-y-auto transition-all duration-300"
        style={{ maxHeight: expanded ? "260px" : "0px" }}
      >
        <div style={{ borderTop: "0.5px solid rgba(160,72,72,0.2)" }}>
          {alerts.map((a) => (
            <button
              key={`${a.category}-${a.sourceId}`}
              onClick={() => onNavigate(a.navigateTo)}
              className="flex items-start gap-3 px-5 py-3 text-left w-full transition-colors"
              style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-elevated, rgba(255,255,255,0.03))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              <i
                className={cn(
                  "fas",
                  ALERT_CATEGORY_ICON[a.category],
                  "text-[0.65rem] mt-0.5 flex-shrink-0",
                )}
                style={{ color: "var(--color-error)" }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[0.75rem] font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {a.title}
                </p>
                <p
                  className="text-[0.68rem] truncate mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {a.detail}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-mono text-[0.62rem] tracking-[0.14em] uppercase mb-3"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </p>
  );
}

function WeekChart({ bars }: { bars: WeekBar[] }) {
  const maxKg = Math.max(...bars.map((b) => b.kg), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {bars.map((bar) => {
        const pct = bar.kg / maxKg;
        return (
          <div
            key={bar.date}
            className="flex-1 flex flex-col items-center gap-1.5"
          >
            <span
              className="font-mono text-[0.58rem]"
              style={{
                color: bar.isToday
                  ? "var(--coffee-latte)"
                  : "var(--text-muted)",
              }}
            >
              {bar.kg > 0 ? `${bar.kg}` : ""}
            </span>
            <div
              className="w-full rounded-sm relative overflow-hidden"
              style={{ height: "72px", background: "var(--bg-elevated)" }}
            >
              <div
                className="absolute bottom-0 w-full rounded-sm transition-all duration-500"
                style={{
                  height: `${Math.max(pct * 100, bar.kg > 0 ? 4 : 0)}%`,
                  background: bar.isToday
                    ? "var(--coffee-latte)"
                    : bar.done === bar.total && bar.total > 0
                      ? "var(--forest-sage)"
                      : "var(--teal)",
                  opacity: bar.kg === 0 ? 0.2 : 1,
                }}
              />
            </div>
            <span
              className="font-mono text-[0.58rem] tracking-[0.06em]"
              style={{
                color: bar.isToday
                  ? "var(--coffee-latte)"
                  : "var(--text-muted)",
                fontWeight: bar.isToday ? 700 : 400,
              }}
            >
              {bar.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MonthChart({ bars }: { bars: MonthBar[] }) {
  const maxKg = Math.max(...bars.map((b) => b.kg), 1);
  return (
    <div className="flex items-end gap-2 h-20">
      {bars.map((bar, i) => {
        const pct = bar.kg / maxKg;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span
              className="font-mono text-[0.55rem]"
              style={{ color: "var(--text-muted)" }}
            >
              {bar.kg > 0 ? `${bar.kg}` : ""}
            </span>
            <div
              className="w-full rounded-sm relative overflow-hidden"
              style={{ height: "52px", background: "var(--bg-elevated)" }}
            >
              <div
                className="absolute bottom-0 w-full rounded-sm transition-all duration-500"
                style={{
                  height: `${Math.max(pct * 100, bar.kg > 0 ? 4 : 0)}%`,
                  background: "var(--teal)",
                  opacity: bar.kg === 0 ? 0.15 : 0.85,
                }}
              />
            </div>
            <span
              className="font-mono text-[0.55rem]"
              style={{ color: "var(--text-muted)" }}
            >
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Empty state Bio-Conversion ─────────────────────────────────────────────────
// Ditampilkan sampai tabel `batches` dan `production_runs` tersedia di Supabase.
// Saat tabel sudah ada: hapus komponen ini dan ganti dengan BioKpiCard yang
// membaca bioEfficiency + bioTotalBatch dari OverviewData.

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ background: "var(--bg-elevated)" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineError — FASE 1.5
//
// Reusable untuk 2 konteks: error fatal core data (full-width, menggantikan
// seluruh halaman) DAN error monthly chart (di dalam kartu, tidak menjatuhkan
// widget lain). Ini SENGAJA komponen fungsional biasa (bukan ErrorBoundary
// class component) — ErrorBoundary di src/components/ui/ErrorBoundary.tsx
// hanya menangkap error render/JS, BUKAN error dari try/catch async seperti
// kegagalan fetch Supabase. Keduanya saling melengkapi, bukan menggantikan.
// ─────────────────────────────────────────────────────────────────────────────

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-lg px-5 py-4 flex items-center gap-3"
      style={{
        background: "rgba(160,72,72,0.08)",
        border: "0.5px solid rgba(160,72,72,0.3)",
      }}
    >
      <i
        className="fas fa-exclamation-triangle text-xs flex-shrink-0"
        style={{ color: "var(--color-error)" }}
      />
      <p className="text-sm flex-1" style={{ color: "var(--color-error)" }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        className="text-xs underline flex-shrink-0"
        style={{ color: "var(--color-error)" }}
      >
        Coba lagi
      </button>
    </div>
  );
}

function MonthChartSkeleton() {
  return (
    <div className="h-20 flex items-center justify-center">
      <div
        className="w-full h-12 rounded animate-pulse"
        style={{ background: "var(--bg-elevated, rgba(255,255,255,0.04))" }}
      />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-52" />
      <Skeleton className="h-28" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface OverviewSectionProps {
  onNavigate: (section: string) => void;
  // adminName: diambil dari session.name di AuthModalContext
  // Cara pass dari AdminDashboard.tsx:
  //   const { session } = useAuthModal();
  //   <OverviewSection adminName={session?.name ?? "Admin"} onNavigate={...} />
  adminName: string;
}

export default function OverviewSection({
  onNavigate,
  adminName,
}: OverviewSectionProps) {
  // FASE 1.4/1.5 — dipecah jadi 2 slice state independen. Sebelumnya satu
  // `data`/`loading`/`error` menggabungkan semua sumber — ganti dropdown
  // bulan ikut me-refetch data yang tidak berhubungan, dan satu query gagal
  // menjatuhkan seluruh halaman.
  const [core, setCore] = useState<CoreOverviewData | null>(null);
  const [coreLoading, setCoreLoading] = useState(true);
  const [coreError, setCoreError] = useState<string | null>(null);

  const [monthly, setMonthly] = useState<MonthlyOverviewData | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);

  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const today = todayWITA();
  const weekStart = getMondayWITA(today);

  // ── Fetch monthly stats — FASE 3.1/3.2/3.3 ────────────────────────────────
  // Sebelumnya: tarik SEMUA baris sebulan penuh ke browser lalu hitung per
  // minggu pakai Math.ceil(dayOfMonth/7) — definisi "minggu" beda dari chart
  // "Historis Minggu Ini". Sekarang: satu panggilan RPC ke Postgres
  // (get_monthly_pickup_stats), agregasi terjadi di database, dan "minggu"
  // memakai Senin-Minggu (date_trunc('week', ...)) — SAMA dengan
  // getMondayWITA() yang dipakai chart mingguan.
  const fetchMonthlyStats = useCallback(
    async (
      monthValue: string,
    ): Promise<{ bars: MonthBar[]; total: number }> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_monthly_pickup_stats", {
        p_month: monthValue,
      });

      if (error) {
        reportError("OverviewSection.fetchMonthlyStats", error);
        return { bars: [], total: 0 };
      }

      const bars: MonthBar[] = (data ?? []).map((row: any) => ({
        label: row.week_label,
        kg: Number(row.kg ?? 0),
      }));
      const total = Number(bars.reduce((sum, b) => sum + b.kg, 0).toFixed(1));

      return { bars, total };
    },
    [],
  );

  // ── Fetch data CORE — tidak bergantung ke selectedMonth (FASE 1.4) ─────────
  const loadCoreData = useCallback(async () => {
    setCoreLoading(true);
    setCoreError(null);
    try {
      const [todayRoutes, weekRoutes, partners, activePartners] =
        await Promise.all([
          fetchTodayRoutes(),
          fetchWeekRoutes(weekStart),
          fetchPartnerApplications(),
          // FASE 1.2 — di-fetch di sini (paralel dengan yang lain), bukan
          // sequential setelah pesanUnread, supaya tidak menambah waktu
          // tunggu. `partners` (di atas) dan `activePartners` SENGAJA dua
          // fetch berbeda: `partners` = semua status (untuk KPI Mitra),
          // `activePartners` = khusus status "active" dengan field jadwal
          // lengkap (untuk computeUrgentQueue, sama seperti AdminDashboard).
          fetchActivePartners(),
        ]);

      // ── KPI Operasional ──────────────────────────────────────────────────
      const allStopsToday = todayRoutes.flatMap((r: any) => r.stops ?? []);
      const stopsDone = allStopsToday.filter(
        (s: any) => s.status === "done",
      ).length;
      const stopsTotal = allStopsToday.length;
      const kgToday = allStopsToday.reduce(
        (acc: number, s: any) =>
          s.status === "done" ? acc + (s.actual_kg ?? 0) : acc,
        0,
      );
      // FASE 1.3 — collectorAlerts dihitung di sini (butuh todayRoutes).
      // getCollectorAlerts() di scheduling.ts adalah SATU-SATUNYA tempat
      // yang mendefinisikan "collector alert" — dipakai juga oleh
      // AdminDashboard.tsx (badge sidebar). Digabung dengan urgentPartners
      // + pesanUnread di bawah (setelah pesanUnread selesai di-fetch) lewat
      // buildDashboardAlerts() untuk AlertSummaryCard — lihat Fase 1.2.
      const collectorAlerts = getCollectorAlerts(todayRoutes);

      // ── KPI Mitra ────────────────────────────────────────────────────────
      const now = Date.now();
      const mitraAktif = partners.filter((p) => p.status === "active").length;
      const mitraPending = partners.filter(
        (p) => p.status === "pending",
      ).length;
      const mitraExpiring = partners.filter((p) => {
        if (p.status !== "active" || !p.active_until) return false;
        const daysLeft = Math.floor(
          (new Date(p.active_until).getTime() - now) / 86_400_000,
        );
        return daysLeft <= 7 && daysLeft >= 0;
      }).length;

      // ── KPI Pesan ────────────────────────────────────────────────────────
      // Menggunakan helper dari supabase-messages.ts — singleton yang terbukti
      // berfungsi, konsisten dengan MessageSection dan AdminDashboard.
      const [pesanUnread, pesanTerbaru] = await Promise.all([
        countUnreadMessages(),
        fetchContactMessages(3),
      ]);

      // ── FASE 1.2 — Alert terpusat untuk AlertSummaryCard ──────────────────
      // Partner urgent pakai SUMBER SAMA dengan badge sidebar (AdminDashboard)
      // dan Urgent Queue di OperationalSection — computeUrgentQueue() adalah
      // satu-satunya definisi "partner urgent" di seluruh aplikasi.
      const latestStopsForAlert = await fetchLatestStopsForPartners(
        activePartners.map((p) => p.id),
      );
      const urgentPartners = computeUrgentQueue(
        activePartners,
        latestStopsForAlert,
      );
      const alerts = buildDashboardAlerts({
        urgentPartners,
        collectorAlerts,
        unreadMessageCount: pesanUnread,
      });

      // ── FASE 4.2 — Indikator tren KPI ───────────────────────────────────
      const sevenDaysAgo = addDays(today, -6);
      const fourteenDaysAgo = addDays(today, -13);
      const tomorrow = addDays(today, 1);

      const [pesanMingguIni, pesanMingguLalu, mitraMingguIni, mitraMingguLalu] =
        await Promise.all([
          countMessagesInRange(sevenDaysAgo, tomorrow),
          countMessagesInRange(fourteenDaysAgo, sevenDaysAgo),
          countPartnersActivatedInRange(sevenDaysAgo, tomorrow),
          countPartnersActivatedInRange(fourteenDaysAgo, sevenDaysAgo),
        ]);

      const pesanTrendPct = computeTrendPct(pesanMingguIni, pesanMingguLalu);
      const mitraTrendPct = computeTrendPct(mitraMingguIni, mitraMingguLalu);

      // ── Chart minggu ─────────────────────────────────────────────────────
      const dayMap: Record<
        string,
        { kg: number; done: number; total: number }
      > = {};
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i);
        dayMap[d] = { kg: 0, done: 0, total: 0 };
      }
      weekRoutes.forEach((r: any) => {
        const d = r.route_date;
        if (!dayMap[d]) return;
        (r.stops ?? []).forEach((s: any) => {
          dayMap[d].total += 1;
          if (s.status === "done") {
            dayMap[d].done += 1;
            dayMap[d].kg += s.actual_kg ?? 0;
          }
        });
      });

      const weekBars: WeekBar[] = Object.entries(dayMap).map(([date, v]) => {
        const d = new Date(date + "T00:00:00Z");
        return {
          day: date === today ? "Hari" : DAY_NAMES[d.getUTCDay()],
          date,
          kg: Number(v.kg.toFixed(1)),
          done: v.done,
          total: v.total,
          isToday: date === today,
        };
      });

      const allWeekStops = weekRoutes.flatMap((r: any) => r.stops ?? []);
      const weekDone = allWeekStops.filter(
        (s: any) => s.status === "done",
      ).length;
      const weekSkipped = allWeekStops.filter(
        (s: any) => s.status === "skipped",
      ).length;
      const weekTotal = allWeekStops.length;
      const completionRate =
        weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
      const skipRate =
        weekTotal > 0 ? Math.round((weekSkipped / weekTotal) * 100) : 0;

      // Operasional: kg hari ini vs kg kemarin — reuse weekBars
      const yesterday = addDays(today, -1);
      const yesterdayBar = weekBars.find((b) => b.date === yesterday);
      const operasionalTrendPct = yesterdayBar
        ? computeTrendPct(kgToday, yesterdayBar.kg)
        : null;

      // ── Bio-Conversion — belum tersedia ──────────────────────────────────
      // TODO: Supabase — uncomment blok ini saat tabel `batches` tersedia:
      //
      // const { data: batchData } = await supabase
      //   .from("batches")
      //   .select("input_wet_kg, output_dry_kg, status, created_at")
      //   .eq("status", "done")
      //   .gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString());
      //
      // const bioEfficiency =
      //   batchData && batchData.length > 0
      //     ? Number(
      //         (
      //           batchData.reduce(
      //             (acc, b) => acc + (b.output_dry_kg / (b.input_wet_kg || 1)) * 100,
      //             0,
      //           ) / batchData.length
      //         ).toFixed(1),
      //       )
      //     : null;
      // const bioTotalBatch = batchData?.length ?? null;
      //
      // Juga update setData() di bawah: bioEfficiency, bioTotalBatch

      // ── Integration Chart — belum tersedia ──────────────────────────────
      // TODO: Supabase — uncomment saat tabel batches + production_runs tersedia.
      // Lihat komentar di ComingSoonBanner() untuk query lengkap.

      setCore({
        stopsDone,
        stopsTotal,
        kgToday: Number(kgToday.toFixed(1)),
        alerts,
        mitraAktif,
        mitraPending,
        mitraExpiring,
        pesanUnread: pesanUnread,
        pesanTerbaru: pesanTerbaru,
        weekBars,
        completionRate,
        skipRate,
        operasionalTrendPct,
        mitraTrendPct,
        pesanTrendPct,
        // Null sampai tabel tersedia — UI menampilkan empty state
        bioEfficiency: null,
        bioTotalBatch: null,
        integrationStages: null,
      });
    } catch (err: any) {
      reportError("OverviewSection.loadCoreData", err);
      setCoreError(err?.message ?? "Gagal memuat data overview");
    } finally {
      setCoreLoading(false);
    }
  }, [weekStart, today]);

  // ── Fetch data MONTHLY — HANYA bergantung ke selectedMonth (FASE 1.4) ─────
  // Terpisah dari loadCoreData supaya ganti dropdown bulan tidak ikut
  // me-refetch data operasional/mitra/pesan yang tidak berhubungan.
  const loadMonthlyData = useCallback(async () => {
    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const [selYear, selMonth] = selectedMonth.split("-").map(Number);
      const prevMonth =
        selMonth === 1
          ? `${selYear - 1}-12`
          : `${selYear}-${String(selMonth - 1).padStart(2, "0")}`;

      const [monthStats, { total: monthlyKgPrev }] = await Promise.all([
        fetchMonthlyStats(selectedMonth),
        fetchMonthlyStats(prevMonth),
      ]);

      setMonthly({
        monthlyBars: monthStats.bars,
        monthlyKgTotal: monthStats.total,
        monthlyKgPrev,
      });
    } catch (err: any) {
      reportError("OverviewSection.loadMonthlyData", err);
      setMonthlyError(err?.message ?? "Gagal memuat data bulanan");
    } finally {
      setMonthlyLoading(false);
    }
  }, [selectedMonth, fetchMonthlyStats]);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  // Polling ringan khusus KPI core, BUKAN data bulanan (lebih berat)
  useEffect(() => {
    const interval = setInterval(() => {
      loadCoreData();
    }, 45_000);
    return () => clearInterval(interval);
  }, [loadCoreData]);

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : "Selamat sore";
  const firstName = adminName.split(" ")[0];

  // monthlyDelta aman dihitung null-safe — kartu chart bulanan sendiri yang
  // menangani kondisi monthly === null (lihat render di bawah).
  const monthlyDelta = monthly
    ? monthly.monthlyKgTotal - monthly.monthlyKgPrev
    : 0;
  const monthlyDeltaPct =
    monthly && monthly.monthlyKgPrev > 0
      ? Math.round((monthlyDelta / monthly.monthlyKgPrev) * 100)
      : null;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* ── Greeting ── */}
      <div>
        <h1
          className="font-display text-[1.6rem] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {greeting},{" "}
          <em className="not-italic" style={{ color: "var(--coffee-latte)" }}>
            {firstName}
          </em>
          .
        </h1>
        <p
          className="font-mono text-[0.68rem] tracking-[0.08em] mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          {formatDisplayDate(today, { weekday: true })} · rebru admin panel
        </p>
      </div>

      {coreLoading && !core ? (
        <OverviewSkeleton />
      ) : coreError && !core ? (
        <InlineError message={coreError} onRetry={loadCoreData} />
      ) : core ? (
        <>
          {/* ── KPI Cards — 4 kolom (Bio-Conversion menyusul saat tabel tersedia) ── */}
          {/* FASE 4.3 — kalau ada alert aktif, AlertSummaryCard pindah ke
              posisi PALING DEPAN (order: 1) via CSS `order`, supaya hal
              paling urgent langsung terlihat tanpa scan ke ujung grid. */}
          <div className="grid grid-cols-4 gap-3">
            <div style={{ order: core.alerts.length > 0 ? 4 : 1 }}>
              <KpiCard
                icon="fa-route"
                label="Operasional Hari Ini"
                primary={`${core.stopsDone}/${core.stopsTotal}`}
                secondaryLines={[
                  `${core.kgToday} kg terkumpul`,
                  `${core.stopsTotal - core.stopsDone} stop tersisa`,
                ]}
                accent="var(--teal)"
                trendPct={core.operasionalTrendPct}
                onClick={() => onNavigate("operasional")}
              />
            </div>

            <div style={{ order: core.alerts.length > 0 ? 3 : 2 }}>
              <KpiCard
                icon="fa-handshake"
                label="Mitra"
                primary={String(core.mitraAktif)}
                secondaryLines={[
                  `${core.mitraPending} pending approval`,
                  core.mitraExpiring > 0
                    ? `${core.mitraExpiring} expiring ≤7 hari`
                    : "Tidak ada yang expiring",
                ]}
                accent="var(--coffee-latte)"
                trendPct={core.mitraTrendPct}
                onClick={() => onNavigate("partner")}
              />
            </div>

            <div style={{ order: core.alerts.length > 0 ? 2 : 3 }}>
              <KpiCard
                icon="fa-envelope"
                label="Pesan Masuk"
                primary={String(core.pesanUnread)}
                secondaryLines={[
                  core.pesanUnread > 0
                    ? `${core.pesanUnread} belum dibaca`
                    : "Semua pesan sudah dibaca",
                ]}
                accent={
                  core.pesanUnread > 0
                    ? "var(--color-error)"
                    : "var(--text-muted)"
                }
                alert={core.pesanUnread > 0}
                trendPct={core.pesanTrendPct}
                onClick={() => onNavigate("pesan")}
              />
            </div>

            <div style={{ order: core.alerts.length > 0 ? 1 : 4 }}>
              {/* Alert Operasional — FASE 1.2: AlertSummaryCard menggantikan
            KpiCard statis. Menampilkan gabungan partner urgent + collector
            macet + ringkasan pesan unread (bukan cuma collector seperti
            sebelumnya), dengan expand-list on-click. */}
              <AlertSummaryCard alerts={core.alerts} onNavigate={onNavigate} />
            </div>

            {/* TODO: Supabase — saat bioEfficiency !== null, tambah kolom ke-5 dan
            ubah grid menjadi grid-cols-5, lalu ganti dengan:
            <KpiCard
              icon="fa-seedling"
              label="Bio-Conversion"
              primary={`${core.bioEfficiency}%`}
              secondaryLines={[`${core.bioTotalBatch} batch selesai`, "Efisiensi konversi"]}
              accent="var(--forest-sage)"
              onClick={() => onNavigate("bio")}
            />
        */}
          </div>

          {/* ── Chart Minggu Ini ── */}
          <div
            className="rounded-lg px-5 py-4"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <SectionLabel>Historis Minggu Ini</SectionLabel>
                <p
                  className="font-mono text-[0.68rem]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatDisplayDate(weekStart, { short: true })} —{" "}
                  {formatDisplayDate(addDays(weekStart, 6), { short: true })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono text-[0.65rem]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Completion
                  </span>
                  <span
                    className="font-mono text-[0.75rem] font-semibold"
                    style={{ color: "var(--forest-sage)" }}
                  >
                    {core.completionRate}%
                  </span>
                </div>
                <div
                  className="w-px h-3"
                  style={{ background: "var(--border-subtle)" }}
                />
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-mono text-[0.65rem]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Skip rate
                  </span>
                  <span
                    className="font-mono text-[0.75rem] font-semibold"
                    style={{
                      color:
                        core.skipRate > 10
                          ? "var(--color-error)"
                          : "var(--text-muted)",
                    }}
                  >
                    {core.skipRate}%
                  </span>
                </div>
              </div>
            </div>

            {core.weekBars.every((b) => b.kg === 0) ? (
              <div className="h-28 flex items-center justify-center">
                <p
                  className="font-mono text-[0.65rem] tracking-[0.08em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Belum ada data pengambilan minggu ini
                </p>
              </div>
            ) : (
              <WeekChart bars={core.weekBars} />
            )}

            <div className="flex items-center gap-4 mt-3">
              {[
                { color: "var(--coffee-latte)", label: "Hari ini" },
                { color: "var(--forest-sage)", label: "Selesai semua" },
                { color: "var(--teal)", label: "Ada stop pending" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background: l.color }}
                  />
                  <span
                    className="font-mono text-[0.58rem]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Baris bawah: Bulanan + Pesan ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Chart Bulanan */}
            <div
              className="rounded-lg px-5 py-4"
              style={{
                background: "var(--bg-card)",
                border: "0.5px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Historis Bulanan</SectionLabel>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-[0.68rem] rounded px-2 py-1 outline-none"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "0.5px solid var(--border-subtle)",
                    fontFamily: "var(--font-space-mono)",
                  }}
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* FASE 1.5 — chart bulanan punya loading/error sendiri, tidak
              lagi ikut menjatuhkan seluruh Overview kalau query ini gagal
              atau masih lambat (misal saat agregasi sebulan penuh belum
              dipindah ke DB — lihat Fase 3). */}
              {monthlyLoading && !monthly ? (
                <MonthChartSkeleton />
              ) : monthlyError && !monthly ? (
                <InlineError message={monthlyError} onRetry={loadMonthlyData} />
              ) : monthly ? (
                <>
                  {monthly.monthlyBars.length === 0 ||
                  monthly.monthlyBars.every((b) => b.kg === 0) ? (
                    <div className="h-20 flex items-center justify-center">
                      <p
                        className="font-mono text-[0.62rem] tracking-[0.06em]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Belum ada data untuk periode ini
                      </p>
                    </div>
                  ) : (
                    <MonthChart bars={monthly.monthlyBars} />
                  )}

                  <div
                    className="flex items-center justify-between mt-4 pt-3"
                    style={{ borderTop: "0.5px solid var(--border-subtle)" }}
                  >
                    <div>
                      <p
                        className="font-mono text-[0.6rem] uppercase tracking-[0.1em]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Total bulan ini
                      </p>
                      <p
                        className="font-display text-[1.3rem] font-semibold mt-0.5"
                        style={{ color: "var(--teal)" }}
                      >
                        {monthly.monthlyKgTotal} kg
                      </p>
                    </div>
                    {monthlyDeltaPct !== null && (
                      <div className="text-right">
                        <p
                          className="font-mono text-[0.6rem] uppercase tracking-[0.1em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          vs bulan lalu
                        </p>
                        <p
                          className="font-mono text-[0.82rem] font-semibold mt-0.5"
                          style={{
                            color:
                              monthlyDelta >= 0
                                ? "var(--forest-sage)"
                                : "var(--color-error)",
                          }}
                        >
                          {monthlyDelta >= 0 ? "+" : ""}
                          {monthlyDeltaPct}%
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Pesan Terbaru */}
            <div
              className="rounded-lg px-5 py-4 flex flex-col"
              style={{
                background: "var(--bg-card)",
                border: "0.5px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Pesan Terbaru</SectionLabel>
                {core.pesanUnread > 0 && (
                  <span
                    className="font-mono text-[0.58rem] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(160,72,72,0.12)",
                      color: "var(--color-error)",
                      border: "0.5px solid rgba(160,72,72,0.3)",
                    }}
                  >
                    {core.pesanUnread} unread
                  </span>
                )}
              </div>

              {core.pesanTerbaru.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p
                    className="font-mono text-[0.62rem] tracking-[0.06em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Belum ada pesan masuk
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 flex-1">
                  {core.pesanTerbaru.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-3 py-2"
                      style={{
                        borderBottom: "0.5px solid var(--border-subtle)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{
                          background:
                            p.status === "unread"
                              ? "var(--color-error)"
                              : "var(--border-default)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="text-[0.75rem] font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {p.sender_name}
                          </p>
                          <span
                            className="font-mono text-[0.58rem] flex-shrink-0"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {formatDisplayDate(p.submitted_at.split("T")[0], {
                              short: true,
                            })}
                          </span>
                        </div>
                        <p
                          className="text-[0.68rem] truncate mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {p.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => onNavigate("pesan")}
                className="mt-3 font-mono text-[0.62rem] tracking-[0.08em] uppercase transition-all"
                style={{ color: "var(--coffee-latte)", textAlign: "left" }}
              >
                Lihat semua pesan →
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Bio-Conversion & Integration Chart — belum tersedia ──────────────
          FASE 1.1: sebelumnya 2 blok full-width terpisah tepat setelah KPI
          row (menghalangi chart minggu ini). Sekarang 1 banner ringkas,
          diposisikan paling bawah — lihat komentar ComingSoonBanner di atas
          untuk query referensi saat tabel batches/production_runs siap. */}
      <ModuleNotReadyBanner
        icon="fa-seedling"
        title="Bio-Conversion & Integration Chart"
        subtitle="Tersedia setelah tabel batches · production_runs aktif"
        onNavigate={() => onNavigate("bio")}
      />
    </div>
  );
}
