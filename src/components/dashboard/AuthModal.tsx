"use client";
// src/components/dashboard/AuthModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MODIFIED — penambahan role "collector" tanpa breaking existing flows:
//
//   1. MOCK_USERS: tambah "collector@rebru.id"
//   2. ROLE_ICONS: tambah "collector" → fa-truck-pickup
//      (wajib karena Record<UserRole, string> menuntut semua key terdefinisi
//       setelah "collector" ditambahkan ke UserRole)
//   3. launchDashboard(): tambah conditional redirect ke /collector
//      hanya untuk role collector — admin/mitra/government TIDAK terpengaruh,
//      mereka tetap hanya setSession + closeModal seperti sebelumnya
//
// Semua test case existing tetap valid:
//   admin@rebru.id   → setSession → DashboardOverlay terbuka (tidak berubah)
//   mitra@rebru.id   → setSession → DashboardOverlay terbuka (tidak berubah)
//   gov@rebru.id     → setSession → DashboardOverlay terbuka (tidak berubah)
//   multi@rebru.id   → step role → pilih admin/mitra → tidak berubah
//   collector@rebru.id → setSession → redirect ke /collector (baru)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { cn } from "@/utils";
import { useAuthModal, type SessionState } from "./AuthModalContext";
import { type UserRole } from "@/types";

interface MockUser {
  password: string;
  name: string;
  roles: UserRole[];
}

// ── MODIFIED: tambah collector ─────────────────────────────────────────────
const MOCK_USERS: Record<string, MockUser> = {
  "admin@rebru.id": {
    password: "rebru2025",
    name: "Admin Rebru",
    roles: ["admin"],
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
  // ── BARU: akun collector ──
  "collector@rebru.id": {
    password: "collector123",
    name: "Rizky Kahwa",
    roles: ["collector"],
  },
};

// ── MODIFIED: tambah collector icon ───────────────────────────────────────
// Record<UserRole, string> mensyaratkan semua key ada setelah UserRole diupdate.
// fa-truck-pickup → ikon truk kecil, semantik untuk kegiatan penjemputan.
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
  const [step, setStep] = useState<"login" | "role">("login");
  const [candidate, setCandidate] = useState<MockUser | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("login");
      setError("");
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
    closeModal();
    setEmail("");
    setPassword("");
    setError("");
    setStep("login");
    setCandidate(null);
  }

  function handleLogin() {
    const user = MOCK_USERS[email.trim()];
    if (!user || user.password !== password) {
      setError("Email atau password salah. Coba lagi.");
      setPassword("");
      return;
    }
    setError("");
    if (user.roles.length > 1) {
      setCandidate(user);
      setStep("role");
    } else {
      launchDashboard(user.name, user.roles[0]);
    }
  }

  // ── MODIFIED: redirect collector ke /collector ────────────────────────────
  // Roles lain (admin, mitra, government) tidak disentuh — hanya setSession.
  // Collector menggunakan router.push() agar konsisten dengan Next.js App Router
  // dan agar back-button browser bekerja dengan benar.
  function launchDashboard(name: string, role: UserRole) {
    const sess: SessionState = { name, role, email };
    setSession(sess);
    handleClose();

    if (role === "collector") {
      router.push("/collector");
    }
    // admin, mitra, government: tidak ada redirect — DashboardOverlay yang handle
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
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center border text-text-muted hover:text-text-primary hover:border-border-strong transition-all"
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
                className="w-full px-4 py-3.5 rounded-md text-text-primary text-[0.95rem] outline-none transition-all placeholder:text-text-muted"
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
                className="w-full px-4 py-3.5 rounded-md text-text-primary text-[0.95rem] outline-none transition-all placeholder:text-text-muted"
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
              className="w-full mt-5 py-4 rounded-md text-[0.88rem] font-medium tracking-[0.1em] uppercase transition-all hover:-translate-y-0.5 btn-primary"
            >
              <i className="fas fa-sign-in-alt mr-2" /> Login
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
                  onClick={() => launchDashboard(candidate.name, role)}
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
