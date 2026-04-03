"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

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
      <div
        className={cn(
          "fixed bottom-8 right-8 z-60 flex items-center gap-2.5 px-5 py-3.5",
          "rounded-md text-[0.85rem] transition-all duration-300",
          "border",
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2.5 pointer-events-none",
        )}
        style={{
          background: "var(--forest-dark)",
          borderColor: "rgba(74,124,78,0.3)",
          color: "var(--forest-mist)",
        }}
      >
        <i
          className="fas fa-check-circle"
          style={{ color: "var(--forest-sage)" }}
        />
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
