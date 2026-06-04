"use client";
// src/components/dashboard/AuthModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Auth Modal dengan dual-mode: mock (local dev) dan Supabase (production)
//
// Toggle via environment variable:
//   NEXT_PUBLIC_AUTH_MODE=mock      → pakai MOCK_USERS (local dev, tidak perlu internet)
//   NEXT_PUBLIC_AUTH_MODE=supabase  → pakai Supabase Auth (production/Vercel)
//
// Cara setup local:
//   1. Buka file .env.local di root project
//   2. Tambahkan: NEXT_PUBLIC_AUTH_MODE=mock
//   3. Jalankan: npm run dev
//   → Login dengan email/password mock tanpa perlu koneksi Supabase Auth
//
// Cara push ke production:
//   - Tidak perlu ubah kode apapun
//   - Di Vercel: NEXT_PUBLIC_AUTH_MODE=supabase (atau kosongkan = default supabase)
//   - Push seperti biasa
//
// Mock credentials (hanya aktif saat AUTH_MODE=mock):
//   admin@rebru.id     / rebru2025
//   collector@rebru.id / collector123
//   mitra@rebru.id     / mitra123
//   gov@rebru.id       / gov123
//   multi@rebru.id     / multi123  (admin + mitra)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { cn } from "@/utils";
import { useAuthModal, type SessionState } from "./AuthModalContext";
import { type UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ── Auth mode toggle ──────────────────────────────────────────────────────────
// "mock"     = local dev, tidak butuh koneksi Supabase Auth
// "supabase" = production, pakai Supabase signInWithPassword
// Default ke "supabase" jika variabel tidak di-set (aman untuk production)
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "supabase";

// ── Supabase client (hanya dipakai saat AUTH_MODE=supabase) ───────────────────
const supabase = AUTH_MODE === "supabase" ? createClient() : null;

// ── Mock users (hanya aktif saat AUTH_MODE=mock) ──────────────────────────────
interface MockUser {
  password: string;
  name: string;
  roles: UserRole[];
}
const MOCK_USERS: Record<string, MockUser> = {
  "admin@rebru.id": {
    password: "rebru2025",
    name: "Admin Rebru",
    roles: ["admin"],
  },
  "collector@rebru.id": {
    password: "collector123",
    name: "Rebru Team",
    roles: ["collector"],
  },
  "mitra@rebru.id": {
    password: "mitra123",
    name: "Mitra Partner",
    roles: ["mitra"],
  },
  "gov@rebru.id": {
    password: "gov123",
    name: "Government User",
    roles: ["government"],
  },
  "multi@rebru.id": {
    password: "multi123",
    name: "Multi Role User",
    roles: ["admin", "mitra"],
  },
};

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

    // ── MOCK MODE (local dev) ────────────────────────────────────────────────
    if (AUTH_MODE === "mock") {
      await new Promise((r) => setTimeout(r, 400)); // simulasi network delay
      const user = MOCK_USERS[email.trim()];
      setLoading(false);
      if (!user || user.password !== password) {
        setError("Email atau password salah. Coba lagi.");
        setPassword("");
        return;
      }
      if (user.roles.length > 1) {
        setCandidate({
          name: user.name,
          roles: user.roles,
          email: email.trim(),
        });
        setStep("role");
      } else {
        launchDashboard(user.name, user.roles[0], email.trim());
      }
      return;
    }

    // ── SUPABASE MODE (production) ───────────────────────────────────────────
    const { data, error: authError } = await supabase!.auth.signInWithPassword({
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
      ? (meta.roles as UserRole[])
      : [meta.role as UserRole].filter(Boolean);

    const name = (meta.name as string) || data.user.email || "";
    const userEmail = data.user.email || "";

    if (roles.length === 0) {
      setError("Akun ini belum memiliki role. Hubungi admin.");
      return;
    }

    if (roles.length > 1) {
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
