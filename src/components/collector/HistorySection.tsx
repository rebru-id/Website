"use client";
// src/components/collector/HistorySection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Perubahan dari versi sebelumnya:
//
//   REC 5 — Tambah prop `isLoading`
//     Karena history sekarang di-fetch independen dari rute, HistorySection
//     perlu tahu kapan datanya masih dimuat. Saat isLoading=true, tampilkan
//     skeleton placeholder agar tidak terlihat kosong secara tiba-tiba.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { cn } from "@/utils";
import type { WasteLog, WeeklyBar, MitraCategory } from "@/types/collector";

const CHART_HEIGHT_PX = 56;

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Bar Chart
// ─────────────────────────────────────────────────────────────────────────────

function WeeklyBarChart({ data }: { data: WeeklyBar[] }) {
  const maxKg = Math.max(...data.map((d) => d.kg), 1);

  return (
    <div>
      <p className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-text-muted mb-3">
        Total kg per hari — 7 hari terakhir
      </p>

      <div
        className="flex items-end gap-1.5"
        style={{ height: `${CHART_HEIGHT_PX}px` }}
      >
        {data.map((bar, idx) => {
          const heightPx =
            bar.kg > 0
              ? Math.max(Math.round((bar.kg / maxKg) * CHART_HEIGHT_PX), 3)
              : 0;

          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-end flex-1"
              style={{ height: "100%" }}
            >
              {bar.kg > 0 && (
                <span
                  className="font-mono text-[0.58rem] text-text-muted mb-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {bar.kg % 1 === 0 ? bar.kg.toFixed(0) : bar.kg.toFixed(1)}
                </span>
              )}
              <div
                className="w-full rounded-t-[2px] transition-all duration-500"
                style={{
                  height: `${heightPx}px`,
                  background: bar.isToday
                    ? "var(--coffee-latte)"
                    : "rgba(196,149,106,0.2)",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5 mt-1">
        {data.map((bar, idx) => (
          <div key={idx} className="flex-1 text-center">
            <span
              className={cn(
                "font-mono text-[0.58rem]",
                bar.isToday ? "text-coffee-latte" : "text-text-muted",
              )}
            >
              {bar.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category pill
// ─────────────────────────────────────────────────────────────────────────────

function CategoryPill({ cat }: { cat: MitraCategory }) {
  const map: Record<
    MitraCategory,
    { label: string; color: string; bg: string }
  > = {
    cafe: {
      label: "Cafe",
      color: "var(--coffee-latte)",
      bg: "rgba(196,149,106,0.1)",
    },
    hotel: { label: "Hotel", color: "var(--gold)", bg: "rgba(200,168,75,0.1)" },
    resto: {
      label: "Resto",
      color: "var(--forest-sage)",
      bg: "rgba(122,171,126,0.1)",
    },
  };
  const { label, color, bg } = map[cat];
  return (
    <span
      className="font-mono text-[0.6rem] tracking-[0.04em] px-1.5 py-0.5 rounded-pill border"
      style={{ color, background: bg, borderColor: color + "33" }}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

function LogStatusBadge({ status }: { status: WasteLog["status"] }) {
  const map = {
    verified: {
      label: "✓ Verified",
      color: "var(--forest-sage)",
      bg: "rgba(122,171,126,0.1)",
      border: "rgba(122,171,126,0.25)",
    },
    pending: {
      label: "Pending",
      color: "var(--coffee-latte)",
      bg: "rgba(196,149,106,0.1)",
      border: "rgba(196,149,106,0.25)",
    },
    skipped: {
      label: "Dilewati",
      color: "#f87171",
      bg: "rgba(248,113,113,0.08)",
      border: "rgba(248,113,113,0.2)",
    },
  };
  const { label, color, bg, border } = map[status];
  return (
    <span
      className="font-mono text-[0.6rem] tracking-[0.04em] px-2 py-0.5 rounded-pill border shrink-0"
      style={{ color, background: bg, borderColor: border }}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Log entry — collapsible
// ─────────────────────────────────────────────────────────────────────────────

function LogEntry({ log }: { log: WasteLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-md border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors"
        aria-expanded={expanded}
      >
        <div className="shrink-0 text-right w-12">
          <span
            className="font-mono text-[0.95rem] font-semibold"
            style={{
              color:
                log.status === "skipped"
                  ? "var(--text-muted)"
                  : "var(--coffee-latte)",
            }}
          >
            {log.status === "skipped" ? "—" : log.kg.toFixed(1)}
          </span>
          {log.status !== "skipped" && (
            <span className="font-mono text-[0.58rem] text-text-muted block">
              kg
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[0.82rem] font-medium text-text-primary truncate">
            {log.mitra_name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <CategoryPill cat={log.mitra_category} />
            <span className="font-mono text-[0.6rem] text-text-muted">
              {log.time} · {log.date}
            </span>
            {log.has_photo && (
              <i
                className="fas fa-image text-[0.6rem] text-text-muted"
                title="Ada foto dokumentasi"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LogStatusBadge status={log.status} />
          <span
            className="text-text-muted text-[0.65rem] transition-transform duration-200"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-block",
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div
          className="px-3 pb-3 grid grid-cols-2 gap-x-4 gap-y-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {log.status !== "skipped" && (
            <>
              {log.condition && (
                <div>
                  <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-text-muted">
                    Kondisi
                  </p>
                  <p className="text-[0.78rem] text-text-secondary mt-0.5 capitalize">
                    {log.condition}
                  </p>
                </div>
              )}
              {log.location_coords && (
                <div>
                  <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-text-muted">
                    Koordinat
                  </p>
                  <p className="font-mono text-[0.72rem] text-text-secondary mt-0.5">
                    {log.location_coords}
                  </p>
                </div>
              )}
              {log.notes && (
                <div className="col-span-2">
                  <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-text-muted">
                    Catatan
                  </p>
                  <p className="text-[0.78rem] text-text-secondary mt-0.5 leading-relaxed">
                    {log.notes}
                  </p>
                </div>
              )}
            </>
          )}
          {log.status === "skipped" && log.skip_reason && (
            <div className="col-span-2">
              <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-text-muted">
                Alasan dilewati
              </p>
              <p className="text-[0.78rem] mt-0.5" style={{ color: "#f87171" }}>
                {log.skip_reason}
              </p>
            </div>
          )}
          {log.status !== "skipped" &&
            !log.condition &&
            !log.location_coords &&
            !log.notes && (
              <p className="col-span-2 text-[0.75rem] text-text-muted italic">
                Tidak ada detail tambahan
              </p>
            )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton — ditampilkan saat isLoading=true (REC 5)
// ─────────────────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div
      className="rounded-md border overflow-hidden animate-pulse"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div
        className="px-4 py-3.5 border-b flex items-center gap-3"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div
          className="w-7 h-7 rounded-md shrink-0"
          style={{ background: "var(--bg-elevated)" }}
        />
        <div className="flex-1">
          <div
            className="h-3 rounded-full w-32 mb-2"
            style={{ background: "var(--bg-elevated)" }}
          />
          <div
            className="h-2.5 rounded-full w-24"
            style={{ background: "var(--bg-elevated)" }}
          />
        </div>
      </div>
      <div className="px-4 py-4">
        {/* Chart skeleton */}
        <div
          className="flex items-end gap-1.5 mb-4"
          style={{ height: `${CHART_HEIGHT_PX}px` }}
        >
          {[40, 65, 30, 80, 50, 70, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[2px]"
              style={{
                height: `${h * 0.56}px`,
                background: "var(--bg-elevated)",
              }}
            />
          ))}
        </div>
        {/* Log skeleton rows */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[52px] rounded-md mb-1.5"
            style={{ background: "var(--bg-elevated)" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HistorySection — main export
// ─────────────────────────────────────────────────────────────────────────────

interface HistorySectionProps {
  weeklyData: WeeklyBar[];
  historyLogs: WasteLog[];
  /** REC 5: true saat fetch history masih berjalan (independen dari rute) */
  isLoading?: boolean;
}

export default function HistorySection({
  weeklyData,
  historyLogs,
  isLoading = false,
}: HistorySectionProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [logsExpanded, setLogsExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rebru_history_panel_open");
    if (saved !== null) {
      try {
        setPanelOpen(JSON.parse(saved));
      } catch {
        /* invalid value, keep default */
      }
    }
  }, []);

  function togglePanel() {
    setPanelOpen((prev) => {
      const next = !prev;
      localStorage.setItem("rebru_history_panel_open", JSON.stringify(next));
      return next;
    });
  }

  const todayTotal = weeklyData.find((d) => d.isToday)?.kg ?? 0;
  const weekTotal = weeklyData.reduce((acc, d) => acc + d.kg, 0);
  const verifiedCount = historyLogs.filter(
    (l) => l.status === "verified",
  ).length;

  // REC 5 — tampilkan skeleton saat data masih dimuat
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem] font-semibold shrink-0"
            style={{
              background: "var(--forest-sage)",
              color: "var(--forest-dark)",
            }}
          >
            2
          </div>
          <div>
            <h2 className="font-display text-[1.15rem] text-text-primary font-semibold">
              Riwayat pengambilan
            </h2>
            <p className="text-[0.78rem] text-text-muted mt-0.5">
              Memuat data...
            </p>
          </div>
        </div>
        <HistorySkeleton />
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem] font-semibold shrink-0"
          style={{
            background: "var(--forest-sage)",
            color: "var(--forest-dark)",
          }}
        >
          2
        </div>
        <div>
          <h2 className="font-display text-[1.15rem] text-text-primary font-semibold">
            Riwayat pengambilan
          </h2>
          <p className="text-[0.78rem] text-text-muted mt-0.5">
            Klik log untuk lihat detail
          </p>
        </div>
      </div>

      {/* Main card */}
      <div
        className="rounded-md border overflow-hidden"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Collapsible header */}
        <button
          onClick={togglePanel}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors"
          style={{ borderColor: "var(--border-subtle)" }}
          aria-expanded={panelOpen}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm shrink-0"
            style={{
              background: "rgba(122,171,126,0.1)",
              border: "1px solid rgba(122,171,126,0.2)",
              color: "var(--forest-sage)",
            }}
          >
            <i className="fas fa-chart-bar" />
          </div>
          <div className="flex-1">
            <p className="text-[0.88rem] font-medium text-text-primary leading-none">
              Statistik &amp; riwayat saya
            </p>
            <p className="text-[0.72rem] text-text-muted mt-0.5">
              7 hari terakhir ·{" "}
              <span style={{ color: "var(--forest-sage)" }}>
                {verifiedCount} log terverifikasi
              </span>
            </p>
          </div>
          <span
            className="text-text-muted text-[0.7rem] transition-transform duration-300 shrink-0"
            style={{
              transform: panelOpen ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-block",
            }}
          >
            ▲
          </span>
        </button>

        {panelOpen && (
          <>
            {/* Bar chart */}
            <div
              className="px-4 py-4 border-b"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <WeeklyBarChart data={weeklyData} />

              {/* Summary stats */}
              <div className="flex gap-0 mt-4">
                <div
                  className="flex-1 text-center border-r py-2"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p
                    className="font-display text-[1.2rem] font-semibold leading-none"
                    style={{ color: "var(--coffee-latte)" }}
                  >
                    {todayTotal % 1 === 0
                      ? todayTotal.toFixed(0)
                      : todayTotal.toFixed(1)}
                  </p>
                  <p className="font-mono text-[0.58rem] tracking-[0.08em] uppercase text-text-muted mt-1">
                    kg hari ini
                  </p>
                </div>
                <div className="flex-1 text-center py-2">
                  <p
                    className="font-display text-[1.2rem] font-semibold leading-none"
                    style={{ color: "var(--forest-sage)" }}
                  >
                    {weekTotal % 1 === 0
                      ? weekTotal.toFixed(0)
                      : weekTotal.toFixed(1)}
                  </p>
                  <p className="font-mono text-[0.58rem] tracking-[0.08em] uppercase text-text-muted mt-1">
                    kg minggu ini
                  </p>
                </div>
              </div>
            </div>

            {/* Log list */}
            <div className="px-4 py-3">
              <button
                onClick={() => setLogsExpanded((p) => !p)}
                className="w-full flex items-center justify-between mb-3"
              >
                <p className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted">
                  Log terbaru
                </p>
                <span
                  className="font-mono text-[0.62rem] transition-colors"
                  style={{ color: "var(--coffee-latte)" }}
                >
                  {logsExpanded ? "Sembunyikan ↑" : "Lihat semua ↓"}
                </span>
              </button>

              <div className="flex flex-col gap-1.5">
                {(logsExpanded ? historyLogs : historyLogs.slice(0, 3)).map(
                  (log) => (
                    <LogEntry key={log.id} log={log} />
                  ),
                )}
              </div>

              {!logsExpanded && historyLogs.length > 3 && (
                <button
                  onClick={() => setLogsExpanded(true)}
                  className="w-full mt-2 py-2 rounded-md text-[0.72rem] font-mono transition-colors hover:text-text-primary"
                  style={{
                    color: "var(--coffee-latte)",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  + {historyLogs.length - 3} log lainnya
                </button>
              )}

              {historyLogs.length === 0 && (
                <p className="text-[0.75rem] text-text-muted text-center py-4 italic">
                  Belum ada riwayat pengambilan.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
