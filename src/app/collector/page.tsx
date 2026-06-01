"use client";
// src/app/collector/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Halaman khusus collector — route: /collector
// Semua operasi tanggal menggunakan @/utils/dateUtils (WITA-aware)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import CollectorNavbar from "@/components/collector/CollectorNavbar";
import RouteSection from "@/components/collector/RouteSection";
import HistorySection from "@/components/collector/HistorySection";
import Footer from "@/components/layout/Footer";
import {
  fetchMyTodayRoute,
  fetchCollectorHistory,
  updateStopStatus,
  type StopUpdatePayload,
  type StopWithPartner,
} from "@/lib/supabase-collector";
import {
  toRouteStop,
  toWasteLog,
  toWeeklyBars,
} from "@/utils/collector-adapters";
import { todayWITA } from "@/utils/dateUtils";
import type { RouteStop, WasteLog, WeeklyBar } from "@/types/collector";

// ─────────────────────────────────────────────────────────────────────────────
// Auth guard screens
// ─────────────────────────────────────────────────────────────────────────────

function NotLoggedIn({ onLogin }: { onLogin: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          color: "var(--text-muted)",
        }}
      >
        <i className="fas fa-lock" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-[1.6rem] text-text-primary">
          Akses Terbatas
        </h1>
        <p className="text-[0.88rem] text-text-muted mt-2 max-w-[280px]">
          Halaman ini hanya untuk tim collector Rebru. Silakan login terlebih
          dahulu.
        </p>
      </div>
      <button onClick={onLogin} className="btn btn-primary btn-md">
        <i className="fas fa-sign-in-alt" /> Login
      </button>
    </div>
  );
}

function AccessDenied() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
        style={{
          background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)",
          color: "#f87171",
        }}
      >
        <i className="fas fa-ban" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-[1.6rem] text-text-primary">
          Akses Ditolak
        </h1>
        <p className="text-[0.88rem] text-text-muted mt-2 max-w-[280px]">
          Akun kamu tidak memiliki akses ke halaman collector. Hubungi admin
          Rebru jika ini keliru.
        </p>
      </div>
      <a href="/" className="btn btn-ghost btn-md">
        <i className="fas fa-arrow-left" /> Kembali ke beranda
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="flex items-center gap-3"
        style={{ color: "var(--text-muted)" }}
      >
        <i className="fas fa-circle-notch fa-spin text-sm" />
        <span
          className="text-sm tracking-widest uppercase"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          Memuat rute...
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CollectorPage() {
  const { session, openModal } = useAuthModal();

  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [historyLogs, setHistoryLogs] = useState<WasteLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);

  // ── Fetch data live dari Supabase ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!session?.email) return;
    setLoading(true);
    setError(null);

    try {
      // todayWITA() mengembalikan tanggal hari ini dalam WITA (bukan UTC)
      // Menggantikan: new Date().toISOString().split("T")[0]
      const today = todayWITA();

      const [routeResult, historyRaw] = await Promise.all([
        fetchMyTodayRoute(session.email),
        fetchCollectorHistory(session.email),
      ]);

      const stops = (routeResult.route?.stops ?? []).map(toRouteStop);
      const logs = historyRaw.map(toWasteLog);

      // WeeklyBar: kelompokkan per hari dari history
      const routesByDay = groupHistoryByDay(historyRaw, today);
      const bars = toWeeklyBars(routesByDay, today);

      setRouteId(routeResult.route?.id ?? null);
      setRouteStops(stops);
      setHistoryLogs(logs);
      setWeeklyData(bars.length > 0 ? bars : DEFAULT_WEEKLY_BARS);
    } catch (err) {
      console.error("CollectorPage: gagal memuat data:", err);
      setError("Gagal memuat rute. Periksa koneksi dan coba refresh.");
    } finally {
      setLoading(false);
    }
  }, [session?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handler saat collector update stop ───────────────────────────────────
  const handleStopsChange = useCallback(
    async (updatedStops: RouteStop[]) => {
      setRouteStops(updatedStops);

      const justCompleted = updatedStops.find(
        (s, i) => s.status !== "pending" && routeStops[i]?.status === "pending",
      );

      if (!justCompleted) return;

      const payload: StopUpdatePayload = {
        status: justCompleted.status as "done" | "skipped",
        actual_kg: justCompleted.actual_kg,
        condition: justCompleted.condition as StopUpdatePayload["condition"],
        skip_reason: justCompleted.skip_reason,
        location_coords: justCompleted.location_coords,
        notes: justCompleted.notes,
      };

      try {
        await updateStopStatus(justCompleted.id, payload);
      } catch (err) {
        console.error("Gagal menyimpan status stop:", err);
        setRouteStops(routeStops);
      }
    },
    [routeStops],
  );

  // ── Auth guards ────────────────────────────────────────────────────────────
  if (!session) return <NotLoggedIn onLogin={openModal} />;
  if (session.role !== "collector") return <AccessDenied />;
  if (loading) return <LoadingState />;

  // ── Stats untuk navbar ─────────────────────────────────────────────────────
  const collectedKg = routeStops
    .filter((s) => s.status === "done")
    .reduce((acc, s) => acc + (s.actual_kg ?? 0), 0);

  const stopsCompleted = routeStops.filter(
    (s) => s.status !== "pending",
  ).length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      <CollectorNavbar
        collectorName={session.name}
        collectedKg={collectedKg}
        stopsCompleted={stopsCompleted}
        totalStops={routeStops.length}
      />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-12 py-8">
        {/* Error banner */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg flex items-center gap-3"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            <i
              className="fas fa-exclamation-triangle text-sm"
              style={{ color: "var(--color-error)" }}
            />
            <p
              className="text-sm flex-1"
              style={{ color: "var(--color-error)" }}
            >
              {error}
            </p>
            <button
              onClick={loadData}
              className="text-sm underline"
              style={{ color: "var(--color-error)" }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Empty state jika tidak ada rute hari ini */}
        {!loading && routeStops.length === 0 && !error && (
          <div
            className="mb-8 px-6 py-8 rounded-lg text-center"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <i
              className="fas fa-route text-2xl mb-3 block"
              style={{ color: "var(--text-muted)" }}
            />
            <p className="font-medium text-text-primary mb-1">
              Belum ada jadwal untuk hari ini
            </p>
            <p className="text-sm text-text-muted">
              Hubungi admin jika kamu seharusnya memiliki rute hari ini.
            </p>
          </div>
        )}

        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-fluid-title text-text-primary font-semibold">
            Log <em className="text-coffee-latte not-italic">pengambilan</em>{" "}
            ampas kopi
          </h1>
          <p className="text-[0.82rem] text-text-muted mt-2">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Makassar", // ← eksplisit WITA untuk display saja
            })}{" "}
            · Rute ditetapkan admin ·{" "}
            <span style={{ color: "var(--forest-sage)" }}>
              {routeStops.length} stop hari ini
            </span>
          </p>
        </div>

        {/* 2-kolom desktop, stacked mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          <RouteSection
            collectorName={session.name}
            routeDate={todayWITA()}
            initialStops={routeStops}
            onStopsChange={handleStopsChange}
          />

          <div className="lg:sticky lg:top-[72px]">
            <HistorySection weeklyData={weeklyData} historyLogs={historyLogs} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

// Kelompokkan history stops per hari → untuk WeeklyBar
// Input: raw StopWithPartner dari fetchCollectorHistory (bukan WasteLog)
// Output: { route_date, total_actual_kg }[] — compatible dengan toWeeklyBars
function groupHistoryByDay(
  history: (StopWithPartner & { route_date: string })[],
  today: string,
): { route_date: string; total_actual_kg: number }[] {
  const byDay: Record<string, { route_date: string; total_actual_kg: number }> =
    {};

  history.forEach((h) => {
    const d = h.route_date ?? today;
    if (!byDay[d]) byDay[d] = { route_date: d, total_actual_kg: 0 };
    // Gunakan actual_kg (field di StopWithPartner), bukan kg (field di WasteLog)
    byDay[d].total_actual_kg += h.actual_kg ?? 0;
  });

  return Object.values(byDay)
    .sort((a, b) => a.route_date.localeCompare(b.route_date))
    .slice(-7);
}

const DEFAULT_WEEKLY_BARS: WeeklyBar[] = [
  { day: "Sen", kg: 0, isToday: false },
  { day: "Sel", kg: 0, isToday: false },
  { day: "Rab", kg: 0, isToday: false },
  { day: "Kam", kg: 0, isToday: false },
  { day: "Jum", kg: 0, isToday: false },
  { day: "Sab", kg: 0, isToday: false },
  { day: "Hari", kg: 0, isToday: true },
];
