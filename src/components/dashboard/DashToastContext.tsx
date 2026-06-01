"use client";
// src/components/dashboard/DashToastContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Toast system khusus Admin Dashboard — sepenuhnya terpisah dari Toast.tsx publik.
//
// Arsitektur:
//   AdminDashboard.tsx
//     └── <DashToastProvider>   ← provider hanya di admin shell
//           └── PartnerSection, MessageSection, dll.
//                 └── useDashToast()  ← hook, aman dipakai di mana saja dalam admin
//
// Fitur:
//   - Multiple toasts sekaligus (stack vertikal)
//   - Success: auto-dismiss 3s | Error: auto-dismiss 5s
//   - Click toast = dismiss manual
//   - Ikon per tipe (fa-check / fa-exclamation-circle)
//   - Slide-up animation
//   - Posisi: bottom-right (tidak mengganggu list / detail panel)
//   - Styling via CSS variables (konsisten dengan design system admin)
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DashToastType = "success" | "error";

interface ToastItem {
  id: number;
  msg: string;
  type: DashToastType;
}

interface DashToastContextValue {
  show: (msg: string, type?: DashToastType) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const DashToastContext = createContext<DashToastContextValue | null>(null);

// ── Toast item component ──────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const ok = toast.type === "success";

  return (
    <div
      onClick={() => onDismiss(toast.id)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer"
      style={{
        background: ok ? "rgba(30,55,30,0.97)" : "rgba(60,20,20,0.97)",
        border: `0.5px solid ${ok ? "rgba(122,171,126,0.45)" : "rgba(248,113,113,0.45)"}`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        maxWidth: "340px",
        minWidth: "240px",
        animation: "dashToastSlideUp 0.22s ease",
      }}
    >
      {/* Icon */}
      <i
        className={`fas ${ok ? "fa-check" : "fa-exclamation-circle"} text-[11px] mt-0.5 flex-shrink-0`}
        style={{ color: ok ? "var(--forest-sage)" : "#f87171" }}
        aria-hidden
      />

      {/* Message */}
      <p
        className="text-[11px] leading-snug flex-1"
        style={{
          color: ok ? "rgba(180,220,180,0.95)" : "rgba(252,165,165,0.95)",
          fontFamily: "var(--font-space-mono)",
          letterSpacing: "0.03em",
        }}
      >
        {toast.msg}
      </p>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        className="flex-shrink-0 transition-opacity hover:opacity-100"
        style={{
          color: ok ? "rgba(122,171,126,0.55)" : "rgba(248,113,113,0.55)",
          opacity: 0.7,
        }}
        aria-label="Tutup notifikasi"
      >
        <i className="fas fa-times text-[9px]" aria-hidden />
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function DashToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (msg: string, type: DashToastType = "success") => {
      const id = ++counter.current;
      const duration = type === "error" ? 5000 : 3000;

      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return (
    <DashToastContext.Provider value={{ show }}>
      {children}

      {/* Keyframe animation — injected sekali, scoped ke komponen ini */}
      <style>{`
        @keyframes dashToastSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      {/* Container — bottom-right, tidak overlap konten utama */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-label="Notifikasi dashboard"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </DashToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDashToast(): DashToastContextValue {
  const ctx = useContext(DashToastContext);
  if (!ctx)
    throw new Error("useDashToast must be used within DashToastProvider");
  return ctx;
}
