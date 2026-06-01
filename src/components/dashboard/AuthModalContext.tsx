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

// ── Singleton Supabase client ─────────────────────────────────────────────────
// Module-level agar tidak re-create setiap render.
// createBrowserClient dari @supabase/ssr internally dedup GoTrueClient
// jika URL+key sama, tapi module-level lebih eksplisit dan aman.
const supabase = createClient();

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
  // Dijalankan sekali saat provider mount.
  // Menangani dua kasus:
  //   a) Hard refresh: getSession() → restore dari cookie/localStorage Supabase
  //   b) Login di tab lain / token refresh: onAuthStateChange → sinkron otomatis
  useEffect(() => {
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
        // Token expired, signOut, atau session revoked → clear local state
        setSessionState(null);
      }
    });

    // Cleanup: unsubscribe saat provider unmount
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
  // Panggil ini dari semua tombol Logout — bukan setSession(null).
  // Urutan: signOut Supabase (invalidate token di server) → clear local state.
  // onAuthStateChange juga akan fire dengan session=null tapi itu tidak masalah
  // karena setSessionState(null) idempotent.
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
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
