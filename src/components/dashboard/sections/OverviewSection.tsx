"use client";
// src/components/dashboard/sections/OverviewSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Overview — halaman landing pertama saat admin login.
//
// Data yang di-fetch:
//   fetchTodayRoutes()         → KPI operasional + alertCount
//   fetchWeekRoutes()          → chart bar minggu ini + completionRate + skipRate
//   fetchPartnerApplications() → KPI mitra (aktif, pending, expiring)
//   fetchMonthlyStats()        → chart bulanan pickup kg per minggu
//   contact_messages           → KPI pesan unread + pesan terbaru
//
// Data yang BELUM tersedia (empty state ditampilkan):
//   batches / production_runs  → Bio-Conversion efficiency + Integration chart
//   Aktifkan dengan uncomment blok "TODO: Supabase" saat tabel tersedia.
//
// Tidak ada aksi di halaman ini — semua interaksi berupa navigasi ke section.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchTodayRoutes, fetchWeekRoutes } from "@/lib/supabase-collector";
import { fetchPartnerApplications } from "@/lib/supabase-partner";
import {
  fetchContactMessages,
  countUnreadMessages,
  type ContactMessage,
} from "@/lib/supabase-messages";
import {
  todayWITA,
  getMondayWITA,
  formatDisplayDate,
  addDays,
} from "@/utils/date";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OverviewData {
  // Operasional
  stopsDone: number;
  stopsTotal: number;
  kgToday: number;
  alertCount: number;
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
  // Chart bulanan
  monthlyBars: MonthBar[];
  monthlyKgTotal: number;
  monthlyKgPrev: number;
  // Bio-Conversion — null = tabel belum tersedia
  bioEfficiency: number | null;
  bioTotalBatch: number | null;
  // Integration Chart — null = tabel belum tersedia
  integrationStages: IntegrationStage[] | null;
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
}: {
  icon: string;
  label: string;
  primary: string;
  secondaryLines: string[];
  accent: string;
  onClick?: () => void;
  alert?: boolean;
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

      <p
        className="font-display text-[1.9rem] font-semibold leading-none"
        style={{ color: alert ? "var(--color-error)" : accent }}
      >
        {primary}
      </p>

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
function BioEmptyCard({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div
      className="rounded-lg px-5 py-4 flex flex-col gap-3"
      style={{
        background: "var(--bg-card)",
        border: "0.5px solid var(--border-subtle)",
        opacity: 0.7,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="font-mono text-[0.6rem] tracking-[0.12em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Bio-Conversion
        </span>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{
            background: "rgba(45,90,46,0.08)",
            color: "var(--forest-sage)",
          }}
        >
          <i className="fas fa-seedling text-[0.6rem]" />
        </div>
      </div>
      <p
        className="font-display text-[1.9rem] font-semibold leading-none"
        style={{ color: "var(--text-muted)" }}
      >
        —
      </p>
      <div className="flex flex-col gap-0.5">
        <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
          Data batch belum tersedia
        </p>
        <p
          className="text-[0.65rem]"
          style={{ color: "var(--text-muted)", opacity: 0.7 }}
        >
          Tersedia setelah tabel batches aktif
        </p>
      </div>
      {/* TODO: Supabase — aktifkan saat tabel batches tersedia:
          Ganti komponen ini dengan KpiCard biasa yang menampilkan:
          primary={`${data.bioEfficiency}%`}
          secondaryLines={[
            `${data.bioTotalBatch} batch diproses`,
            "Efisiensi konversi kering",
          ]}
          Sumber query:
            SELECT
              ROUND(AVG(output_dry_kg / NULLIF(input_wet_kg, 0) * 100), 1) AS efficiency,
              COUNT(*) AS total_batch
            FROM batches
            WHERE status = 'done'
              AND created_at >= now() - interval '30 days'
      */}
    </div>
  );
}

// ── Empty state Integration Chart ─────────────────────────────────────────────
// Ditampilkan sampai data batches + production_runs tersedia.
// Pickup bars (biru) bisa ditampilkan sekarang karena data stops sudah ada —
// tapi menampilkan chart setengah jadi lebih membingungkan daripada empty state.
// Keputusan: tampilkan seluruh chart setelah semua data tersedia sekaligus.
function IntegrationChartEmpty() {
  return (
    <div
      className="rounded-lg px-5 py-4"
      style={{
        background: "var(--bg-card)",
        border: "0.5px solid var(--border-subtle)",
      }}
    >
      <SectionLabel>Alur Integrasi & Performa End-to-End</SectionLabel>
      <div
        className="rounded-md flex flex-col items-center justify-center gap-3 py-10"
        style={{
          background: "var(--bg-elevated)",
          border: "0.5px dashed var(--border-subtle)",
        }}
      >
        <i
          className="fas fa-chart-bar text-2xl"
          style={{ color: "var(--border-strong)" }}
        />
        <div className="text-center">
          <p
            className="font-mono text-[0.68rem] tracking-[0.08em]"
            style={{ color: "var(--text-muted)" }}
          >
            Chart tersedia setelah modul Bio-Conversion aktif
          </p>
          <p
            className="font-mono text-[0.6rem] mt-1"
            style={{ color: "var(--text-muted)", opacity: 0.6 }}
          >
            Membutuhkan: tabel batches · production_runs
          </p>
        </div>
      </div>
      {/* TODO: Supabase — aktifkan saat tabel tersedia.
          Query untuk setiap stage (per minggu / per bulan):

          Stage "Pickup" (sudah tersedia):
            SELECT route_date, SUM(actual_kg) as kg,
              COUNT(*) FILTER (WHERE status = 'done') as done,
              COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
              COUNT(*) as total
            FROM collection_stops
            WHERE route_date >= [start] AND route_date <= [end]
            GROUP BY route_date ORDER BY route_date

          Stage "Bio Conversion" (butuh tabel batches):
            SELECT DATE_TRUNC('week', created_at) as week,
              SUM(output_dry_kg) as dry_kg,
              SUM(input_wet_kg) as wet_kg
            FROM batches
            WHERE status = 'done'
            GROUP BY week ORDER BY week

          Stage "Produksi" (butuh tabel production_runs):
            SELECT DATE_TRUNC('week', created_at) as week,
              SUM(output_kg) as output_kg,
              product_type
            FROM production_runs
            GROUP BY week, product_type ORDER BY week

          Gabungkan per periode ke dalam IntegrationStage[] lalu pass ke
          komponen IntegrationChart (buat komponen baru atau import dari file terpisah).
      */}
    </div>
  );
}

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
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  const today = todayWITA();
  const weekStart = getMondayWITA(today);

  // ── Fetch monthly stats ────────────────────────────────────────────────────
  // Query: collection_routes JOIN collection_stops, group per minggu dalam bulan
  const fetchMonthlyStats = useCallback(
    async (
      monthValue: string,
    ): Promise<{ bars: MonthBar[]; total: number }> => {
      const supabase = createClient();
      const [year, month] = monthValue.split("-").map(Number);
      const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0);
      const lastDayStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

      const { data: routes } = await supabase
        .from("collection_routes")
        .select("route_date, collection_stops (actual_kg, status)")
        .gte("route_date", firstDay)
        .lte("route_date", lastDayStr);

      if (!routes) return { bars: [], total: 0 };

      const weeks: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;

      (routes ?? []).forEach((r: any) => {
        const dayOfMonth = new Date(r.route_date + "T00:00:00Z").getUTCDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        const kg = (r.collection_stops ?? []).reduce(
          (acc: number, s: any) =>
            s.status === "done" ? acc + (s.actual_kg ?? 0) : acc,
          0,
        );
        weeks[weekNum] = (weeks[weekNum] ?? 0) + kg;
        total += kg;
      });

      const bars: MonthBar[] = Object.entries(weeks)
        .filter(([wk]) => (Number(wk) - 1) * 7 + 1 <= lastDay.getDate())
        .map(([wk, kg]) => ({
          label: `Mg ${wk}`,
          kg: Number(kg.toFixed(1)),
        }));

      return { bars, total: Number(total.toFixed(1)) };
    },
    [],
  );

  // ── Fetch semua data ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const [todayRoutes, weekRoutes, partners, monthStats] = await Promise.all(
        [
          fetchTodayRoutes(),
          fetchWeekRoutes(weekStart),
          fetchPartnerApplications(),
          fetchMonthlyStats(selectedMonth),
        ],
      );

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
      // alertCount: collector dengan stops overdue dan tidak ada check-in > 75 menit
      // Logika identik dengan OperationalSection.tsx baris 4130–4135
      const alertCount = todayRoutes.filter((r: any) => {
        const overdueStops = (r.stops ?? []).filter(
          (s: any) =>
            s.status === "pending" &&
            s.scheduled_time &&
            s.scheduled_time < new Date().toTimeString().slice(0, 5),
        );
        const lastDone = [...(r.stops ?? [])]
          .filter((s: any) => s.status !== "pending")
          .sort((a: any, b: any) =>
            (b.completed_at ?? "").localeCompare(a.completed_at ?? ""),
          )[0];
        const minsAgo = lastDone?.completed_at
          ? Math.floor(
              (Date.now() - new Date(lastDone.completed_at).getTime()) / 60_000,
            )
          : r.stops_done === 0
            ? 999
            : 0;
        return overdueStops.length > 0 && minsAgo > 75;
      }).length;

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

      // ── Perbandingan bulan lalu ───────────────────────────────────────────
      const [selYear, selMonth] = selectedMonth.split("-").map(Number);
      const prevMonth =
        selMonth === 1
          ? `${selYear - 1}-12`
          : `${selYear}-${String(selMonth - 1).padStart(2, "0")}`;
      const { total: monthlyKgPrev } = await fetchMonthlyStats(prevMonth);

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
      // Lihat komentar di IntegrationChartEmpty() untuk query lengkap.

      setData({
        stopsDone,
        stopsTotal,
        kgToday: Number(kgToday.toFixed(1)),
        alertCount,
        mitraAktif,
        mitraPending,
        mitraExpiring,
        pesanUnread: pesanUnread,
        pesanTerbaru: pesanTerbaru,
        weekBars,
        completionRate,
        skipRate,
        monthlyBars: monthStats.bars,
        monthlyKgTotal: monthStats.total,
        monthlyKgPrev,
        // Null sampai tabel tersedia — UI menampilkan empty state
        bioEfficiency: null,
        bioTotalBatch: null,
        integrationStages: null,
      });
    } catch (err: any) {
      setError(err?.message ?? "Gagal memuat data overview");
    } finally {
      setLoading(false);
    }
  }, [weekStart, today, selectedMonth, fetchMonthlyStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : "Selamat sore";
  const firstName = adminName.split(" ")[0];

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <OverviewSkeleton />;

  if (error) {
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
          onClick={loadData}
          className="text-xs underline"
          style={{ color: "var(--color-error)" }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!data) return null;

  const monthlyDelta = data.monthlyKgTotal - data.monthlyKgPrev;
  const monthlyDeltaPct =
    data.monthlyKgPrev > 0
      ? Math.round((monthlyDelta / data.monthlyKgPrev) * 100)
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

      {/* ── KPI Cards — 4 kolom (Bio-Conversion menyusul saat tabel tersedia) ── */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          icon="fa-route"
          label="Operasional Hari Ini"
          primary={`${data.stopsDone}/${data.stopsTotal}`}
          secondaryLines={[
            `${data.kgToday} kg terkumpul`,
            `${data.stopsTotal - data.stopsDone} stop tersisa`,
          ]}
          accent="var(--teal)"
          onClick={() => onNavigate("operasional")}
        />

        <KpiCard
          icon="fa-handshake"
          label="Mitra"
          primary={String(data.mitraAktif)}
          secondaryLines={[
            `${data.mitraPending} pending approval`,
            data.mitraExpiring > 0
              ? `${data.mitraExpiring} expiring ≤7 hari`
              : "Tidak ada yang expiring",
          ]}
          accent="var(--coffee-latte)"
          onClick={() => onNavigate("partner")}
        />

        <KpiCard
          icon="fa-envelope"
          label="Pesan Masuk"
          primary={String(data.pesanUnread)}
          secondaryLines={[
            data.pesanUnread > 0
              ? `${data.pesanUnread} belum dibaca`
              : "Semua pesan sudah dibaca",
          ]}
          accent={
            data.pesanUnread > 0 ? "var(--color-error)" : "var(--text-muted)"
          }
          alert={data.pesanUnread > 0}
          onClick={() => onNavigate("pesan")}
        />

        {/* Alert Operasional */}
        <KpiCard
          icon="fa-exclamation-triangle"
          label="Perlu Perhatian"
          primary={data.alertCount === 0 ? "Aman" : String(data.alertCount)}
          secondaryLines={[
            data.alertCount === 0
              ? "Semua collector on track"
              : `${data.alertCount} collector perlu dicek`,
          ]}
          accent={
            data.alertCount > 0 ? "var(--color-error)" : "var(--forest-sage)"
          }
          alert={data.alertCount > 0}
          onClick={() => onNavigate("operasional")}
        />

        {/* TODO: Supabase — saat bioEfficiency !== null, tambah kolom ke-5 dan
            ubah grid menjadi grid-cols-5, lalu ganti BioEmptyCard dengan:
            <KpiCard
              icon="fa-seedling"
              label="Bio-Conversion"
              primary={`${data.bioEfficiency}%`}
              secondaryLines={[`${data.bioTotalBatch} batch selesai`, "Efisiensi konversi"]}
              accent="var(--forest-sage)"
              onClick={() => onNavigate("bio")}
            />
        */}
      </div>

      {/* ── Bio-Conversion empty state ── */}
      {/* Hapus blok ini saat bioEfficiency sudah tersedia */}
      <div className="grid grid-cols-1">
        <BioEmptyCard onNavigate={() => onNavigate("bio")} />
      </div>

      {/* ── Integration Chart — empty state ── */}
      {/* Ganti IntegrationChartEmpty dengan komponen chart asli saat data.integrationStages !== null */}
      {data.integrationStages === null && <IntegrationChartEmpty />}

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
                {data.completionRate}%
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
                    data.skipRate > 10
                      ? "var(--color-error)"
                      : "var(--text-muted)",
                }}
              >
                {data.skipRate}%
              </span>
            </div>
          </div>
        </div>

        {data.weekBars.every((b) => b.kg === 0) ? (
          <div className="h-28 flex items-center justify-center">
            <p
              className="font-mono text-[0.65rem] tracking-[0.08em]"
              style={{ color: "var(--text-muted)" }}
            >
              Belum ada data pengambilan minggu ini
            </p>
          </div>
        ) : (
          <WeekChart bars={data.weekBars} />
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

          {data.monthlyBars.length === 0 ||
          data.monthlyBars.every((b) => b.kg === 0) ? (
            <div className="h-20 flex items-center justify-center">
              <p
                className="font-mono text-[0.62rem] tracking-[0.06em]"
                style={{ color: "var(--text-muted)" }}
              >
                Belum ada data untuk periode ini
              </p>
            </div>
          ) : (
            <MonthChart bars={data.monthlyBars} />
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
                {data.monthlyKgTotal} kg
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
            {data.pesanUnread > 0 && (
              <span
                className="font-mono text-[0.58rem] px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(160,72,72,0.12)",
                  color: "var(--color-error)",
                  border: "0.5px solid rgba(160,72,72,0.3)",
                }}
              >
                {data.pesanUnread} unread
              </span>
            )}
          </div>

          {data.pesanTerbaru.length === 0 ? (
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
              {data.pesanTerbaru.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 py-2"
                  style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
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
    </div>
  );
}
