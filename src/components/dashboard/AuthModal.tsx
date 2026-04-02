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
  "admin@rebru.id":  { password: "rebru2025", name: "Admin Rebru",     roles: ["admin"] },
  "mitra@rebru.id":  { password: "mitra123",  name: "Mitra Partner",   roles: ["mitra"] },
  "gov@rebru.id":    { password: "gov123",     name: "Government User", roles: ["government"] },
  "multi@rebru.id":  { password: "multi123",   name: "Multi Role User", roles: ["admin", "mitra"] },
};

const ROLE_ICONS: Record<UserRole, string> = {
  admin:      "fa-shield-halved",
  mitra:      "fa-recycle",
  government: "fa-landmark",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthModal() {
  const { isOpen, closeModal, setSession } = useAuthModal();

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [step,      setStep]      = useState<"login" | "role">("login");
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-lg"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-coffee-dark border border-coffee-latte/12 rounded-lg p-12 w-full max-w-[420px] relative">

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center border border-white/8 text-ink-ghost text-[0.9rem] hover:text-ink hover:border-white/20 transition-all"
        >
          <i className="fas fa-times" />
        </button>

        {/* ── Step 1: Login ── */}
        {step === "login" && (
          <>
            <div className="mb-8">
              <h2 className="font-display text-[1.8rem] font-semibold text-coffee-foam">
                Sign In
              </h2>
              <p className="text-[0.8rem] text-ink-ghost mt-1 tracking-[0.05em]">
                Restricted to authorized accounts
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-[0.75rem] tracking-[0.12em] uppercase text-ink-ghost mb-2">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/8 rounded-md text-ink text-[0.95rem] outline-none placeholder:text-ink-ghost focus:border-coffee-latte/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div className="mb-2">
              <label className="block text-[0.75rem] tracking-[0.12em] uppercase text-ink-ghost mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/8 rounded-md text-ink text-[0.95rem] outline-none placeholder:text-ink-ghost focus:border-coffee-latte/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[0.8rem] mt-2 mb-3">{error}</p>
            )}

            <button
              onClick={handleLogin}
              className="w-full mt-4 py-4 bg-gradient-to-br from-coffee-warm to-coffee-mid text-coffee-foam text-[0.88rem] font-medium tracking-[0.1em] uppercase rounded-md border border-coffee-latte/20 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(74,44,26,0.4)] transition-all"
            >
              <i className="fas fa-sign-in-alt mr-2" />
              Login
            </button>
          </>
        )}

        {/* ── Step 2: Role Selection ── */}
        {step === "role" && candidate && (
          <>
            <div className="mb-8">
              <h2 className="font-display text-[1.8rem] font-semibold text-coffee-foam">
                Select Role
              </h2>
              <p className="text-[0.85rem] text-ink-dim mt-1">
                Welcome,{" "}
                <strong className="text-coffee-latte">{candidate.name}</strong>
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {candidate.roles.map((role) => (
                <button
                  key={role}
                  onClick={() => launchDashboard(candidate.name, role)}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-md border border-white/8 bg-white/[0.03] text-ink-dim text-[0.9rem] hover:border-coffee-latte/25 hover:bg-coffee-latte/6 hover:text-coffee-cream transition-all"
                >
                  <i className={cn("fas", ROLE_ICONS[role], "text-coffee-latte w-[18px]")} />
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
