"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

interface ToastContextValue {
  showToast: (msg: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const showToast = useCallback((msg: string, duration = 3000) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast UI */}
      <div
        className={cn(
          "fixed bottom-8 right-8 z-[200] flex items-center gap-2.5 px-5 py-3.5",
          "bg-forest-dark border border-forest-sage/30 rounded-md text-[0.85rem] text-forest-mist",
          "transition-all duration-300",
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2.5 pointer-events-none"
        )}
      >
        <i className="fas fa-check-circle text-forest-sage" />
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
