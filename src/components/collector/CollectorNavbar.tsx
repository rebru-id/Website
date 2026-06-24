"use client";
// src/components/collector/CollectorNavbar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Perubahan dari versi sebelumnya:
//
//   REC 2 — Compact stats di mobile navbar
//     Sebelumnya: stats (kg + stop progress) hidden di mobile dengan `hidden md:flex`
//     Sekarang: di mobile tampil versi compact "X/Y" dalam satu pill kecil
//     di samping avatar, agar collector bisa lihat progress tanpa scroll.
//     Di md ke atas, layout stats lengkap tetap seperti semula.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLogo } from "@/hooks/useLogo";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import { useState } from "react";

interface CollectorNavbarProps {
  collectorName: string;
  collectedKg: number;
  stopsCompleted: number;
  totalStops: number;
  pendingStopsCount: number;
}

export default function CollectorNavbar({
  collectorName,
  collectedKg,
  stopsCompleted,
  totalStops,
  pendingStopsCount,
}: CollectorNavbarProps) {
  const { logout } = useAuthModal();
  const router = useRouter();
  const logoSrc = useLogo();
  const resolvedLogo = logoSrc ?? "/assets/img/logo.png";
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function handleLogout() {
    if (pendingStopsCount > 0) {
      setShowLogoutConfirm(true);
      return;
    }
    await logout();
    router.push("/");
  }

  async function handleConfirmLogout() {
    setShowLogoutConfirm(false);
    await logout();
    router.push("/");
  }

  const initials = collectorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const progressPct =
    totalStops > 0 ? Math.round((stopsCompleted / totalStops) * 100) : 0;

  return (
    <>
      {/* Dialog konfirmasi logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-[340px] rounded-lg p-6 mx-4"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(196,136,47,0.12)",
                  border: "1px solid rgba(196,136,47,0.3)",
                }}
              >
                <i
                  className="fas fa-exclamation-triangle text-sm"
                  style={{ color: "var(--coffee-latte)" }}
                />
              </div>
              <div>
                <p className="text-[0.9rem] font-semibold text-text-primary">
                  Yakin ingin logout?
                </p>
                <p className="text-[0.75rem] text-text-muted mt-0.5">
                  Masih ada{" "}
                  <strong style={{ color: "var(--coffee-latte)" }}>
                    {pendingStopsCount} stop
                  </strong>{" "}
                  yang belum selesai.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-md text-[0.82rem] border"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-md text-[0.82rem] font-medium"
                style={{
                  background: "rgba(160,72,72,0.15)",
                  color: "var(--color-error)",
                  border: "1px solid rgba(160,72,72,0.35)",
                }}
              >
                Tetap Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{
          background: "var(--nav-scrolled-bg)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="max-w-[1280px] mx-auto flex items-center justify-between px-4 md:px-12 h-14">
          {/* ── Kiri: Brand + breadcrumb ── */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src={resolvedLogo}
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

          {/* ── Tengah: Shift stats lengkap — hanya di md ke atas ── */}
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

          {/* ── Kanan: Identitas + compact stats mobile + logout ── */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Nama + role — tersembunyi di layar sangat kecil */}
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

            {/*
              REC 2 — Compact stats pill — hanya di mobile (< md)
              Menampilkan "X.Xkg · Y/Z" dalam satu pill ringkas
              agar progress terlihat tanpa harus scroll ke bawah.
            */}
            <div
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              {/* kg */}
              <span
                className="font-mono text-[0.68rem] font-semibold"
                style={{ color: "var(--coffee-latte)" }}
              >
                {collectedKg % 1 === 0
                  ? collectedKg.toFixed(0)
                  : collectedKg.toFixed(1)}
                <span className="font-normal opacity-70">kg</span>
              </span>
              {/* divider */}
              <span
                className="w-px h-3 rounded-full"
                style={{ background: "var(--border-default)" }}
              />
              {/* stop progress */}
              <span
                className="font-mono text-[0.68rem] font-semibold"
                style={{ color: "var(--forest-sage)" }}
              >
                {stopsCompleted}
                <span className="text-text-muted font-normal">
                  /{totalStops}
                </span>
              </span>
              {/* Mini progress bar */}
              <div
                className="w-8 h-[2px] rounded-full overflow-hidden"
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="font-mono text-[0.62rem] tracking-[0.08em] uppercase px-3 py-1.5 rounded-md border text-text-muted hover:text-text-primary transition-all duration-200"
              style={{ borderColor: "var(--border-default)" }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
