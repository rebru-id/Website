"use client";
// src/app/collector/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Halaman khusus collector — route: /collector
//
// Auth flow:
//   1. session null → tampil NotLoggedIn + tombol buka AuthModal
//   2. session.role !== "collector" → tampil AccessDenied
//   3. session.role === "collector" → render dashboard collector penuh
//
// Layout responsif:
//   Mobile  → single column (RouteSection atas, HistorySection bawah)
//   Desktop (lg+) → 2-kolom: RouteSection (flex-1), HistorySection (sidebar sticky)
//
// Metadata:
//   Dihandle oleh src/app/collector/layout.tsx (Server Component)
//   Tidak perlu dan tidak boleh export metadata di sini ("use client")
//
// Data:
//   MOCK_* di bawah untuk development — ganti dengan Supabase fetch:
//     GET /api/collector/route?date=today&collectorId=...
//     GET /api/collector/history?collectorId=...
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import CollectorNavbar from "@/components/collector/CollectorNavbar";
import RouteSection from "@/components/collector/RouteSection";
import HistorySection from "@/components/collector/HistorySection";
import Footer from "@/components/layout/Footer";
import type { RouteStop, WasteLog, WeeklyBar } from "@/types/collector";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — replace with Supabase fetch (Sprint 4)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_STOPS: RouteStop[] = [
  {
    id: "stop-1",
    order: 1,
    mitra_name: "Kopi Kenangan Panakkukang",
    mitra_category: "cafe",
    address: "Jl. Boulevard No.5, Panakkukang",
    scheduled_time: "06:30",
    estimated_kg: 12,
    status: "done",
    actual_kg: 12.5,
    condition: "basah",
    completed_at: "06:48",
    location_coords: "-5.1477, 119.4328",
    location_accuracy: 8,
  },
  {
    id: "stop-2",
    order: 2,
    mitra_name: "Hotel Aryaduta Makassar",
    mitra_category: "hotel",
    address: "Jl. Somba Opu No.297, Makassar",
    scheduled_time: "07:15",
    estimated_kg: 8,
    status: "done",
    actual_kg: 8.0,
    condition: "kering",
    completed_at: "07:32",
    location_coords: "-5.1392, 119.4173",
    location_accuracy: 12,
  },
  {
    id: "stop-3",
    order: 3,
    mitra_name: "Warung Makan Sari Laut",
    mitra_category: "resto",
    address: "Jl. Rappocini Raya No.44",
    scheduled_time: "07:45",
    estimated_kg: 6,
    status: "skipped",
    skip_reason: "Mitra tutup",
  },
  {
    id: "stop-4",
    order: 4,
    mitra_name: "Café Phoenam",
    mitra_category: "cafe",
    address: "Jl. Ahmad Yani No.10, Makassar",
    scheduled_time: "08:30",
    estimated_kg: 14,
    status: "pending",
  },
  {
    id: "stop-5",
    order: 5,
    mitra_name: "Makassar Ramen House",
    mitra_category: "resto",
    address: "Jl. Pengayoman No.18, Panakkukang",
    scheduled_time: "10:00",
    estimated_kg: 7,
    status: "pending",
  },
  {
    id: "stop-6",
    order: 6,
    mitra_name: "Anomali Coffee Trans Studio",
    mitra_category: "cafe",
    address: "Trans Studio Mall Makassar, Lantai G",
    scheduled_time: "11:30",
    estimated_kg: 18,
    status: "pending",
  },
  {
    id: "stop-7",
    order: 7,
    mitra_name: "JW Marriott Makassar",
    mitra_category: "hotel",
    address: "Jl. Jend. Sudirman No.52, Makassar",
    scheduled_time: "13:00",
    estimated_kg: 22,
    status: "pending",
  },
];

const MOCK_WEEKLY: WeeklyBar[] = [
  { day: "Sen", kg: 22, isToday: false },
  { day: "Sel", kg: 31, isToday: false },
  { day: "Rab", kg: 28, isToday: false },
  { day: "Kam", kg: 19, isToday: false },
  { day: "Jum", kg: 38, isToday: false },
  { day: "Sab", kg: 41, isToday: false },
  { day: "Hari", kg: 34.5, isToday: true },
];

const MOCK_HISTORY: WasteLog[] = [
  {
    id: "log-1",
    mitra_name: "Kopi Kenangan Panakkukang",
    mitra_category: "cafe",
    date: "28 Apr",
    time: "06:48",
    kg: 12.5,
    condition: "basah",
    status: "verified",
    has_photo: true,
    location_coords: "-5.1477, 119.4328",
  },
  {
    id: "log-2",
    mitra_name: "Hotel Aryaduta Makassar",
    mitra_category: "hotel",
    date: "28 Apr",
    time: "07:32",
    kg: 8.0,
    condition: "kering",
    status: "pending",
    has_photo: false,
  },
  {
    id: "log-3",
    mitra_name: "Warung Makan Sari Laut",
    mitra_category: "resto",
    date: "28 Apr",
    time: "07:45",
    kg: 0,
    condition: null,
    status: "skipped",
    has_photo: false,
    skip_reason: "Mitra tutup",
  },
  {
    id: "log-4",
    mitra_name: "Anomali Coffee Trans Studio",
    mitra_category: "cafe",
    date: "27 Apr",
    time: "11:30",
    kg: 18.5,
    condition: "mix",
    status: "verified",
    has_photo: true,
    notes: "Ampas espresso bar + filter, sudah dipisah dalam 2 sak",
    location_coords: "-5.1512, 119.4411",
  },
  {
    id: "log-5",
    mitra_name: "JW Marriott Makassar",
    mitra_category: "hotel",
    date: "27 Apr",
    time: "13:15",
    kg: 22.0,
    condition: "kering",
    status: "verified",
    has_photo: true,
    location_coords: "-5.1368, 119.4167",
  },
];

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
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function CollectorPage() {
  const { session, openModal } = useAuthModal();
  const [currentStops, setCurrentStops] = useState<RouteStop[]>(MOCK_STOPS);

  // Stats yang ditampilkan di CollectorNavbar — dihitung dari state live
  const collectedKg = currentStops
    .filter((s) => s.status === "done")
    .reduce((acc, s) => acc + (s.actual_kg ?? 0), 0);

  const stopsCompleted = currentStops.filter(
    (s) => s.status !== "pending",
  ).length;

  // ── Auth guards ──
  if (!session) return <NotLoggedIn onLogin={openModal} />;
  if (session.role !== "collector") return <AccessDenied />;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Navbar operasional — berbeda dari Navbar marketing Rebru */}
      <CollectorNavbar
        collectorName={session.name}
        collectedKg={collectedKg}
        stopsCompleted={stopsCompleted}
        totalStops={currentStops.length}
      />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 md:px-12 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-fluid-title text-text-primary font-semibold">
            Log{" "}
            <em className="text-coffee-latte not-italic">pengambilan</em>{" "}
            ampas kopi
          </h1>
          <p className="text-[0.82rem] text-text-muted mt-2">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · Rute ditetapkan admin ·{" "}
            <span style={{ color: "var(--forest-sage)" }}>
              {currentStops.length} stop hari ini
            </span>
          </p>
        </div>

        {/* 2-kolom desktop, stacked mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          <RouteSection
            collectorName={session.name}
            routeDate={new Date().toISOString().split("T")[0]}
            initialStops={MOCK_STOPS}
            onStopsChange={setCurrentStops}
          />

          {/* Sidebar sticky di desktop */}
          <div className="lg:sticky lg:top-[72px]">
            <HistorySection
              weeklyData={MOCK_WEEKLY}
              historyLogs={MOCK_HISTORY}
            />
          </div>
        </div>
      </main>

      {/* Footer Rebru — tidak dimodifikasi */}
      <Footer />
    </div>
  );
}
