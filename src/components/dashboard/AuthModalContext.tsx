"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AuthModalContextValue {
  isOpen:      boolean;
  openModal:   () => void;
  closeModal:  () => void;
  session:     SessionState | null;
  setSession:  (s: SessionState | null) => void;
}

export interface SessionState {
  name: string;
  role: UserRole;
  email: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen,  setIsOpen]  = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);

  const openModal  = useCallback(() => setIsOpen(true),  []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <AuthModalContext.Provider
      value={{ isOpen, openModal, closeModal, session, setSession }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
