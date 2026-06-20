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
// FIX: Cara baca role diseragamkan dengan AuthModal.tsx
//   - Sebelumnya: meta.role (singular) — crash jika user hanya punya meta.roles[]
//   - Sekarang: coba meta.roles[] dulu, fallback ke meta.role singular
//   - Berlaku di getSession() dan onAuthStateChange()
//   - Jika roles kosong: tidak set session (hindari role=undefined → tabs crash)
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
  // true selama getSession() belum resolve — mencegah race condition
  // di AdminDashboard antara "belum dicek" vs "memang tidak login"
  sessionLoading: boolean;
}

export interface SessionState {
  name: string;
  role: UserRole;
  email: string;
}

// ── Helper: baca role dari user_metadata ─────────────────────────────────────
// Diseragamkan dengan AuthModal.tsx:
//   1. Coba meta.roles[] (array) — format baru
//   2. Fallback ke meta.role (singular) — format lama
//   3. Filter falsy values agar tidak ada role kosong/undefined
function resolveRoles(meta: Record<string, unknown>): UserRole[] {
  if (Array.isArray(meta.roles)) {
    return (meta.roles as UserRole[]).filter(Boolean);
  }
  if (meta.role) {
    return [meta.role as UserRole];
  }
  return [];
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSessionState] = useState<SessionState | null>(null);
  // true dari mount sampai getSession() selesai
  // Mock mode: langsung false karena tidak ada async restore
  const [sessionLoading, setSessionLoading] = useState(
    AUTH_MODE === "supabase",
  );

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
        const roles = resolveRoles(meta);

        // Jika roles kosong: jangan set session — hindari role=undefined
        // yang menyebabkan TABS_BY_ROLE[undefined] crash di DashboardOverlay
        if (roles.length === 0) {
          setSessionLoading(false);
          return;
        }

        setSessionState({
          name: (meta.name as string) || s.user.email || "",
          role: roles[0],
          email: s.user.email ?? "",
        });
      }
      // Selalu set false setelah getSession() selesai —
      // baik session ada maupun tidak ada
      setSessionLoading(false);
    });

    // (b) Listener untuk semua perubahan auth state setelahnya
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        const meta = s.user.user_metadata ?? {};
        const roles = resolveRoles(meta);

        // Sama seperti getSession: jangan set session jika roles kosong
        if (roles.length === 0) return;

        setSessionState({
          name: (meta.name as string) || s.user.email || "",
          role: roles[0],
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
      value={{
        isOpen,
        openModal,
        closeModal,
        session,
        setSession,
        logout,
        sessionLoading,
      }}
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
