"use client";
// src/components/dashboard/AuthModalContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION: Mock auth → Supabase Auth
//
// Perubahan dari versi sebelumnya:
//   1. Import createClient dari @/lib/supabase/client
//   2. Module-level singleton supabase — konsisten dengan supabase-collector.ts
//   3. useEffect: restore session saat page refresh via getSession()
//   4. onAuthStateChange: listener untuk login/logout/token refresh otomatis
//   5. Tambah `logout` ke context — dipakai CollectorNavbar, AdminDashboard, dll.
//      PENTING: Selalu pakai logout(), JANGAN setSession(null) langsung,
//      agar supabase.auth.signOut() selalu terpanggil.
//   6. AuthModalContextValue: tambah logout field
//
// Flow session restore:
//   App load → getSession() → session ada? → setSession → komponen render normal
//   App load → getSession() → session null  → user lihat halaman publik
//   Token expired → onAuthStateChange fire → session null → redirect ke /
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { type UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ── Auth mode + Supabase client ──────────────────────────────────────────────
// Mock mode: Supabase client tidak diinisialisasi → tidak ada network call
// Supabase mode: client diinisialisasi untuk session restore + listener
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "supabase";
const supabase = AUTH_MODE === "supabase" ? createClient() : null;

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  session: SessionState | null;
  setSession: (s: SessionState | null) => void;
  logout: () => Promise<void>;
}

export interface SessionState {
  name: string;
  role: UserRole;
  email: string;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSessionState] = useState<SessionState | null>(null);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  // ── Session restore & listener ─────────────────────────────────────────────
  // Mock mode: tidak perlu restore session — setSession dipanggil langsung
  //            dari AuthModal setelah mock login berhasil
  // Supabase mode: restore session dari cookie + listener untuk token refresh
  useEffect(() => {
    if (AUTH_MODE !== "supabase" || !supabase) return;

    // (a) Restore session yang sudah ada saat pertama load
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        const meta = s.user.user_metadata ?? {};
        setSessionState({
          name: (meta.name as string) || s.user.email || "",
          role: meta.role as UserRole,
          email: s.user.email ?? "",
        });
      }
    });

    // (b) Listener untuk semua perubahan auth state setelahnya
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        const meta = s.user.user_metadata ?? {};
        setSessionState({
          name: (meta.name as string) || s.user.email || "",
          role: meta.role as UserRole,
          email: s.user.email ?? "",
        });
      } else {
        setSessionState(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── setSession ────────────────────────────────────────────────────────────
  // Dipakai AuthModal setelah login berhasil untuk langsung set state lokal.
  // onAuthStateChange sebenarnya sudah handle ini, tapi setSession
  // dipanggil lebih awal agar UI redirect tidak nunggu event.
  const setSession = useCallback((s: SessionState | null) => {
    setSessionState(s);
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  // Mock mode: cukup clear local state
  // Supabase mode: signOut ke server + clear local state
  const logout = useCallback(async () => {
    if (AUTH_MODE === "supabase" && supabase) {
      await supabase.auth.signOut();
    }
    setSessionState(null);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{ isOpen, openModal, closeModal, session, setSession, logout }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx)
    throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
