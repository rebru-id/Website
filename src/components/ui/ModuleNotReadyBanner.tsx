// src/components/ui/ModuleNotReadyBanner.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ModuleNotReadyBanner — FASE 2.4
//
// SEBELUM ini, tiap section yang datanya masih mock/belum terhubung Supabase
// menulis ulang komponen empty-state-nya sendiri (contoh: BioEmptyCard dan
// IntegrationChartEmpty di OverviewSection — sudah digabung jadi satu di
// Fase 1.1). Sekarang komponennya JADI SATU DAN GENERIC di sini, supaya
// section lain yang masih mock (misalnya Products, ESG — lihat catatan
// migrasi di analisis dashboard) tinggal PAKAI, bukan menulis ulang.
//
// Cara pakai:
//   import { ModuleNotReadyBanner } from "@/components/ui/ModuleNotReadyBanner";
//
//   <ModuleNotReadyBanner
//     icon="fa-seedling"
//     title="Bio-Conversion & Integration Chart"
//     subtitle="Tersedia setelah tabel batches · production_runs aktif"
//     onNavigate={() => onNavigate("bio")}
//   />
// ─────────────────────────────────────────────────────────────────────────────

"use client";

interface ModuleNotReadyBannerProps {
  /** Font Awesome icon class, contoh: "fa-seedling", "fa-box" */
  icon: string;
  /** Judul singkat modul yang belum tersedia */
  title: string;
  /** Penjelasan singkat kenapa/kapan tersedia */
  subtitle: string;
  /** Dipanggil saat banner diklik — biasanya navigasi ke section terkait */
  onNavigate: () => void;
  /** Warna ikon, default hijau forest-sage (netral untuk semua konteks) */
  iconColor?: string;
}

export function ModuleNotReadyBanner({
  icon,
  title,
  subtitle,
  onNavigate,
  iconColor = "var(--forest-sage)",
}: ModuleNotReadyBannerProps) {
  return (
    <button
      onClick={onNavigate}
      className="rounded-lg px-5 py-3.5 flex items-center justify-between gap-4 text-left w-full transition-opacity hover:opacity-100"
      style={{
        background: "var(--bg-card)",
        border: "0.5px dashed var(--border-subtle)",
        opacity: 0.7,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(45,90,46,0.08)",
            color: iconColor,
          }}
        >
          <i className={`fas ${icon} text-[0.7rem]`} />
        </div>
        <div className="min-w-0">
          <p
            className="font-mono text-[0.68rem] tracking-[0.06em] truncate"
            style={{ color: "var(--text-secondary)" }}
          >
            {title}
          </p>
          <p
            className="font-mono text-[0.6rem] mt-0.5 truncate"
            style={{ color: "var(--text-muted)", opacity: 0.7 }}
          >
            {subtitle}
          </p>
        </div>
      </div>
      <i
        className="fas fa-arrow-right text-[0.65rem] flex-shrink-0"
        style={{ color: "var(--text-muted)" }}
      />
    </button>
  );
}
