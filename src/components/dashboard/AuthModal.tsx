"use client";
// src/components/dashboard/AuthModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION: Mock auth → Supabase Auth
//
// Perubahan dari versi sebelumnya:
//   1. Hapus MOCK_USERS sepenuhnya
//   2. MockUser interface → RoleCandidate (tidak butuh password)
//   3. handleLogin(): pakai supabase.auth.signInWithPassword()
//   4. Role + name diambil dari user_metadata (di-set via Supabase SQL Editor)
//   5. launchDashboard(): terima email dari Supabase (bukan state lokal)
//      → email dari Supabase = canonical email, lebih reliable
//   6. Tambah loading state → disabled saat proses login + spinner
//   7. supabase: module-level singleton (konsisten dengan AuthModalContext.tsx)
//
// Prerequisite (di Supabase):
//   Setiap user di auth.users harus punya user_metadata:
//   { "name": "Nama Lengkap", "role": "admin" }           ← single role
//   { "name": "Multi User",   "roles": ["admin","mitra"] } ← multi role
//
//   Set via SQL Editor:
//   UPDATE auth.users
//   SET raw_user_meta_data = '{"name":"Admin Rebru","role":"admin"}'
//   WHERE email = 'admin@rebru.id';
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { cn } from "@/utils";
import { useAuthModal, type SessionState } from "./AuthModalContext";
import { type UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ── Singleton client — modul level ────────────────────────────────────────────
const supabase = createClient();

// ── Types ─────────────────────────────────────────────────────────────────────

// Dipakai untuk step role selection (multi-role user)
// Tidak butuh password — sudah diautentikasi Supabase di step sebelumnya
interface RoleCandidate {
  name: string;
  roles: UserRole[];
  email: string; // email canonical dari Supabase, bukan state input
}

// ── Role icons ────────────────────────────────────────────────────────────────
// Record<UserRole, string> mensyaratkan semua key terdefinisi.
const ROLE_ICONS: Record<UserRole, string> = {
  admin: "fa-shield-halved",
  mitra: "fa-recycle",
  government: "fa-landmark",
  collector: "fa-truck-pickup",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthModal() {
  const { isOpen, closeModal, setSession } = useAuthModal();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "role">("login");
  const [candidate, setCandidate] = useState<RoleCandidate | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("login");
      setError("");
      setLoading(false);
      setTimeout(() => emailRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  function handleClose() {
    if (loading) return; // jangan close saat sedang proses login
    closeModal();
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
    setStep("login");
    setCandidate(null);
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError || !data.user) {
      setError("Email atau password salah. Coba lagi.");
      setPassword("");
      return;
    }

    // Ambil role dan nama dari user_metadata (di-set via Supabase SQL Editor)
    const meta = data.user.user_metadata ?? {};
    const roles: UserRole[] = Array.isArray(meta.roles)
      ? (meta.roles as UserRole[]) // multi-role: ["admin","mitra"]
      : [meta.role as UserRole].filter(Boolean); // single role: "admin"

    const name = (meta.name as string) || data.user.email || "";
    const userEmail = data.user.email || "";

    if (roles.length === 0) {
      setError("Akun ini belum memiliki role. Hubungi admin.");
      return;
    }

    if (roles.length > 1) {
      // Multi-role → tampil step pemilihan role
      setCandidate({ name, roles, email: userEmail });
      setStep("role");
    } else {
      launchDashboard(name, roles[0], userEmail);
    }
  }

  // ── launchDashboard ────────────────────────────────────────────────────────
  // email di sini adalah email canonical dari Supabase — bukan state input.
  // Ini penting agar SessionState.email match dengan collector_team.email di DB.
  function launchDashboard(name: string, role: UserRole, userEmail: string) {
    const sess: SessionState = { name, role, email: userEmail };
    setSession(sess);
    handleClose();

    if (role === "admin") {
      router.push("/admin");
    } else if (role === "collector") {
      router.push("/collector");
    }
    // mitra, government: tidak ada redirect — DashboardOverlay yang handle
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-lg"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-[420px] rounded-lg p-12 border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center border text-text-muted hover:text-text-primary hover:border-border-strong transition-all disabled:opacity-40"
        >
          <i className="fas fa-times" />
        </button>

        {/* ── Step 1: Login ── */}
        {step === "login" && (
          <>
            <div className="mb-8">
              <h2 className="font-display text-[1.8rem] font-semibold text-text-primary">
                Sign In
              </h2>
              <p className="text-[0.8rem] text-text-muted mt-1 tracking-[0.05em]">
                Restricted to authorized accounts
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-[0.75rem] tracking-[0.12em] uppercase text-text-muted mb-2">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                placeholder="your@email.com"
                autoComplete="email"
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-md text-text-primary text-[0.95rem] outline-none transition-all placeholder:text-text-muted disabled:opacity-60"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--border-strong)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border-subtle)")
                }
              />
            </div>

            <div className="mb-2">
              <label className="block text-[0.75rem] tracking-[0.12em] uppercase text-text-muted mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-md text-text-primary text-[0.95rem] outline-none transition-all placeholder:text-text-muted disabled:opacity-60"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--border-strong)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--border-subtle)")
                }
              />
            </div>

            {error && (
              <p className="text-red-400 text-[0.8rem] mt-2">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-5 py-4 rounded-md text-[0.88rem] font-medium tracking-[0.1em] uppercase transition-all hover:-translate-y-0.5 btn-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2" />
                  Login
                </>
              )}
            </button>
          </>
        )}

        {/* ── Step 2: Role Selection ── */}
        {step === "role" && candidate && (
          <>
            <div className="mb-8">
              <h2 className="font-display text-[1.8rem] font-semibold text-text-primary">
                Select Role
              </h2>
              <p className="text-[0.85rem] text-text-secondary mt-1">
                Welcome,{" "}
                <strong className="text-coffee-latte">{candidate.name}</strong>
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {candidate.roles.map((role) => (
                <button
                  key={role}
                  onClick={() =>
                    launchDashboard(candidate.name, role, candidate.email)
                  }
                  className="flex items-center gap-3 px-5 py-3.5 rounded-md border text-text-secondary text-[0.9rem] hover:text-text-primary transition-all"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: "var(--bg-card)",
                  }}
                >
                  <i
                    className={cn(
                      "fas",
                      ROLE_ICONS[role],
                      "text-coffee-latte w-[18px]",
                    )}
                  />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
