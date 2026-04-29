// src/components/ui/ErrorBoundary.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary — menangkap JavaScript error di subtree komponen
//
// React Error Boundary HARUS berupa class component — hooks tidak bisa
// mengimplementasikan componentDidCatch dan getDerivedStateFromError.
//
// Usage:
//   <ErrorBoundary>
//     <ComponentYangMungkinCrash />
//   </ErrorBoundary>
//
//   <ErrorBoundary fallback={<p>Gagal memuat produk.</p>}>
//     <ProductsCatalogSection />
//   </ErrorBoundary>
//
// Sprint 4: bisa diperluas dengan error reporting ke Sentry/LogRocket
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  /**
   * Konten yang ditampilkan saat error terjadi.
   * Jika tidak diisi, pakai UI fallback default.
   */
  fallback?: ReactNode;
  /**
   * Callback opsional — dipanggil saat error tertangkap.
   * Sprint 4: kirim error ke monitoring service di sini.
   */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state agar render berikutnya menampilkan fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log error ke console di development
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", error);
      console.error("[ErrorBoundary] Component stack:", info.componentStack);
    }
    // Sprint 4: panggil monitoring service di sini
    // captureException(error, { extra: info });
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Tampilkan custom fallback jika disediakan
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI — sesuai dengan design system Rebru
      return (
        <div
          className="flex flex-col items-center justify-center py-20 px-8 text-center"
          style={{ minHeight: "240px" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <i
              className="fas fa-exclamation text-[1.1rem]"
              style={{ color: "var(--text-muted)" }}
            />
          </div>

          <p
            className="font-display font-semibold text-[1.1rem] mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Terjadi Kesalahan
          </p>

          <p
            className="text-[0.82rem] leading-[1.7] mb-6 max-w-[280px]"
            style={{ color: "var(--text-muted)" }}
          >
            Bagian ini tidak dapat dimuat. Coba muat ulang halaman.
          </p>

          {/* Hanya tampilkan detail error di development */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre
              className="text-[0.7rem] text-left rounded-md px-4 py-3 mb-5 max-w-full overflow-auto"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                maxWidth: "400px",
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            className="font-mono text-[0.72rem] tracking-[0.1em] uppercase px-5 py-2.5 rounded-pill transition-all duration-200"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border-strong)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-secondary)";
            }}
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
