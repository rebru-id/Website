"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuthModal, type SessionState } from "./AuthModalContext";
import { type UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Mock users — REPLACE with Supabase Auth when ready:
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password })
//   then: const { data: profile } = await supabase.from("user_profiles")
//           .select("role, name").eq("user_id", data.user.id).single()
// ─────────────────────────────────────────────────────────────────────────────

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

const ROLE_ICONS: Record<UserRole, string> = {
  admin: "fa-shield-halved",
  mitra: "fa-recycle",
  government: "fa-landmark",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthModal() {
  const { isOpen, closeModal, setSession } = useAuthModal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"login" | "role">("login");
  const [candidate, setCandidate] = useState<MockUser | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  // Focus email on open
  useEffect(() => {
    if (isOpen) {
      setStep("login");
      setError("");
      setTimeout(() => emailRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
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

  function launchDashboard(name: string, role: UserRole) {
    const sess: SessionState = { name, role, email };
    setSession(sess);
    handleClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-lg"
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
    </div>
  );
}
