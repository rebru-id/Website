"use client";
// src/components/collector/CollectorNavbar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION: Tombol logout diperbarui untuk Supabase Auth
//
// Perubahan dari versi sebelumnya:
//   1. Destruktur `logout` dari useAuthModal() — bukan `setSession`
//   2. Tombol Logout memanggil logout() langsung (async, fire-and-forget)
//      logout() di AuthModalContext sudah handle: signOut + setSession(null)
//   3. Hapus inline code yang tidak valid secara sintaks JSX
//
// Tidak ada perubahan lain — UI, props, dan logika navbar tidak berubah.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import Image from "next/image";
import { useLogo } from "@/hooks/useLogo";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";

interface CollectorNavbarProps {
  collectorName: string;
  collectedKg: number;
  stopsCompleted: number;
  totalStops: number;
}

export default function CollectorNavbar({
  collectorName,
  collectedKg,
  stopsCompleted,
  totalStops,
}: CollectorNavbarProps) {
  // logout() dari context sudah wrap supabase.auth.signOut() + setSession(null)
  // Gunakan ini — JANGAN setSession(null) langsung
  const { logout } = useAuthModal();
  const logoSrc = useLogo();

  // Ambil inisial dari nama: "Rizky Kahwa" → "RK"
  const initials = collectorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const progressPct =
    totalStops > 0 ? Math.round((stopsCompleted / totalStops) * 100) : 0;

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: "var(--nav-scrolled-bg)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between px-6 md:px-12 h-14">
        {/* ── Kiri: Brand + breadcrumb ── */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src={logoSrc}
              alt="Rebru"
              width={24}
              height={24}
              className="transition-opacity duration-300"
            />
            <span className="font-display text-[1.2rem] font-semibold text-text-primary hidden sm:block">
              rebru
            </span>
          </Link>
          <span
            className="hidden sm:block text-sm select-none"
            style={{ color: "var(--border-strong)" }}
          >
            /
          </span>
          <span className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-text-muted hidden sm:block">
            Collector Log
          </span>
        </div>

        {/* ── Tengah: Shift stats — disembunyikan di mobile ── */}
        <div className="hidden md:flex items-center">
          {/* kg terkumpul */}
          <div
            className="flex items-baseline gap-1.5 px-5 border-l"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="font-display text-[1.15rem] font-semibold text-text-primary">
              {collectedKg % 1 === 0
                ? collectedKg.toFixed(0)
                : collectedKg.toFixed(1)}
            </span>
            <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-text-muted">
              kg hari ini
            </span>
          </div>

          {/* stop progress */}
          <div
            className="flex items-center gap-2 px-5 border-l"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="font-display text-[1.15rem] font-semibold text-text-primary">
              {stopsCompleted}
              <span className="text-text-muted text-[0.9rem]">
                /{totalStops}
              </span>
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-text-muted leading-none">
                stop selesai
              </span>
              {/* Mini progress bar */}
              <div
                className="w-14 h-[3px] rounded-full overflow-hidden"
                style={{ background: "var(--border-subtle)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: "var(--forest-sage)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Online indicator */}
          <div
            className="flex items-center gap-1.5 px-5 border-l"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--forest-sage)",
                animation: "pulse 2s ease-in-out infinite",
                boxShadow: "0 0 6px var(--forest-sage)",
              }}
            />
            <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-text-muted">
              Online
            </span>
          </div>
        </div>

        {/* ── Kanan: Identitas + logout ── */}
        <div className="flex items-center gap-3">
          {/* Nama + role (tersembunyi di layar sangat kecil) */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[0.82rem] font-medium text-text-primary leading-none">
              {collectorName.split(" ")[0]}
            </span>
            <span
              className="font-mono text-[0.58rem] tracking-[0.12em] uppercase mt-0.5"
              style={{ color: "var(--forest-sage)" }}
            >
              Collector
            </span>
          </div>

          {/* Avatar inisial */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[0.68rem] font-semibold shrink-0"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--coffee-latte)",
            }}
          >
            {initials}
          </div>

          {/* Logout — memanggil logout() dari context */}
          <button
            onClick={logout}
            className="font-mono text-[0.62rem] tracking-[0.08em] uppercase px-3 py-1.5 rounded-md border text-text-muted hover:text-text-primary transition-all duration-200"
            style={{ borderColor: "var(--border-default)" }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
