// src/components/ui/Toast.tsx
"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

interface ToastContextValue {
  show: (msg: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(
    null,
  );

  const show = (msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-md text-[0.85rem] font-mono tracking-wide
          ${toast.type === "error" ? "bg-red-900/90 text-red-200" : "bg-forest-dark/95 text-forest-sage"}
          border border-border-default backdrop-blur-md shadow-lg`}
        >
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
