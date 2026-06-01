"use client";
// src/app/admin/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FASE 2 — Ganti placeholder Fase 1 dengan AdminDashboard shell.
//
// Perubahan dari Fase 1:
//   - Import AdminDashboard
//   - Render <AdminDashboard /> sebagai ganti placeholder banner
//   - Auth guard tetap ada — jika tidak ada session/role admin, redirect ke /
//
// Catatan: AdminDashboard sudah punya guard internal-nya sendiri,
// tapi guard di sini tetap dipertahankan sebagai lapisan pertama
// sebelum AdminDashboard bahkan dimount.
// ─────────────────────────────────────────────────────────────────────────────

import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default function AdminPage() {
  const { session } = useAuthModal();
  const router = useRouter();

  // ── Auth Guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) {
      router.replace("/");
      return;
    }
    if (session.role !== "admin") {
      router.replace("/");
    }
  }, [session, router]);

  // Tampilkan loading sementara session dicek
  if (!session || session.role !== "admin") {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
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
            Verifying session...
          </span>
        </div>
      </div>
    );
  }

  // Session valid + role admin → render AdminDashboard
  return <AdminDashboard />;
}
