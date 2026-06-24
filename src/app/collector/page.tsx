"use client";
// src/app/collector/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Perubahan dari versi sebelumnya:
//
//   REC 5 — Pisahkan Promise.all menjadi dua fetch independen
//     Sebelumnya: Promise.all([route, history]) → satu gagal = semua error
//     Sekarang: route dan history di-fetch terpisah, masing-masing punya
//     state error sendiri, agar kegagalan history tidak menghalangi akses rute.
//
//   REC 1 — Toast saat updateStopStatus gagal
//     Sebelumnya: rollback state saja (silent failure, user tidak tahu)
//     Sekarang: useToast().show() dipanggil dengan pesan error yang jelas.
//
//   REC 6 — Tab navigation untuk mobile
//     Sebelumnya: RouteSection + HistorySection selalu stacked di mobile
//     Sekarang: di bawah breakpoint lg, tampil sebagai dua tab terpisah.
//     Di lg ke atas, layout 2 kolom tetap seperti semula.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import { useToast } from "@/components/ui/Toast";
import CollectorNavbar from "@/components/collector/CollectorNavbar";
import RouteSection from "@/components/collector/RouteSection";
import HistorySection from "@/components/collector/HistorySection";
import {
  fetchMyTodayRoute,
  fetchCollectorHistory,
  updateStopStatus,
  uploadStopPhoto,
  type StopUpdatePayload,
} from "@/lib/supabase-collector";
import {
  toRouteStop,
  toWasteLog,
  toWeeklyBars,
} from "@/utils/collector-adapters";
import { todayWITA } from "@/utils/date";
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
// REC 6 — Mobile tab bar
// Hanya muncul di bawah breakpoint lg (< 1024px).
// Di atas lg, komponen ini tidak dirender (layout 2 kolom tetap aktif).
// ─────────────────────────────────────────────────────────────────────────────

type ActiveTab = "route" | "history";

function MobileTabBar({
  active,
  onChange,
  pendingCount,
  historyCount,
}: {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  pendingCount: number;
  historyCount: number;
}) {
  return (
    <div
      className="lg:hidden flex border-b mb-6"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {/* Tab: Rute */}
      <button
        onClick={() => onChange("route")}
        className="flex-1 flex items-center justify-center gap-2 py-3 text-[0.8rem] font-mono tracking-[0.06em] transition-colors duration-150 relative"
        style={{
          color:
            active === "route" ? "var(--coffee-latte)" : "var(--text-muted)",
        }}
      >
        <i className="fas fa-route text-[0.7rem]" />
        Rute Hari Ini
        {pendingCount > 0 && (
          <span
            className="text-[0.62rem] px-1.5 py-0.5 rounded-pill font-semibold"
            style={{
              background: "rgba(196,149,106,0.15)",
              color: "var(--coffee-latte)",
              border: "1px solid rgba(196,149,106,0.25)",
            }}
          >
            {pendingCount}
          </span>
        )}
        {/* Active indicator */}
        {active === "route" && (
          <span
            className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
            style={{ background: "var(--coffee-latte)" }}
          />
        )}
      </button>

      {/* Tab: Riwayat */}
      <button
        onClick={() => onChange("history")}
        className="flex-1 flex items-center justify-center gap-2 py-3 text-[0.8rem] font-mono tracking-[0.06em] transition-colors duration-150 relative"
        style={{
          color:
            active === "history" ? "var(--forest-sage)" : "var(--text-muted)",
        }}
      >
        <i className="fas fa-chart-bar text-[0.7rem]" />
        Riwayat
        {historyCount > 0 && (
          <span
            className="text-[0.62rem] px-1.5 py-0.5 rounded-pill font-semibold"
            style={{
              background: "rgba(122,171,126,0.1)",
              color: "var(--forest-sage)",
              border: "1px solid rgba(122,171,126,0.2)",
            }}
          >
            {historyCount}
          </span>
        )}
        {active === "history" && (
          <span
            className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
            style={{ background: "var(--forest-sage)" }}
          />
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CollectorPage() {
  const { session, openModal } = useAuthModal();
  // REC 1 — toast untuk feedback error saat save gagal
  const { show: showToast } = useToast();

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [historyLogs, setHistoryLogs] = useState<WasteLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyBar[]>([]);
  const [routeId, setRouteId] = useState<string | null>(null);

  // REC 5 — state loading dan error terpisah per sumber data
  const [routeLoading, setRouteLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // REC 6 — state tab aktif untuk mobile
  const [activeTab, setActiveTab] = useState<ActiveTab>("route");

  // ── REC 5: Fetch rute — independen dari history ───────────────────────────
  const loadRoute = useCallback(async () => {
    if (!session?.email) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const today = todayWITA();
      const routeResult = await fetchMyTodayRoute(session.email);
      const stops = (routeResult.route?.stops ?? []).map(toRouteStop);
      setRouteId(routeResult.route?.id ?? null);
      setRouteStops(stops);
    } catch (err: any) {
      const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
      console.error("CollectorPage: gagal memuat rute:", msg);
      setRouteError(
        `Gagal memuat rute: ${msg || "Periksa koneksi dan coba refresh."}`,
      );
    } finally {
      setRouteLoading(false);
    }
  }, [session?.email]);

  // ── REC 5: Fetch history — independen dari rute ───────────────────────────
  const loadHistory = useCallback(async () => {
    if (!session?.email) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const today = todayWITA();
      const historyRaw = await fetchCollectorHistory(session.email);
      const logs = historyRaw.map(toWasteLog);
      const routesByDay = groupHistoryByDay(historyRaw, today);
      const bars = toWeeklyBars(routesByDay, today);
      setHistoryLogs(logs);
      setWeeklyData(bars.length > 0 ? bars : DEFAULT_WEEKLY_BARS);
    } catch (err: any) {
      const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
      console.error("CollectorPage: gagal memuat history:", msg);
      setHistoryError("Gagal memuat riwayat. Data rute tetap tersedia.");
    } finally {
      setHistoryLoading(false);
    }
  }, [session?.email]);

  // Jalankan keduanya saat mount — tidak saling tunggu
  useEffect(() => {
    loadRoute();
    loadHistory();
  }, [loadRoute, loadHistory]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── DB commit handler — dipanggil RouteSection setelah undo window 10d habis ──
  // Fix #9: menerima tepat SATU RouteStop yang baru di-commit (bukan seluruh array).
  // Ini menghindari ambiguitas saat beberapa stop sudah done sebelumnya.
  const handleCommitStop = useCallback(
    async (committed: RouteStop) => {
      // Sync stop ini ke state page agar navbar stats tetap akurat
      setRouteStops((prev) =>
        prev.map((s) => (s.id === committed.id ? committed : s)),
      );

      // Upload foto ke Supabase Storage jika ada.
      // Dilakukan SEBELUM updateStopStatus agar photo_url tersedia di payload.
      let photoUrl: string | undefined;
      if (committed.status === "done" && committed.photo_file) {
        try {
          photoUrl = await uploadStopPhoto(committed.photo_file, committed.id);
        } catch (uploadErr) {
          // Upload gagal tidak memblock submit — stop tetap tersimpan tanpa foto
          console.warn("[handleCommitStop] upload foto gagal:", uploadErr);
        }
      }

      const payload: StopUpdatePayload = {
        status: committed.status as "done" | "skipped",
        actual_kg: committed.actual_kg,
        condition: committed.condition as StopUpdatePayload["condition"],
        skip_reason: committed.skip_reason,
        location_coords: committed.location_coords,
        location_accuracy: committed.location_accuracy,
        notes: committed.notes,
        photo_url: photoUrl,
      };

      try {
        await updateStopStatus(committed.id, payload);
      } catch (err: any) {
        console.error("Gagal menyimpan status stop:", err);
        // REC 1 — toast error; undo window sudah expired, tidak bisa rollback UI
        showToast("Gagal menyimpan ke server. Coba refresh halaman.", "error");
      }
    },
    [showToast],
  );

  // ── Auth guards ───────────────────────────────────────────────────────────
  if (!session) return <NotLoggedIn onLogin={openModal} />;
  if (session.role !== "collector") return <AccessDenied />;

  // Hanya blok loading jika rute belum selesai dimuat
  // History boleh masih loading — HistorySection tangani sendiri
  if (routeLoading) return <LoadingState />;

  // ── Stats untuk navbar ────────────────────────────────────────────────────
  const collectedKg = routeStops
    .filter((s) => s.status === "done")
    .reduce((acc, s) => acc + (s.actual_kg ?? 0), 0);
  const stopsCompleted = routeStops.filter(
    (s) => s.status !== "pending",
  ).length;
  const pendingCount = routeStops.filter((s) => s.status === "pending").length;

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
        pendingStopsCount={pendingCount}
      />

      {/* Offline indicator banner */}
      {!isOnline && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2"
          style={{
            background: "rgba(196,136,47,0.12)",
            borderBottom: "1px solid rgba(196,136,47,0.3)",
          }}
        >
          <i
            className="fas fa-wifi text-[0.7rem]"
            style={{ color: "var(--coffee-latte)" }}
          />
          <p
            className="font-mono text-[0.68rem] tracking-[0.06em]"
            style={{ color: "var(--coffee-latte)" }}
          >
            Tidak ada koneksi — data tidak akan tersimpan sampai online kembali
          </p>
        </div>
      )}

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-12 py-8">
        {/* Error banner — rute */}
        {routeError && (
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
              {routeError}
            </p>
            <button
              onClick={loadRoute}
              className="text-sm underline"
              style={{ color: "var(--color-error)" }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* REC 5 — error banner history terpisah, tidak memblok rute */}
        {historyError && (
          <div
            className="mb-6 px-4 py-3 rounded-lg flex items-center gap-3"
            style={{
              background: "rgba(196,136,47,0.08)",
              border: "1px solid rgba(196,136,47,0.2)",
            }}
          >
            <i
              className="fas fa-exclamation-circle text-sm"
              style={{ color: "var(--coffee-latte)" }}
            />
            <p
              className="text-sm flex-1"
              style={{ color: "var(--coffee-latte)" }}
            >
              {historyError}
            </p>
            <button
              onClick={loadHistory}
              className="text-sm underline"
              style={{ color: "var(--coffee-latte)" }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Empty state jika tidak ada rute hari ini */}
        {!routeLoading && routeStops.length === 0 && !routeError && (
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
        <div className="mb-6">
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
              timeZone: "Asia/Makassar",
            })}{" "}
            · Rute ditetapkan admin ·{" "}
            <span style={{ color: "var(--forest-sage)" }}>
              {routeStops.length} stop hari ini
            </span>
          </p>
        </div>

        {/* REC 6 — Tab bar, hanya tampil di mobile (< lg) */}
        <MobileTabBar
          active={activeTab}
          onChange={setActiveTab}
          pendingCount={pendingCount}
          historyCount={historyLogs.length}
        />

        {/*
          Layout:
          - Mobile: satu panel aktif sesuai tab
          - Desktop (lg+): 2 kolom side-by-side, tab bar hidden
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Panel Rute — di mobile hanya tampil saat tab "route" aktif */}
          <div className={activeTab === "route" ? "block" : "hidden lg:block"}>
            <RouteSection
              collectorName={session.name}
              routeDate={todayWITA()}
              initialStops={routeStops}
              onCommitStop={handleCommitStop}
            />
          </div>

          {/* Panel History — di mobile hanya tampil saat tab "history" aktif */}
          <div
            className={`lg:sticky lg:top-[72px] ${activeTab === "history" ? "block" : "hidden lg:block"}`}
          >
            <HistorySection
              weeklyData={weeklyData}
              historyLogs={historyLogs}
              isLoading={historyLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function groupHistoryByDay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  history: any[],
  today: string,
): any[] {
  const byDay: Record<string, { route_date: string; total_actual_kg: number }> =
    {};

  history.forEach((h: any) => {
    const d = h.route_date ?? today;
    if (!byDay[d]) byDay[d] = { route_date: d, total_actual_kg: 0 };
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
