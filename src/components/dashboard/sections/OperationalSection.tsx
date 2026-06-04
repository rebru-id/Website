"use client";
// src/components/dashboard/sections/OperationalSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FASE 7 — Section Operasional
//
// 4 sub-tab:
//   1. Schedule   — week calendar (7 hari) + urgent queue panel
//   2. Monitor    — alert banner + summary row + collector status cards
//   3. Log        — stats row + bulk-select table + filter bar
//   4. Team       — collector management cards + performance bars
//
// Types: berbasis src/types/collector.ts
// Data : mock static — siap diganti Supabase query
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/utils";
import {
  todayWITA,
  getMondayWITA,
  toLocalTimeStr,
  formatDisplayDate,
  isTimeOverdue,
  addDays,
  diffDays,
  parseLocalDate,
  formatDate,
} from "@/utils/date";

import {
  fetchWeekRoutes,
  fetchTodayRoutes,
  fetchTodayStops,
  fetchCollectorStats,
  fetchActivePartners,
  createRouteWithStops,
  insertCollectorMember,
  fetchAllCollectors,
  updateCollectorStatus,
  deleteCollectorMember,
  fetchCollectorHistory7Days,
  type RouteWithCollector,
  type ActivePartner,
  type CollectorMember,
} from "@/lib/supabase-collector";

// ─────────────────────────────────────────────────────────────────────────────
// Local types
// ─────────────────────────────────────────────────────────────────────────────

type SubTab = "schedule" | "monitor" | "log" | "team";

type SlotStatus = "done" | "skip" | "active" | "pending" | "unassigned";
type CollectorStatus = "alert" | "late" | "ontrack" | "done";
type LogStatus = "done" | "skip" | "pending";

interface ScheduleSlot {
  time: string;
  partner: string;
  collectorInitials?: string;
  collectorColor: "green" | "amber" | null;
  status: SlotStatus;
  kg?: string;
}

interface DayColumn {
  dayName: string;
  date: number;
  isToday: boolean;
  slots: ScheduleSlot[];
}

interface CollectorMonitor {
  id: string;
  initials: string;
  name: string;
  area: string;
  truck: string;
  status: CollectorStatus;
  stopsDone: number;
  stopsTotal: number;
  estFinish: string;
  lastCheckin: string;
  noCheckinMinutes?: number;
  totalKg?: number;
}

interface LogEntry {
  id: string;
  partner: string;
  collector: string;
  time: string;
  condition: string;
  kg?: number;
  status: LogStatus;
  isSkipped?: boolean;
  skipReason?: string;
}

interface CollectorTeam {
  id: string;
  initials: string;
  name: string;
  area: string;
  activeSince: string;
  status: "online" | "warning";
  completionRate: number;
  stopsThisWeek: number;
  totalStopsThisWeek: number;
  kgPerStop: number;
  stopsToday: number;
  skipsToday: number;
  truck: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// (Mock data dihapus — data sekarang dari Supabase via props)

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — komponen badge unified untuk semua tab di OperationalSection
// Satu komponen ini menggantikan semua inline badge styling yang tersebar
// ─────────────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "done" // stop selesai — hijau
  | "skip" // stop dilewati — merah
  | "pending" // belum diproses — abu
  | "verified" // log terverifikasi admin — hijau
  | "alert" // collector tidak responsif — merah
  | "late" // collector terlambat — amber
  | "ontrack" // collector on schedule — teal
  | "overdue" // partner melewati jadwal pickup — merah
  | "due-today" // partner jatuh tempo hari ini — amber
  | "due-soon"; // partner jatuh tempo minggu ini — hijau

const BADGE_STYLES: Record<
  BadgeVariant,
  { bg: string; color: string; border: string; label: string; icon?: string }
> = {
  done: {
    bg: "rgba(45,90,46,0.12)",
    color: "var(--forest-sage)",
    border: "rgba(45,90,46,0.3)",
    label: "✓ Selesai",
  },
  skip: {
    bg: "rgba(248,113,113,0.08)",
    color: "#f87171",
    border: "rgba(248,113,113,0.2)",
    label: "✗ Skip",
  },
  pending: {
    bg: "rgba(120,120,120,0.08)",
    color: "var(--text-muted)",
    border: "var(--border-subtle)",
    label: "⏳ Pending",
  },
  verified: {
    bg: "rgba(45,90,46,0.12)",
    color: "var(--forest-sage)",
    border: "rgba(45,90,46,0.3)",
    label: "✓ Verified",
  },
  alert: {
    bg: "rgba(160,72,72,0.15)",
    color: "var(--color-error)",
    border: "rgba(160,72,72,0.4)",
    label: "No Check-in",
    icon: "fa-exclamation-circle",
  },
  late: {
    bg: "rgba(196,136,47,0.15)",
    color: "var(--coffee-latte)",
    border: "rgba(196,136,47,0.4)",
    label: "Terlambat",
    icon: "fa-clock",
  },
  ontrack: {
    bg: "rgba(45,90,46,0.12)",
    color: "var(--forest-sage)",
    border: "rgba(45,90,46,0.3)",
    label: "On Track",
    icon: "fa-check",
  },
  overdue: {
    bg: "rgba(248,113,113,0.08)",
    color: "#f87171",
    border: "rgba(248,113,113,0.2)",
    label: "Overdue",
    icon: "fa-exclamation-triangle",
  },
  "due-today": {
    bg: "rgba(196,136,47,0.1)",
    color: "var(--coffee-latte)",
    border: "rgba(196,136,47,0.3)",
    label: "Due today",
  },
  "due-soon": {
    bg: "rgba(45,90,46,0.08)",
    color: "var(--forest-sage)",
    border: "rgba(45,90,46,0.2)",
    label: "Due soon",
  },
};

function StatusBadge({
  variant,
  label,
  className = "",
}: {
  variant: BadgeVariant;
  label?: string; // override label default
  className?: string;
}) {
  const s = BADGE_STYLES[variant];
  const text = label ?? s.label;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${className}`}
      style={{
        background: s.bg,
        color: s.color,
        border: `0.5px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {s.icon && <i className={`fas ${s.icon} text-[8px]`} />}
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SubTabBar({
  active,
  onChange,
}: {
  active: SubTab;
  onChange: (t: SubTab) => void;
}) {
  const tabs: { id: SubTab; label: string }[] = [
    { id: "schedule", label: "Jadwal" },
    { id: "monitor", label: "Schedule Monitor" },
    { id: "log", label: "Log & Verifikasi" },
    { id: "team", label: "Tim Collector" },
  ];
  return (
    <div className="dash-stab-bar mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn("dash-stab", active === t.id && "active")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggest Schedule Modal — Fase 2
// Kalkulasi partner yang jatuh tempo + suggest collector berdasarkan area
// ─────────────────────────────────────────────────────────────────────────────

type SuggestRow = {
  partner: ActivePartner;
  dueDate: string;
  dueDateLabel: string;
  overdueDays: number;
  suggestedCollector: CollectorMember | null;
  suggestReason: string | null; // "area match (Rappocini)" atau "load ringan"
  assignedCollectorId: string;
  assignedDate: string;
  assignedTime: string;
  estimatedKg: string;
  confirmed: boolean;
};

function SuggestScheduleModal({
  onClose,
  collectors,
  weekStart,
  todayRoutes,
}: {
  onClose: () => void;
  collectors: CollectorMember[];
  weekStart: string;
  todayRoutes: RouteWithCollector[];
}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SuggestRow[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Hitung weekEnd (Minggu = weekStart + 6)
  const weekEnd = (() => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + 6);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  })();

  const weekLabel = (() => {
    const s = new Date(weekStart + "T00:00:00");
    const e = new Date(weekEnd + "T00:00:00");
    const fmt = (d: Date) => formatDisplayDate(formatDate(d), { short: true });
    return `${fmt(s)} – ${fmt(e)} ${e.getFullYear()}`;
  })();

  // Hitung due date berdasarkan last_pickup_date + interval
  function calcDueDate(p: ActivePartner): string {
    const base = p.last_pickup_date
      ? new Date(p.last_pickup_date + "T00:00:00")
      : new Date(weekStart + "T00:00:00"); // belum pernah → segera
    base.setDate(base.getDate() + (p.pickup_interval_days ?? 3));
    const yy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }

  function formatDueDateLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return formatDisplayDate(formatDate(d), { weekday: true, short: true });
  }

  function calcOverdueDays(dueDate: string): number {
    const today = todayWITA();
    const diff = Math.floor(
      (new Date(today + "T00:00:00").getTime() -
        new Date(dueDate + "T00:00:00").getTime()) /
        86_400_000,
    );
    return diff; // positif = overdue, negatif = belum jatuh tempo
  }

  // Suggest collector berdasarkan kecamatan match.
  // Hanya dipakai sebagai LABEL SARAN di dropdown — bukan auto-select.
  // Admin tetap harus memilih sendiri.
  function suggestCollector(
    p: ActivePartner,
  ): { collector: CollectorMember; reason: string } | null {
    if (collectors.length === 0) return null;
    const norm = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, "");
    const kec = p.kecamatan_nama ? norm(p.kecamatan_nama) : null;

    // Hitung stop hari ini per collector dari data real todayRoutes
    const stopCount = Object.fromEntries(
      collectors.map((c) => {
        const route = todayRoutes.find((r) => r.collector_id === c.id);
        return [c.id, route ? route.stops_total : 0];
      }),
    );

    // Prioritas 1: area match
    if (kec) {
      const byArea =
        collectors.find((c) => c.area && norm(c.area).includes(kec)) ??
        collectors.find((c) => c.area && kec.includes(norm(c.area ?? "")));
      if (byArea)
        return {
          collector: byArea,
          reason: `area match (${byArea.area ?? kec})`,
        };
    }

    // Prioritas 2: collector dengan stop paling sedikit hari ini (load ringan aktual)
    const leastLoaded = [...collectors].sort(
      (a, b) => (stopCount[a.id] ?? 0) - (stopCount[b.id] ?? 0),
    )[0];
    if (leastLoaded) {
      const count = stopCount[leastLoaded.id] ?? 0;
      return {
        collector: leastLoaded,
        reason:
          count === 0
            ? "load ringan (0 stop hari ini)"
            : `load ringan (${count} stop hari ini)`,
      };
    }

    return null;
  }

  // Parse volume_limbah → ambil angka maksimum.
  // Contoh: "1-5 kg/hari" → 5, "10 kg" → 10, "~3kg" → 3, kosong → ""
  function parseMaxKg(volumeLimbah: string | null): string {
    if (!volumeLimbah) return "";
    const nums = volumeLimbah.match(/\d+(\.\d+)?/g);
    if (!nums || nums.length === 0) return "";
    const max = Math.max(...nums.map(Number));
    return String(max);
  }

  // Load semua partner aktif + filter yang jatuh tempo minggu ini atau sudah lewat
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchActivePartners()
      .then((partners) => {
        const today = todayWITA();
        const filtered = partners
          .filter((p) => p.pickup_interval_days > 0) // skip kontributor (interval = 0)
          .map((p) => {
            const dueDate = calcDueDate(p);
            const overdue = calcOverdueDays(dueDate);
            return { p, dueDate, overdue };
          })
          .filter(
            ({ dueDate, overdue }) =>
              // tampilkan: sudah overdue ATAU jatuh tempo dalam minggu yang dipilih
              overdue >= 0 || (dueDate >= weekStart && dueDate <= weekEnd),
          )
          .sort((a, b) => b.overdue - a.overdue) // overdue terbesar duluan
          .map(({ p, dueDate, overdue }): SuggestRow => {
            const suggestion = suggestCollector(p);
            return {
              partner: p,
              dueDate,
              dueDateLabel: formatDueDateLabel(dueDate),
              overdueDays: overdue,
              suggestedCollector: suggestion?.collector ?? null,
              suggestReason: suggestion?.reason ?? null,
              assignedCollectorId: "",
              assignedDate: overdue >= 0 ? today : dueDate,
              assignedTime: "08:00",
              estimatedKg: parseMaxKg(p.volume_limbah),
              confirmed: false,
            };
          });

        setRows(filtered);
      })
      .catch((err) => setError(err?.message ?? "Gagal memuat data partner"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  function updateRow(partnerId: string, patch: Partial<SuggestRow>) {
    setRows((prev) =>
      prev.map((r) => (r.partner.id === partnerId ? { ...r, ...patch } : r)),
    );
  }

  async function confirmRow(row: SuggestRow) {
    if (!row.assignedCollectorId) return;
    setSaving((s) => ({ ...s, [row.partner.id]: true }));
    try {
      await createRouteWithStops({
        collector_id: row.assignedCollectorId,
        route_date: row.assignedDate,
        stops: [
          {
            partner_id: row.partner.id,
            stop_order: 1,
            scheduled_time: row.assignedTime,
            estimated_kg: row.estimatedKg ? Number(row.estimatedKg) : null,
          },
        ],
      });
      setSaved((s) => ({ ...s, [row.partner.id]: true }));
      updateRow(row.partner.id, { confirmed: true });
    } catch (err: any) {
      alert(`Gagal membuat jadwal: ${err?.message ?? "coba lagi"}`);
    } finally {
      setSaving((s) => ({ ...s, [row.partner.id]: false }));
    }
  }

  const pending = rows.filter((r) => !r.confirmed);
  const confirmed = rows.filter((r) => r.confirmed);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-[51] flex flex-col"
        style={{
          width: "min(640px, 100vw)",
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-default)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
        >
          <div>
            <h3 className="dash-section-title mb-1">Suggest Jadwal Otomatis</h3>
            <p
              className="text-[11px]"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {weekLabel} · Partner yang jatuh tempo atau sudah overdue
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
            style={{
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div
              className="flex items-center justify-center gap-2 py-16"
              style={{ color: "var(--text-muted)" }}
            >
              <i className="fas fa-circle-notch fa-spin" />
              <span className="text-xs">Menghitung jadwal...</span>
            </div>
          )}

          {error && (
            <div
              className="px-4 py-3 rounded-lg mb-4 text-xs"
              style={{
                background: "rgba(248,113,113,0.08)",
                color: "#f87171",
                border: "0.5px solid rgba(248,113,113,0.2)",
              }}
            >
              <i className="fas fa-exclamation-circle mr-1.5" />
              {error}
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="py-16 text-center">
              <i
                className="fas fa-calendar-check text-3xl mb-3 block"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="font-medium text-sm mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Semua partner sudah terjadwal
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Tidak ada partner yang jatuh tempo atau overdue di minggu ini.
              </p>
            </div>
          )}

          {/* ── Daftar partner pending ── */}
          {pending.length > 0 && (
            <div className="mb-6">
              <p
                className="text-[10px] uppercase tracking-wider mb-3"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                Perlu dijadwalkan ({pending.length})
              </p>
              <div className="flex flex-col gap-3">
                {pending.map((row) => (
                  <div
                    key={row.partner.id}
                    className="rounded-lg p-4"
                    style={{
                      background: "var(--bg-card)",
                      border: `0.5px solid ${row.overdueDays > 0 ? "rgba(248,113,113,0.3)" : "var(--border-subtle)"}`,
                    }}
                  >
                    {/* Info partner */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {row.partner.organization}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {row.partner.jenis_usaha} ·{" "}
                          {row.partner.kecamatan_nama ?? "—"}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Interval: setiap {row.partner.pickup_interval_days}{" "}
                          hari ·{" "}
                          {row.partner.last_pickup_date
                            ? `Terakhir: ${formatDisplayDate(row.partner.last_pickup_date!, { short: true })}`
                            : "Belum pernah dijemput"}
                        </p>
                      </div>
                      {/* Badge due/overdue */}
                      <StatusBadge
                        variant={
                          row.overdueDays > 0
                            ? "overdue"
                            : row.overdueDays === 0
                              ? "due-today"
                              : "due-soon"
                        }
                        label={
                          row.overdueDays > 0
                            ? `⚠ Overdue ${row.overdueDays}d`
                            : row.overdueDays === 0
                              ? "Due today"
                              : `Due: ${row.dueDateLabel}`
                        }
                      />
                    </div>

                    {/* Form assign */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Collector */}
                      <div>
                        <label
                          className="block text-[10px] uppercase tracking-wider mb-1"
                          style={{
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-space-mono)",
                          }}
                        >
                          Collector
                        </label>
                        {row.suggestedCollector && row.suggestReason && (
                          <p
                            className="text-[10px] mb-1 flex items-center gap-1"
                            style={{ color: "var(--forest-sage)" }}
                          >
                            <span>★ Saran:</span>
                            <span className="font-medium">
                              {row.suggestedCollector.name?.split(" ")[0]}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded-full text-[9px]"
                              style={{
                                background: row.suggestReason.includes("area")
                                  ? "rgba(45,90,46,0.12)"
                                  : "rgba(196,136,47,0.12)",
                                color: row.suggestReason.includes("area")
                                  ? "var(--forest-sage)"
                                  : "var(--coffee-latte)",
                                border: `0.5px solid ${row.suggestReason.includes("area") ? "rgba(45,90,46,0.3)" : "rgba(196,136,47,0.3)"}`,
                              }}
                            >
                              {row.suggestReason}
                            </span>
                          </p>
                        )}
                        <select
                          value={row.assignedCollectorId}
                          onChange={(e) =>
                            updateRow(row.partner.id, {
                              assignedCollectorId: e.target.value,
                            })
                          }
                          className="dash-search-input w-full text-[11px]"
                          style={{ background: "var(--bg-elevated)" }}
                        >
                          <option value="">— Pilih collector —</option>
                          {collectors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                              {c.area ? ` · ${c.area}` : ""}
                              {row.suggestedCollector?.id === c.id ? " ★" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tanggal */}
                      <div>
                        <label
                          className="block text-[10px] uppercase tracking-wider mb-1"
                          style={{
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-space-mono)",
                          }}
                        >
                          Tanggal
                        </label>
                        <input
                          type="date"
                          value={row.assignedDate}
                          onChange={(e) =>
                            updateRow(row.partner.id, {
                              assignedDate: e.target.value,
                            })
                          }
                          className="dash-search-input w-full text-[11px]"
                        />
                      </div>

                      {/* Jam */}
                      <div>
                        <label
                          className="block text-[10px] uppercase tracking-wider mb-1"
                          style={{
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-space-mono)",
                          }}
                        >
                          Jam pickup
                        </label>
                        <input
                          type="time"
                          value={row.assignedTime}
                          onChange={(e) =>
                            updateRow(row.partner.id, {
                              assignedTime: e.target.value,
                            })
                          }
                          className="dash-search-input w-full text-[11px]"
                        />
                      </div>

                      {/* Est. kg */}
                      <div>
                        <label
                          className="block text-[10px] uppercase tracking-wider mb-1"
                          style={{
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-space-mono)",
                          }}
                        >
                          Est. kg
                        </label>
                        <input
                          type="number"
                          value={row.estimatedKg}
                          onChange={(e) =>
                            updateRow(row.partner.id, {
                              estimatedKg: e.target.value,
                            })
                          }
                          placeholder="cth. 10"
                          className="dash-search-input w-full text-[11px]"
                        />
                      </div>
                    </div>

                    {/* Tombol confirm */}
                    <button
                      onClick={() => confirmRow(row)}
                      disabled={
                        !row.assignedCollectorId || saving[row.partner.id]
                      }
                      className="w-full py-2 rounded text-[11px] font-medium transition-all"
                      style={{
                        background: row.assignedCollectorId
                          ? "var(--coffee-latte)"
                          : "var(--bg-elevated)",
                        color: row.assignedCollectorId
                          ? "var(--bg-primary)"
                          : "var(--text-muted)",
                        border: "none",
                        opacity: saving[row.partner.id] ? 0.7 : 1,
                        cursor: !row.assignedCollectorId
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      {saving[row.partner.id] ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin mr-1.5" />
                          Membuat jadwal...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check mr-1.5" />
                          Konfirmasi & buat jadwal
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Daftar yang sudah dikonfirmasi ── */}
          {confirmed.length > 0 && (
            <div>
              <p
                className="text-[10px] uppercase tracking-wider mb-3"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                Sudah dijadwalkan ({confirmed.length})
              </p>
              <div className="flex flex-col gap-2">
                {confirmed.map((row) => (
                  <div
                    key={row.partner.id}
                    className="rounded-lg px-4 py-3 flex items-center gap-3"
                    style={{
                      background: "rgba(45,90,46,0.06)",
                      border: "0.5px solid rgba(45,90,46,0.2)",
                    }}
                  >
                    <i
                      className="fas fa-check-circle text-sm flex-shrink-0"
                      style={{ color: "var(--forest-sage)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {row.partner.organization}
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatDisplayDate(row.assignedDate, {
                          weekday: true,
                          short: true,
                        })}
                        {" · "}
                        {row.assignedTime}
                        {" · "}
                        {collectors.find(
                          (c) => c.id === row.assignedCollectorId,
                        )?.name ?? "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: "0.5px solid var(--border-subtle)" }}
        >
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {pending.length > 0
              ? `${pending.length} partner belum dijadwalkan`
              : "Semua partner sudah dijadwalkan ✓"}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "0.5px solid var(--border-subtle)",
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Schedule (Week Calendar + Urgent Queue)
// ─────────────────────────────────────────────────────────────────────────────

function ScheduleTab({
  weekRoutes,
  weekLabel,
  weekOffset,
  weekStart,
  onWeekChange,
  onRefreshWeek,
  todayRoutes,
}: {
  weekRoutes: RouteWithCollector[];
  weekLabel: string;
  weekOffset: number;
  weekStart: string;
  onWeekChange: (delta: -1 | 1 | 0) => void;
  onRefreshWeek: () => void;
  todayRoutes: RouteWithCollector[];
}) {
  const [showSuggest, setShowSuggest] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activePartners, setActivePartners] = useState<ActivePartner[]>([]);
  const [collectors, setCollectors] = useState<CollectorMember[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayWITA());
  const [selectedCollector, setSelectedCollector] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [estimatedKg, setEstimatedKg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load collectors saat ScheduleTab pertama mount — bukan saat modal dibuka.
  // Ini agar dropdown collector langsung siap di Generate otomatis maupun Slot manual.
  useEffect(() => {
    fetchAllCollectors()
      .then((cols) => setCollectors(cols))
      .catch((err) =>
        console.error("[ScheduleTab] fetchAllCollectors:", err?.message),
      );
  }, []);

  // Load activePartners saat mount — dibutuhkan Urgent Queue dan modal Slot Manual.
  // Sebelumnya hanya di-fetch saat showModal, sehingga Urgent Queue selalu kosong.
  useEffect(() => {
    fetchActivePartners()
      .then(setActivePartners)
      .catch((err) =>
        console.error("[ScheduleTab] fetchActivePartners:", err?.message),
      );
  }, []);

  // Refresh activePartners saat modal Slot Manual ditutup (setelah add stop)
  // agar last_pickup_date yang baru terupdate terefleksi di Urgent Queue
  useEffect(() => {
    if (showModal) return;
    fetchActivePartners()
      .then(setActivePartners)
      .catch(() => {});
  }, [showModal]);

  async function handleAddStop() {
    if (!selectedPartner || !selectedCollector) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createRouteWithStops({
        collector_id: selectedCollector,
        route_date: selectedDate,
        stops: [
          {
            partner_id: selectedPartner,
            stop_order: 1,
            scheduled_time: scheduledTime,
            estimated_kg: estimatedKg ? Number(estimatedKg) : null,
          },
        ],
      });
      setShowModal(false);
      setSelectedPartner("");
      setSelectedCollector("");
      setEstimatedKg("");
    } catch (err: any) {
      const msg = err?.message ?? JSON.stringify(err);
      console.error("Gagal tambah stop:", msg);
      setSaveError(msg || "Terjadi kesalahan, coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  // Konversi RouteWithCollector[] → DayColumn[] untuk calendar UI
  // Selalu 7 hari (Sen–Min), hari tanpa rute tetap tampil kosong
  const today = todayWITA();

  // Group semua routes per tanggal (bisa >1 collector di hari sama)
  const routesByDate: Record<string, RouteWithCollector[]> = {};
  for (const r of weekRoutes) {
    if (!routesByDate[r.route_date]) routesByDate[r.route_date] = [];
    routesByDate[r.route_date].push(r);
  }

  const WEEK_DATA: DayColumn[] = Array.from({ length: 7 }, (_, i) => {
    // Hitung tanggal dari weekStart (sudah Senin) + i hari
    const d = new Date(weekStart + "T00:00:00"); // force local midnight
    d.setDate(d.getDate() + i);

    // Gunakan format lokal (bukan toISOString) untuk hindari UTC shift di WIB
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yy}-${mm}-${dd}`;

    const dayRoutes = routesByDate[dateStr] ?? [];

    // Flatten semua stops dari semua routes di hari ini, lalu sort by time
    const slots = dayRoutes
      .flatMap((r) =>
        (r.stops ?? []).map((s) => ({
          time: s.scheduled_time ?? "—",
          partner: s.partner?.organization ?? "—",
          collectorInitials: r.collector?.initials ?? undefined,
          collectorColor: "green" as const,
          status: (s.status === "skipped" ? "skip" : s.status) as SlotStatus,
          kg: s.actual_kg
            ? `${s.actual_kg} kg`
            : s.estimated_kg
              ? `~${s.estimated_kg} kg`
              : undefined,
        })),
      )
      .sort((a, b) => a.time.localeCompare(b.time));

    return {
      dayName: formatDisplayDate(formatDate(d), { weekday: true })
        .split(",")[0]
        .toUpperCase(),
      date: d.getDate(),
      isToday: dateStr === today,
      slots,
    };
  });

  const SLOT_STYLES: Record<
    SlotStatus,
    { border: string; bg: string; timeColor: string }
  > = {
    done: {
      border: "rgba(45,90,46,0.3)",
      bg: "rgba(45,90,46,0.07)",
      timeColor: "var(--forest-sage)",
    },
    skip: {
      border: "rgba(248,113,113,0.25)",
      bg: "rgba(248,113,113,0.05)",
      timeColor: "var(--color-error)",
    },
    active: {
      border: "rgba(196,136,47,0.5)",
      bg: "rgba(196,136,47,0.1)",
      timeColor: "var(--coffee-latte)",
    },
    pending: {
      border: "var(--border-subtle)",
      bg: "var(--bg-card)",
      timeColor: "var(--text-secondary)",
    },
    unassigned: {
      border: "rgba(255,255,255,0.08)",
      bg: "rgba(255,255,255,0.02)",
      timeColor: "var(--text-muted)",
    },
  };

  const CHIP_STYLE: Record<
    "green" | "amber",
    { bg: string; color: string; border: string }
  > = {
    green: {
      bg: "rgba(45,90,46,0.2)",
      color: "var(--forest-sage)",
      border: "rgba(45,90,46,0.4)",
    },
    amber: {
      bg: "rgba(196,136,47,0.15)",
      color: "var(--coffee-latte)",
      border: "rgba(196,136,47,0.4)",
    },
  };

  return (
    <div>
      {/* Week controls */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className="w-6 h-6 rounded flex items-center justify-center transition-all"
          style={{
            border: "0.5px solid var(--border-subtle)",
            background: "var(--bg-card)",
            color: "var(--text-muted)",
          }}
          onClick={() => onWeekChange(-1)}
        >
          <i className="fas fa-chevron-left text-[9px]" />
        </button>
        <span
          className="text-xs font-medium"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-space-mono)",
          }}
        >
          {weekLabel}
        </span>
        <button
          className="w-6 h-6 rounded flex items-center justify-center transition-all"
          style={{
            border: "0.5px solid var(--border-subtle)",
            background: "var(--bg-card)",
            color: "var(--text-muted)",
          }}
          onClick={() => onWeekChange(1)}
        >
          <i className="fas fa-chevron-right text-[9px]" />
        </button>
        {weekOffset !== 0 && (
          <button
            className="text-[10px] underline"
            style={{ color: "var(--coffee-latte)" }}
            onClick={() => onWeekChange(0)}
          >
            Kembali ke minggu ini
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-all"
            style={{
              border: "0.5px solid var(--border-subtle)",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.borderColor = "var(--border-strong)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
            onClick={() => setShowSuggest(true)}
          >
            <i className="fas fa-magic text-[9px]" /> Generate otomatis
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-all"
            style={{
              background: "var(--coffee-latte)",
              color: "var(--bg-primary)",
              border: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus text-[9px]" /> Slot manual
          </button>
        </div>
      </div>

      {/* Modal Suggest Jadwal Otomatis */}
      {showSuggest && (
        <SuggestScheduleModal
          onClose={() => {
            setShowSuggest(false);
            onRefreshWeek();
          }}
          collectors={collectors}
          weekStart={weekStart}
          todayRoutes={todayRoutes}
        />
      )}

      {/* Modal Tambah Stop */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-lg p-8"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="dash-section-title">Tambah Stop Baru</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{
                  border: "0.5px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                <i className="fas fa-times text-xs" />
              </button>
            </div>

            {/* Tanggal */}
            <label
              className="block text-[0.72rem] tracking-[0.1em] uppercase mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Tanggal
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="dash-search-input w-full mb-4"
            />

            {/* Collector */}
            <label
              className="block text-[0.72rem] tracking-[0.1em] uppercase mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Collector
              <span
                className="ml-1 text-[0.65rem] normal-case"
                style={{ color: "var(--forest-sage)" }}
              >
                ({collectors.length} aktif)
              </span>
            </label>
            <select
              value={selectedCollector}
              onChange={(e) => setSelectedCollector(e.target.value)}
              className="dash-search-input w-full mb-4"
              style={{ background: "var(--bg-card)" }}
            >
              <option value="">Pilih collector...</option>
              {collectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.area ? ` · ${c.area}` : ""}
                  {c.truck_plate ? ` (${c.truck_plate})` : ""}
                </option>
              ))}
            </select>

            {/* Mitra */}
            <label
              className="block text-[0.72rem] tracking-[0.1em] uppercase mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Mitra Aktif
              <span
                className="ml-1 text-[0.65rem] normal-case"
                style={{ color: "var(--forest-sage)" }}
              >
                ({activePartners.length} tersedia)
              </span>
            </label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="dash-search-input w-full mb-2"
              style={{ background: "var(--bg-card)" }}
            >
              <option value="">Pilih mitra...</option>
              {activePartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.organization}
                  {p.kecamatan_nama ? ` · ${p.kecamatan_nama}` : ""}
                  {p.jenis_usaha ? ` (${p.jenis_usaha})` : ""}
                </option>
              ))}
            </select>
            {selectedPartner &&
              (() => {
                const p = activePartners.find((x) => x.id === selectedPartner);
                return p?.volume_limbah ? (
                  <p
                    className="text-[0.7rem] mb-3"
                    style={{ color: "var(--forest-sage)" }}
                  >
                    ↑ Estimasi dari profil: {p.volume_limbah}
                  </p>
                ) : (
                  <div className="mb-3" />
                );
              })()}

            {/* Jam + Estimasi kg */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label
                  className="block text-[0.72rem] tracking-[0.1em] uppercase mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Jam
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="dash-search-input w-full"
                />
              </div>
              <div>
                <label
                  className="block text-[0.72rem] tracking-[0.1em] uppercase mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Est. kg
                </label>
                <input
                  type="number"
                  value={estimatedKg}
                  onChange={(e) => setEstimatedKg(e.target.value)}
                  placeholder="cth. 12"
                  className="dash-search-input w-full"
                />
              </div>
            </div>

            {/* Error display */}
            {saveError && (
              <div
                className="mb-4 px-3 py-2 rounded text-[0.72rem]"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "0.5px solid rgba(248,113,113,0.3)",
                  color: "#f87171",
                }}
              >
                <i className="fas fa-exclamation-circle mr-1.5" />
                {saveError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded text-sm"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleAddStop}
                disabled={!selectedPartner || !selectedCollector || saving}
                className="flex-1 py-2.5 rounded text-sm font-medium"
                style={{
                  background:
                    selectedPartner && selectedCollector
                      ? "var(--coffee-latte)"
                      : "var(--bg-elevated)",
                  color:
                    selectedPartner && selectedCollector
                      ? "var(--bg-primary)"
                      : "var(--text-muted)",
                  border: "none",
                  opacity: saving ? 0.7 : 1,
                  cursor:
                    !selectedPartner || !selectedCollector
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {saving ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Tambah Stop"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar + urgent queue wrapper */}
      <div className="flex gap-3" style={{ alignItems: "flex-start" }}>
        {/* Week calendar */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="grid gap-2 min-w-0"
            style={{ gridTemplateColumns: "repeat(7, minmax(120px, 1fr))" }}
          >
            {WEEK_DATA.map((day) => (
              <div key={day.date}>
                {/* Day header */}
                <div
                  className="flex flex-col items-center py-2 mb-2 rounded-md"
                  style={{
                    background: day.isToday
                      ? "rgba(196,136,47,0.08)"
                      : "var(--bg-card)",
                    border: `0.5px solid ${day.isToday ? "rgba(196,136,47,0.3)" : "var(--border-subtle)"}`,
                  }}
                >
                  <span
                    className="text-[9px] tracking-widest uppercase"
                    style={{
                      color: day.isToday
                        ? "var(--coffee-latte)"
                        : "var(--text-muted)",
                      fontFamily: "var(--font-space-mono)",
                    }}
                  >
                    {day.dayName}
                  </span>
                  <span
                    className="font-semibold text-sm leading-none"
                    style={{
                      color: day.isToday
                        ? "var(--coffee-latte)"
                        : "var(--text-primary)",
                    }}
                  >
                    {day.date}
                  </span>
                  <span
                    className="text-[9px] mt-0.5"
                    style={{
                      color: day.isToday
                        ? "var(--coffee-latte)"
                        : "var(--text-muted)",
                    }}
                  >
                    {day.slots.length > 0 ? `${day.slots.length} slot` : "–"}
                  </span>
                </div>

                {/* Slots */}
                <div className="flex flex-col gap-1.5">
                  {day.slots.length === 0 && (
                    <div
                      className="text-center text-[10px] py-4 rounded"
                      style={{
                        color: "var(--text-muted)",
                        border: "0.5px dashed var(--border-subtle)",
                      }}
                    >
                      Tidak ada jadwal
                    </div>
                  )}
                  {day.slots.map((slot, i) => {
                    const s = SLOT_STYLES[slot.status];
                    return (
                      <div
                        key={i}
                        className="rounded-md px-2.5 py-2"
                        style={{
                          background: s.bg,
                          border: `0.5px solid ${s.border}`,
                        }}
                      >
                        <p
                          className="text-[10px] font-medium mb-0.5"
                          style={{ color: s.timeColor }}
                        >
                          {slot.time}
                          {slot.status === "active" ? " ▶" : ""}
                        </p>
                        <p
                          className="text-[11px] leading-tight mb-1.5"
                          style={{
                            color:
                              slot.status === "unassigned"
                                ? "var(--text-muted)"
                                : "var(--text-primary)",
                          }}
                        >
                          {slot.partner}
                        </p>
                        <div className="flex items-center justify-between">
                          {slot.collectorInitials && slot.collectorColor ? (
                            <span
                              className="text-[9px] px-1.5 py-px rounded font-medium"
                              style={{
                                background: CHIP_STYLE[slot.collectorColor].bg,
                                color: CHIP_STYLE[slot.collectorColor].color,
                                border: `0.5px solid ${CHIP_STYLE[slot.collectorColor].border}`,
                              }}
                            >
                              {slot.collectorInitials}
                            </span>
                          ) : (
                            <span
                              className="text-[9px] px-1.5 py-px rounded cursor-pointer"
                              style={{
                                background: "rgba(196,136,47,0.1)",
                                color: "var(--coffee-latte)",
                                border: "0.5px solid rgba(196,136,47,0.3)",
                              }}
                            >
                              Assign →
                            </span>
                          )}
                          {slot.kg && (
                            <span
                              className="text-[9px]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {slot.kg}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent queue panel — live data */}
        {(() => {
          const todayStr = todayWITA();
          const todayMs = parseLocalDate(todayStr).getTime();

          // Hitung due date per partner:
          // - Sudah pernah dijemput: last_pickup_date + interval
          // - Belum pernah dijemput: active_from + interval (jika active_from ada)
          // - Tidak ada referensi tanggal sama sekali: skip (tidak cukup data)
          const urgentPartners = activePartners
            .filter((p) => p.pickup_interval_days > 0)
            .filter((p) => {
              const baseDate = p.last_pickup_date ?? p.active_from ?? null;
              if (!baseDate) return false;
              const dueMs = parseLocalDate(
                addDays(baseDate.slice(0, 10), p.pickup_interval_days),
              ).getTime();
              return dueMs < todayMs; // due date sudah lewat
            })
            .sort((a, b) => {
              // Sort: paling lama overdue duluan
              const getDueMs = (p: typeof a) => {
                const base = p.last_pickup_date ?? p.active_from ?? todayStr;
                return parseLocalDate(
                  addDays(base.slice(0, 10), p.pickup_interval_days),
                ).getTime();
              };
              return getDueMs(a) - getDueMs(b);
            });

          if (urgentPartners.length === 0 && collectors.length === 0)
            return null;

          return (
            <div
              className="flex-shrink-0 rounded-lg"
              style={{
                width: "190px",
                background: "var(--bg-card)",
                border: "0.5px solid var(--border-subtle)",
                padding: "12px",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color:
                      urgentPartners.length > 0
                        ? "var(--color-error)"
                        : "var(--text-muted)",
                  }}
                >
                  <i
                    className={`fas ${urgentPartners.length > 0 ? "fa-exclamation-triangle" : "fa-check-circle"} text-[9px] mr-1`}
                  />
                  Urgent
                </span>
                {urgentPartners.length > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-px rounded-full"
                    style={{
                      background: "rgba(160,72,72,0.15)",
                      color: "var(--color-error)",
                      border: "0.5px solid rgba(160,72,72,0.4)",
                    }}
                  >
                    {urgentPartners.length}
                  </span>
                )}
              </div>

              {urgentPartners.length === 0 && (
                <div className="py-4 text-center mb-3">
                  <i
                    className="fas fa-calendar-check text-lg mb-1 block"
                    style={{ color: "var(--forest-sage)" }}
                  />
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Semua partner on schedule
                  </p>
                </div>
              )}

              {urgentPartners.slice(0, 3).map((p) => {
                const base = p.last_pickup_date ?? p.active_from ?? todayStr;
                const dueDateStr = addDays(
                  base.slice(0, 10),
                  p.pickup_interval_days,
                );
                const overdueDays = diffDays(todayStr, dueDateStr);
                return (
                  <div
                    key={p.id}
                    className="mb-3 pb-3"
                    style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
                  >
                    <p
                      className="font-medium text-[11px] mb-0.5 truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {p.organization}
                    </p>
                    <p
                      className="text-[10px] mb-0.5 truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {p.jenis_usaha} · {p.kecamatan_nama ?? "—"}
                    </p>
                    <p
                      className="text-[10px] font-medium mb-2"
                      style={{ color: "var(--color-error)" }}
                    >
                      Overdue {overdueDays}d
                    </p>
                    <button
                      className="w-full py-1.5 rounded text-[10px] transition-all"
                      style={{
                        background: "rgba(160,72,72,0.1)",
                        color: "var(--color-error)",
                        border: "0.5px solid rgba(160,72,72,0.35)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(160,72,72,0.18)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(160,72,72,0.1)")
                      }
                      onClick={() => {
                        setSelectedPartner(p.id);
                        setSelectedDate(todayWITA());
                        setShowModal(true);
                      }}
                    >
                      Assign Pickup →
                    </button>
                  </div>
                );
              })}

              {collectors.length > 0 && (
                <div>
                  <p
                    className="text-[9px] uppercase tracking-wider mb-2"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-space-mono)",
                    }}
                  >
                    Collector tersedia
                  </p>
                  {collectors.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 mb-2 text-[11px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span
                        className="text-[9px] px-1.5 py-px rounded font-medium"
                        style={{
                          background: "rgba(45,90,46,0.2)",
                          color: "var(--forest-sage)",
                          border: "0.5px solid rgba(45,90,46,0.4)",
                        }}
                      >
                        {c.initials ?? c.name?.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate">
                        {c.name?.split(" ")[0]} · {c.area ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Schedule Monitor
// ─────────────────────────────────────────────────────────────────────────────

function MonitorTab({ todayRoutes }: { todayRoutes: RouteWithCollector[] }) {
  // Konversi RouteWithCollector[] → CollectorMonitor[] untuk UI
  const COLLECTORS_MONITOR: CollectorMonitor[] = todayRoutes.map((r) => {
    const lastDone = r.stops
      .filter((s) => s.completed_at)
      .sort((a, b) =>
        (b.completed_at ?? "").localeCompare(a.completed_at ?? ""),
      )[0];
    const minsAgo = lastDone?.completed_at
      ? Math.floor(
          (Date.now() - new Date(lastDone.completed_at).getTime()) / 60_000,
        )
      : 0;
    const lastCheckin = lastDone?.completed_at
      ? toLocalTimeStr(lastDone.completed_at)
      : "—";
    let status: CollectorStatus = "ontrack";
    if (r.stops_done === r.stops_total && r.stops_total > 0) status = "done";
    else if (minsAgo > 75) status = "alert";
    else if (
      r.stops.some(
        (s) => s.status === "pending" && isTimeOverdue(s.scheduled_time),
      )
    )
      status = "late";
    const pending = r.stops.filter((s) => s.status === "pending");
    const estFinish =
      pending.length === 0
        ? "Selesai"
        : pending[pending.length - 1].scheduled_time
          ? (pending[pending.length - 1].scheduled_time ?? "—")
          : "—";
    return {
      id: r.id,
      initials: r.collector?.initials ?? "??",
      name: r.collector?.name ?? "—",
      area: r.collector?.area ?? "—",
      truck: r.collector?.truck_plate ?? "—",
      status,
      stopsDone: r.stops_done,
      stopsTotal: r.stops_total,
      estFinish,
      lastCheckin,
      noCheckinMinutes: minsAgo,
      totalKg: r.total_actual_kg,
    };
  });

  const STATUS_STYLE: Record<
    CollectorStatus,
    {
      tag: string;
      tagBg: string;
      tagBorder: string;
      avatarBg: string;
      avatarColor: string;
      avatarBorder: string;
      cardBorder: string;
      progressColor: string;
    }
  > = {
    alert: {
      tag: "No Check-in",
      tagBg: "rgba(160,72,72,0.15)",
      tagBorder: "rgba(160,72,72,0.4)",
      tagColor: "var(--color-error)",
      avatarBg: "rgba(160,72,72,0.15)",
      avatarColor: "var(--color-error)",
      avatarBorder: "var(--color-error)",
      cardBorder: "rgba(160,72,72,0.35)",
      progressColor: "var(--color-error)",
    } as any,
    late: {
      tag: "Terlambat",
      tagBg: "rgba(196,136,47,0.15)",
      tagBorder: "rgba(196,136,47,0.4)",
      tagColor: "var(--coffee-latte)",
      avatarBg: "rgba(196,136,47,0.15)",
      avatarColor: "var(--coffee-latte)",
      avatarBorder: "var(--coffee-latte)",
      cardBorder: "rgba(196,136,47,0.3)",
      progressColor: "var(--coffee-latte)",
    } as any,
    ontrack: {
      tag: "On Track",
      tagBg: "var(--teal-bg)",
      tagBorder: "var(--teal-border)",
      tagColor: "var(--teal)",
      avatarBg: "var(--teal-bg)",
      avatarColor: "var(--teal)",
      avatarBorder: "var(--teal)",
      cardBorder: "var(--border-subtle)",
      progressColor: "var(--teal)",
    } as any,
    done: {
      tag: "Selesai",
      tagBg: "rgba(45,90,46,0.15)",
      tagBorder: "rgba(45,90,46,0.3)",
      tagColor: "var(--forest-sage)",
      avatarBg: "rgba(45,90,46,0.15)",
      avatarColor: "var(--forest-sage)",
      avatarBorder: "var(--forest-sage)",
      cardBorder: "var(--border-subtle)",
      progressColor: "var(--forest-sage)",
    } as any,
  };

  // Urutan prioritas: alert (paling kritis) → late → ontrack → done
  // Collector bermasalah selalu muncul di atas tanpa admin harus scroll
  const STATUS_SORT_ORDER: Record<CollectorStatus, number> = {
    alert: 0,
    late: 1,
    ontrack: 2,
    done: 3,
  };

  const SORTED_MONITOR = [...COLLECTORS_MONITOR].sort(
    (a, b) => STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status],
  );

  const summary = [
    {
      label: "Selesai",
      value: COLLECTORS_MONITOR.filter((c) => c.status === "done").length,
      color: "var(--forest-sage)",
    },
    {
      label: "On Track",
      value: COLLECTORS_MONITOR.filter((c) => c.status === "ontrack").length,
      color: "var(--teal)",
    },
    {
      label: "Terlambat",
      value: COLLECTORS_MONITOR.filter((c) => c.status === "late").length,
      color: "var(--coffee-latte)",
    },
    {
      label: "No Check-in",
      value: COLLECTORS_MONITOR.filter((c) => c.status === "alert").length,
      color: "var(--color-error)",
    },
  ];

  const alertCollector = COLLECTORS_MONITOR.find((c) => c.status === "alert");

  return (
    <div>
      {/* Alert banner */}
      {alertCollector && (
        <div
          className="flex items-center gap-3 rounded-lg mb-4 px-4 py-3"
          style={{
            background: "rgba(160,72,72,0.08)",
            border: "0.5px solid rgba(160,72,72,0.35)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: "var(--color-error)" }}
          />
          <p
            className="flex-1 text-xs"
            style={{ color: "var(--text-primary)" }}
          >
            <strong>{alertCollector.name}</strong> tidak ada check-in selama{" "}
            <strong>{alertCollector.noCheckinMinutes} menit</strong> — Stop{" "}
            {alertCollector.stopsDone}/{alertCollector.stopsTotal}, Area{" "}
            {alertCollector.area}
          </p>
          <button
            className="flex-shrink-0 px-3 py-1.5 rounded text-[10px] transition-all"
            style={{
              background: "rgba(160,72,72,0.15)",
              color: "var(--color-error)",
              border: "0.5px solid rgba(160,72,72,0.4)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(160,72,72,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(160,72,72,0.15)")
            }
          >
            Hubungi →
          </button>
        </div>
      )}

      {/* Summary row */}
      <div
        className="grid gap-2 mb-4"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {summary.map((s) => (
          <div
            key={s.label}
            className="rounded-lg text-center"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "12px",
            }}
          >
            <p
              className="text-[10px] mb-1"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {s.label}
            </p>
            <p
              className="text-[20px] font-semibold leading-none"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Collector cards grid */}
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {SORTED_MONITOR.map((c) => {
          const s = STATUS_STYLE[c.status] as any;
          const pct = Math.round((c.stopsDone / c.stopsTotal) * 100);
          const isUrgent = c.status === "alert" || c.status === "late";
          return (
            <div
              key={c.id}
              className="rounded-lg transition-all"
              style={{
                background: isUrgent
                  ? c.status === "alert"
                    ? "rgba(160,72,72,0.04)"
                    : "rgba(196,136,47,0.04)"
                  : "var(--bg-card)",
                border: isUrgent
                  ? `1.5px solid ${s.cardBorder}` // border lebih tebal untuk urgent
                  : `0.5px solid ${s.cardBorder}`,
                padding: "13px 14px",
                position: "relative",
              }}
            >
              {/* Pulse dot — hanya untuk alert dan late */}
              {isUrgent && (
                <div
                  className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: s.cardBorder }}
                />
              )}

              {/* Header */}
              <div className="flex items-start gap-2.5 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: s.avatarBg,
                    color: s.avatarColor,
                    border: `0.5px solid ${s.avatarBorder}`,
                  }}
                >
                  {c.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-xs leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {c.name}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {c.area} · #{c.truck}
                  </p>
                </div>
                <StatusBadge variant={c.status as BadgeVariant} />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div>
                  <p
                    className="text-[9px] mb-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {c.status === "done" ? "Total Stop" : "Stop Progress"}
                  </p>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: s.avatarColor }}
                  >
                    {c.stopsDone} / {c.stopsTotal}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[9px] mb-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {c.status === "done" ? "Selesai Pukul" : "Est. Selesai"}
                  </p>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {c.estFinish}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="rounded-full mb-2"
                style={{ height: "4px", background: "var(--bg-elevated)" }}
              >
                <div
                  className="rounded-full h-full transition-all"
                  style={{ width: `${pct}%`, background: s.progressColor }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {c.status === "done" ? (
                    `Total pickup: ${c.totalKg} kg`
                  ) : c.status === "alert" ? (
                    <span style={{ color: "var(--color-error)" }}>
                      ⚠ {c.noCheckinMinutes} mnt tanpa check-in
                    </span>
                  ) : (
                    `Check-in terakhir: ${c.lastCheckin}`
                  )}
                </p>
                <div className="flex gap-1.5">
                  {c.status === "alert" && (
                    <button
                      className="px-2 py-1 rounded text-[9px]"
                      style={{
                        background: "rgba(160,72,72,0.1)",
                        color: "var(--color-error)",
                        border: "0.5px solid rgba(160,72,72,0.35)",
                      }}
                    >
                      Hubungi
                    </button>
                  )}
                  <button
                    className="px-2 py-1 rounded text-[9px]"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                      border: "0.5px solid var(--border-subtle)",
                    }}
                  >
                    Detail
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Log & Verification
// ─────────────────────────────────────────────────────────────────────────────

function LogTab({
  stops,
  totalScheduled,
}: {
  stops: any[];
  totalScheduled: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");

  // Konversi stops dari Supabase → LogEntry shape untuk UI
  const LOG_ENTRIES: LogEntry[] = stops.map((s) => ({
    id: s.id,
    partner: s.partner?.organization ?? "—",
    collector: s.collector_name ?? "—",
    time: s.completed_at
      ? toLocalTimeStr(s.completed_at)
      : (s.scheduled_time ?? "—"),
    condition: s.condition ?? "",
    kg: s.actual_kg ?? undefined,
    status: (s.status === "skipped" ? "skip" : s.status) as LogStatus,
    isSkipped: s.status === "skipped",
    skipReason: s.skip_reason ?? undefined,
  }));

  // Filter entries berdasarkan pilihan
  const today = todayWITA();
  const displayedEntries = LOG_ENTRIES.filter((e) => {
    if (filter === "today") return (e as any).route_date === today;
    return true;
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(
      checked ? new Set(displayedEntries.map((e) => e.id)) : new Set(),
    );
  }

  function verifySelected() {
    setSelected(new Set());
  }

  const LOG_STATUS_STYLE: Record<
    LogStatus,
    { label: string; bg: string; color: string; border: string }
  > = {
    done: {
      label: "✓ Selesai",
      bg: "rgba(45,90,46,0.12)",
      color: "var(--forest-sage)",
      border: "rgba(45,90,46,0.3)",
    },
    skip: {
      label: "✗ Skip",
      bg: "rgba(248,113,113,0.1)",
      color: "var(--color-error)",
      border: "rgba(248,113,113,0.25)",
    },
    pending: {
      label: "⏳ Pending",
      bg: "rgba(196,136,47,0.12)",
      color: "var(--coffee-latte)",
      border: "rgba(196,136,47,0.3)",
    },
  };

  const stats = [
    {
      label: "Selesai",
      value: displayedEntries.filter((l) => l.status === "done").length,
      color: "var(--forest-sage)",
    },
    {
      label: "Skip",
      value: displayedEntries.filter((l) => l.status === "skip").length,
      color: "var(--color-error)",
    },
    {
      label: "Total hari ini",
      value: `${displayedEntries.filter((l) => l.kg).reduce((a, b) => a + (b.kg ?? 0), 0)} kg`,
      color: "var(--coffee-latte)",
    },
    { label: "Rata-rata/stop", value: "4.2 kg", color: "var(--text-primary)" },
  ];

  return (
    <div>
      {/* Stats row */}
      <div className="flex gap-3 mb-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg text-center flex-1"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "10px 8px",
            }}
          >
            <p
              className="font-semibold text-[18px] leading-none mb-0.5"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-3"
          style={{
            background: "rgba(196,136,47,0.08)",
            border: "0.5px solid rgba(196,136,47,0.3)",
          }}
        >
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {selected.size} dipilih
          </span>
          <button
            onClick={verifySelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
            style={{
              background: "rgba(45,90,46,0.12)",
              color: "var(--forest-sage)",
              border: "0.5px solid rgba(45,90,46,0.35)",
            }}
          >
            <i className="fas fa-check text-[9px]" /> Verifikasi
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "0.5px solid var(--border-subtle)",
            }}
          >
            <i className="fas fa-file-export text-[9px]" /> Export CSV
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-[11px]"
            style={{
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
            }}
          >
            Batal
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-3">
        {(["all", "today", "week"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded text-[11px] transition-all"
            style={{
              background:
                filter === f ? "var(--coffee-latte)" : "var(--bg-card)",
              color:
                filter === f ? "var(--bg-primary)" : "var(--text-secondary)",
              border: `0.5px solid ${filter === f ? "var(--coffee-latte)" : "var(--border-subtle)"}`,
            }}
          >
            {f === "all" ? "Semua" : f === "today" ? "Hari Ini" : "Minggu Ini"}
          </button>
        ))}
        <input
          placeholder="Cari partner..."
          className="ml-auto rounded px-3 py-1.5 text-[11px] outline-none"
          style={{
            width: "180px",
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "0.5px solid var(--border-subtle)" }}
      >
        {/* Header */}
        <div
          className="flex items-center px-4 py-2.5"
          style={{
            background: "var(--bg-elevated)",
            borderBottom: "0.5px solid var(--border-subtle)",
          }}
        >
          <div className="w-6 mr-3 flex-shrink-0">
            <input
              type="checkbox"
              style={{ accentColor: "var(--coffee-latte)" }}
              onChange={(e) => toggleAll(e.target.checked)}
              checked={
                selected.size === displayedEntries.length &&
                displayedEntries.length > 0
              }
            />
          </div>
          <div
            className="flex-1 text-[10px] uppercase tracking-wider"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            Partner / Collector
          </div>
          <div
            className="w-16 text-[10px] uppercase tracking-wider text-right"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            Berat
          </div>
          <div
            className="w-24 text-[10px] uppercase tracking-wider text-center"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            Status
          </div>
          <div className="w-14" />
        </div>

        {/* Empty state — tampil ketika tidak ada data sama sekali */}
        {displayedEntries.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            style={{ borderTop: "0.5px solid var(--border-subtle)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
              }}
            >
              <i
                className="fas fa-clipboard-list text-lg"
                style={{ color: "var(--text-muted)" }}
              />
            </div>

            <div className="text-center">
              <p
                className="font-medium text-sm mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {filter === "today"
                  ? "Belum ada log hari ini"
                  : "Belum ada log untuk periode ini"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {totalScheduled > 0
                  ? `${totalScheduled} stop dijadwalkan hari ini — menunggu collector submit`
                  : "Tidak ada stop yang dijadwalkan hari ini"}
              </p>
            </div>

            {/* Tombol aksi kontekstual */}
            <div className="flex gap-2 mt-1">
              {totalScheduled > 0 ? (
                <>
                  <span
                    className="text-[11px] px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(196,136,47,0.08)",
                      color: "var(--coffee-latte)",
                      border: "0.5px solid rgba(196,136,47,0.25)",
                    }}
                  >
                    <i className="fas fa-clock mr-1.5 text-[9px]" />
                    Menunggu collector submit
                  </span>
                  <button
                    onClick={() => setFilter("all")}
                    className="text-[11px] px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                      border: "0.5px solid var(--border-subtle)",
                    }}
                  >
                    <i className="fas fa-sync-alt mr-1.5 text-[9px]" />
                    Refresh
                  </button>
                </>
              ) : (
                <span
                  className="text-[11px] px-3 py-1.5 rounded-full"
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-muted)",
                    border: "0.5px solid var(--border-subtle)",
                  }}
                >
                  <i className="fas fa-calendar-plus mr-1.5 text-[9px]" />
                  Tambah jadwal di tab Jadwal
                </span>
              )}
            </div>
          </div>
        )}

        {/* Rows */}
        {displayedEntries.map((entry) => {
          const s = LOG_STATUS_STYLE[entry.status];
          const isChecked = selected.has(entry.id);
          return (
            <div
              key={entry.id}
              className="flex items-center px-4 py-3 cursor-pointer transition-all"
              onClick={() => toggleSelect(entry.id)}
              style={{
                borderBottom: "0.5px solid var(--border-subtle)",
                background: isChecked
                  ? "rgba(196,136,47,0.06)"
                  : "var(--bg-card)",
              }}
              onMouseEnter={(e) => {
                if (!isChecked)
                  e.currentTarget.style.background = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                if (!isChecked)
                  e.currentTarget.style.background = "var(--bg-card)";
              }}
            >
              <div className="w-6 mr-3 flex-shrink-0">
                <input
                  type="checkbox"
                  style={{ accentColor: "var(--coffee-latte)" }}
                  checked={isChecked}
                  onChange={() => toggleSelect(entry.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium"
                  style={{
                    color: entry.isSkipped
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                    textDecoration: entry.isSkipped ? "line-through" : "none",
                  }}
                >
                  {entry.partner}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {entry.collector} · {entry.time}
                  {entry.skipReason
                    ? ` · ${entry.skipReason}`
                    : entry.condition
                      ? ` · ${entry.condition}`
                      : ""}
                </p>
              </div>
              <div className="w-16 text-right">
                <span
                  className="text-xs font-medium"
                  style={{
                    color: entry.kg
                      ? "var(--coffee-latte)"
                      : "var(--text-muted)",
                  }}
                >
                  {entry.kg ? `${entry.kg} kg` : "—"}
                </span>
              </div>
              <div className="w-24 flex justify-center">
                <StatusBadge variant={entry.status as BadgeVariant} />
              </div>
              <div className="w-14 text-right">
                <button
                  className="px-2 py-1 rounded text-[10px]"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "var(--bg-elevated)",
                    color: "var(--text-muted)",
                    border: "0.5px solid var(--border-subtle)",
                  }}
                >
                  Detail
                </button>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            background: "var(--bg-elevated)",
            borderTop: "0.5px solid var(--border-subtle)",
          }}
        >
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {displayedEntries.length} entri hari ini · Terakhir sync 5 mnt lalu
          </span>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "0.5px solid var(--border-subtle)",
              }}
            >
              <i className="fas fa-file-csv text-[9px]" /> Export CSV
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px]"
              style={{
                background: "rgba(196,136,47,0.1)",
                color: "var(--coffee-latte)",
                border: "0.5px solid rgba(196,136,47,0.3)",
              }}
            >
              <i className="fas fa-file-pdf text-[9px]" /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4 — Collector Team
// ─────────────────────────────────────────────────────────────────────────────

function TeamTab({
  members,
  onMemberAdded,
  onGoToSchedule,
}: {
  members: any[];
  onMemberAdded?: () => void;
  onGoToSchedule?: (collectorId: string) => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
    truck_plate: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Riwayat panel
  const [riwayatMember, setRiwayatMember] = useState<any | null>(null);
  const [riwayatLogs, setRiwayatLogs] = useState<any[]>([]);
  const [riwayatLoading, setRiwayatLoading] = useState(false);

  // Confirm dialog untuk nonaktifkan / delete
  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "activate" | "delete";
    member: any;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function setField(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleAddCollector() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await insertCollectorMember({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        area: form.area || undefined,
        truck_plate: form.truck_plate || undefined,
      });
      setShowAddModal(false);
      setForm({ name: "", email: "", phone: "", area: "", truck_plate: "" });
      onMemberAdded?.();
    } catch (err: any) {
      setSaveError(err?.message ?? "Gagal menyimpan, coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function openRiwayat(m: any) {
    setRiwayatMember(m);
    setRiwayatLogs([]);
    setRiwayatLoading(true);
    try {
      const logs = await fetchCollectorHistory7Days(m.id);
      setRiwayatLogs(logs);
    } catch (err: any) {
      console.error("fetchCollectorHistory7Days:", err?.message);
    } finally {
      setRiwayatLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === "delete") {
        await deleteCollectorMember(confirmAction.member.id);
      } else {
        await updateCollectorStatus(
          confirmAction.member.id,
          confirmAction.type === "deactivate" ? "inactive" : "active",
        );
      }
      setConfirmAction(null);
      onMemberAdded?.(); // refresh list
    } catch (err: any) {
      console.error("handleConfirmAction:", err?.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Konversi members dari Supabase → CollectorTeam shape untuk UI
  const TEAM_MEMBERS: CollectorTeam[] = members.map((m) => ({
    id: m.id,
    initials: m.initials ?? m.name?.slice(0, 2).toUpperCase() ?? "??",
    name: m.name ?? "—",
    area: `${m.area ?? "—"} · Truck #${m.truck_plate ?? "—"}`,
    activeSince: "aktif",
    status: (m.status === "active" ? "online" : "warning") as
      | "online"
      | "warning",
    completionRate: m.completion_rate ?? 0,
    stopsThisWeek: m.stops_this_week ?? 0,
    totalStopsThisWeek: m.total_stops_this_week ?? 0,
    kgPerStop: m.kg_per_stop ?? 0,
    stopsToday: m.stops_today ?? 0,
    skipsToday: m.skips_today ?? 0,
    truck: m.truck_plate ?? "—",
  }));

  // Raw member by id (for status check)
  const rawById = Object.fromEntries(members.map((m) => [m.id, m]));

  return (
    <>
      {/* ── Modal Tambah Collector ──────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-lg p-8"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="dash-section-title">Tambah Collector</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{
                  border: "0.5px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                <i className="fas fa-times text-xs" />
              </button>
            </div>
            {[
              {
                key: "name",
                label: "Nama Lengkap *",
                type: "text",
                placeholder: "Rizky Kahwa",
              },
              {
                key: "email",
                label: "Email *",
                type: "email",
                placeholder: "rizky@rebru.id",
              },
              {
                key: "phone",
                label: "No. HP",
                type: "tel",
                placeholder: "08xxxxxxxxxx",
              },
              {
                key: "area",
                label: "Area Operasional",
                type: "text",
                placeholder: "Tamalanrea",
              },
              {
                key: "truck_plate",
                label: "Plat Kendaraan",
                type: "text",
                placeholder: "DD 1234 AB",
              },
            ].map((f) => (
              <div key={f.key} className="mb-3">
                <label
                  className="block text-[0.72rem] tracking-[0.1em] uppercase mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) =>
                    setField(f.key as keyof typeof form, e.target.value)
                  }
                  placeholder={f.placeholder}
                  className="dash-search-input w-full"
                />
              </div>
            ))}
            {saveError && (
              <div
                className="mb-4 px-3 py-2 rounded text-[0.72rem]"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "0.5px solid rgba(248,113,113,0.3)",
                  color: "#f87171",
                }}
              >
                <i className="fas fa-exclamation-circle mr-1.5" />
                {saveError}
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded text-sm"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleAddCollector}
                disabled={!form.name.trim() || !form.email.trim() || saving}
                className="flex-1 py-2.5 rounded text-sm font-medium"
                style={{
                  background:
                    form.name && form.email
                      ? "var(--coffee-latte)"
                      : "var(--bg-elevated)",
                  color:
                    form.name && form.email
                      ? "var(--bg-primary)"
                      : "var(--text-muted)",
                  border: "none",
                  opacity: saving ? 0.7 : 1,
                  cursor: !form.name || !form.email ? "not-allowed" : "pointer",
                }}
              >
                {saving ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  "Daftarkan Collector"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel Riwayat (slide-in dari kanan) ───────────────────────────── */}
      {riwayatMember && (
        <>
          {/* Backdrop — z-50, klik untuk tutup */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setRiwayatMember(null)}
          />

          {/* Panel — z-[51] agar selalu di atas backdrop */}
          <div
            className="fixed top-0 right-0 h-full w-80 z-[51] flex flex-col overflow-y-auto"
            style={{
              background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border-default)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {riwayatMember.name}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Riwayat 7 hari terakhir
                </p>
              </div>
              <button
                onClick={() => setRiwayatMember(null)}
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{
                  border: "0.5px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                <i className="fas fa-times text-xs" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-4">
              {riwayatLoading ? (
                <div
                  className="flex items-center gap-2 py-8 justify-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  <i className="fas fa-circle-notch fa-spin text-sm" />
                  <span className="text-xs">Memuat riwayat...</span>
                </div>
              ) : riwayatLogs.length === 0 ? (
                <div className="py-8 text-center">
                  <i
                    className="fas fa-inbox text-2xl mb-2 block"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Belum ada riwayat 7 hari terakhir
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* ── Summary agregat 7 hari ── */}
                  {(() => {
                    const totalKg = riwayatLogs
                      .filter((l) => l.status === "done")
                      .reduce((sum, l) => sum + (l.kg ?? 0), 0);
                    const totalDone = riwayatLogs.filter(
                      (l) => l.status === "done",
                    ).length;
                    const totalSkip = riwayatLogs.filter(
                      (l) => l.status === "skipped",
                    ).length;
                    const totalAll = riwayatLogs.length;
                    const rateStr =
                      totalAll > 0
                        ? `${Math.round((totalDone / totalAll) * 100)}%`
                        : "—";
                    return (
                      <div
                        className="rounded-lg px-4 py-3 mb-2"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "0.5px solid var(--border-subtle)",
                        }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-wider mb-2"
                          style={{
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-space-mono)",
                          }}
                        >
                          Ringkasan 7 hari
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {
                              label: "Total kg",
                              value: `${totalKg % 1 === 0 ? totalKg.toFixed(0) : totalKg.toFixed(1)} kg`,
                              color: "var(--text-primary)",
                            },
                            {
                              label: "Stop selesai",
                              value: `${totalDone} / ${totalAll}`,
                              color: "var(--forest-sage)",
                            },
                            {
                              label: "Skip",
                              value: totalSkip > 0 ? String(totalSkip) : "—",
                              color:
                                totalSkip > 0
                                  ? "var(--coffee-latte)"
                                  : "var(--text-muted)",
                            },
                          ].map((s) => (
                            <div key={s.label} className="text-center">
                              <p
                                className="font-semibold text-base leading-none mb-1"
                                style={{
                                  color: s.color,
                                  letterSpacing: "-0.02em",
                                }}
                              >
                                {s.value}
                              </p>
                              <p
                                className="text-[10px]"
                                style={{
                                  color: "var(--text-muted)",
                                  fontFamily: "var(--font-space-mono)",
                                }}
                              >
                                {s.label}
                              </p>
                            </div>
                          ))}
                        </div>
                        {/* Completion rate bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-[10px]"
                              style={{
                                color: "var(--text-muted)",
                                fontFamily: "var(--font-space-mono)",
                              }}
                            >
                              Completion rate
                            </span>
                            <span
                              className="text-[10px] font-semibold"
                              style={{ color: "var(--forest-sage)" }}
                            >
                              {rateStr}
                            </span>
                          </div>
                          <div
                            className="w-full h-1 rounded-full overflow-hidden"
                            style={{ background: "var(--border-subtle)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: rateStr !== "—" ? rateStr : "0%",
                                background: "var(--forest-sage)",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* List log */}
                  {riwayatLogs.map((log, i) => {
                    const isDone = log.status === "done";
                    const isSkip = log.status === "skipped";
                    return (
                      <div
                        key={i}
                        className="rounded-lg px-4 py-3"
                        style={{
                          background: "var(--bg-card)",
                          border: "0.5px solid var(--border-subtle)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {log.partner}
                            </p>
                            <p
                              className="text-[11px] mt-0.5"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {log.date} · {log.time}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <StatusBadge
                              variant={
                                isDone ? "done" : isSkip ? "skip" : "pending"
                              }
                            />
                            {isDone && log.kg != null && (
                              <span
                                className="text-[11px] font-semibold"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {log.kg} kg
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer — aksi status */}
            <div
              className="px-6 py-4 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <p
                className="text-[10px] uppercase tracking-wider mb-3"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                Kelola Collector
              </p>
              <div className="flex flex-col gap-2">
                {rawById[riwayatMember.id]?.status === "active" ? (
                  <button
                    onClick={() => {
                      setRiwayatMember(null);
                      setConfirmAction({
                        type: "deactivate",
                        member: riwayatMember,
                      });
                    }}
                    className="w-full py-2.5 rounded text-sm text-left px-4"
                    style={{
                      background: "rgba(196,136,47,0.08)",
                      color: "var(--coffee-latte)",
                      border: "0.5px solid rgba(196,136,47,0.3)",
                    }}
                  >
                    <i className="fas fa-pause-circle mr-2" />
                    Nonaktifkan Collector
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setRiwayatMember(null);
                      setConfirmAction({
                        type: "activate",
                        member: riwayatMember,
                      });
                    }}
                    className="w-full py-2.5 rounded text-sm text-left px-4"
                    style={{
                      background: "rgba(45,90,46,0.08)",
                      color: "var(--forest-sage)",
                      border: "0.5px solid rgba(45,90,46,0.3)",
                    }}
                  >
                    <i className="fas fa-play-circle mr-2" />
                    Aktifkan Kembali
                  </button>
                )}
                <button
                  onClick={() => {
                    setRiwayatMember(null);
                    setConfirmAction({ type: "delete", member: riwayatMember });
                  }}
                  className="w-full py-2.5 rounded text-sm text-left px-4"
                  style={{
                    background: "rgba(248,113,113,0.06)",
                    color: "#f87171",
                    border: "0.5px solid rgba(248,113,113,0.2)",
                  }}
                >
                  <i className="fas fa-trash mr-2" />
                  Hapus dari Tim
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Confirm Dialog ─────────────────────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-lg p-8"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{
                background:
                  confirmAction.type === "delete"
                    ? "rgba(248,113,113,0.08)"
                    : "rgba(196,136,47,0.08)",
                border: `1px solid ${confirmAction.type === "delete" ? "rgba(248,113,113,0.2)" : "rgba(196,136,47,0.2)"}`,
              }}
            >
              <i
                className={`fas ${confirmAction.type === "delete" ? "fa-trash" : confirmAction.type === "deactivate" ? "fa-pause-circle" : "fa-play-circle"} text-sm`}
                style={{
                  color:
                    confirmAction.type === "delete"
                      ? "#f87171"
                      : confirmAction.type === "deactivate"
                        ? "var(--coffee-latte)"
                        : "var(--forest-sage)",
                }}
              />
            </div>
            <h3
              className="font-semibold text-base mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {confirmAction.type === "delete"
                ? "Hapus Collector?"
                : confirmAction.type === "deactivate"
                  ? "Nonaktifkan Collector?"
                  : "Aktifkan Kembali?"}
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              {confirmAction.type === "delete"
                ? `${confirmAction.member.name} akan dihapus permanen dari tim. Rute yang sudah dibuat tidak ikut terhapus.`
                : confirmAction.type === "deactivate"
                  ? `${confirmAction.member.name} tidak akan muncul di pilihan collector saat membuat jadwal baru.`
                  : `${confirmAction.member.name} akan aktif kembali dan bisa dipilih di jadwal.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded text-sm"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded text-sm font-medium"
                style={{
                  background:
                    confirmAction.type === "delete"
                      ? "rgba(248,113,113,0.15)"
                      : confirmAction.type === "deactivate"
                        ? "rgba(196,136,47,0.15)"
                        : "rgba(45,90,46,0.15)",
                  color:
                    confirmAction.type === "delete"
                      ? "#f87171"
                      : confirmAction.type === "deactivate"
                        ? "var(--coffee-latte)"
                        : "var(--forest-sage)",
                  border: "none",
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-1.5" />
                    Proses...
                  </>
                ) : confirmAction.type === "delete" ? (
                  "Ya, Hapus"
                ) : confirmAction.type === "deactivate" ? (
                  "Ya, Nonaktifkan"
                ) : (
                  "Ya, Aktifkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Grid kartu collector ───────────────────────────────────────────── */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {TEAM_MEMBERS.map((m) => {
          const isWarn = m.status === "warning";
          const barColor = isWarn
            ? "var(--coffee-latte)"
            : "var(--forest-sage)";
          const avatarBg = isWarn
            ? "rgba(196,136,47,0.15)"
            : "rgba(45,90,46,0.15)";
          const avatarColor = isWarn
            ? "var(--coffee-latte)"
            : "var(--forest-sage)";
          const avatarBorder = isWarn
            ? "var(--coffee-latte)"
            : "var(--forest-sage)";

          return (
            <div
              key={m.id}
              className="rounded-lg"
              style={{
                background: "var(--bg-card)",
                border: `0.5px solid ${isWarn ? "rgba(196,136,47,0.4)" : "var(--border-subtle)"}`,
                padding: "14px",
              }}
            >
              {/* Header */}
              <div className="flex items-start gap-2.5 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: avatarBg,
                    color: avatarColor,
                    border: `0.5px solid ${avatarBorder}`,
                  }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-sm leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {m.name}
                  </p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Collector · {m.activeSince}
                  </p>
                  <div className="mt-1">
                    {isWarn ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-px rounded-full text-[9px]"
                        style={{
                          background: "rgba(196,136,47,0.12)",
                          color: "var(--coffee-latte)",
                          border: "0.5px solid rgba(196,136,47,0.3)",
                        }}
                      >
                        ⚠ Tidak responsif
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-px rounded-full text-[9px]"
                        style={{
                          background: "rgba(45,90,46,0.12)",
                          color: "var(--forest-sage)",
                          border: "0.5px solid rgba(45,90,46,0.3)",
                        }}
                      >
                        ● Online
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Completion label */}
              <p
                className="text-[9px] uppercase tracking-wider mb-1.5"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                Completion rate minggu ini
              </p>

              {/* Progress bar */}
              <div
                className="rounded-full mb-1"
                style={{ height: "5px", background: "var(--bg-elevated)" }}
              >
                <div
                  className="rounded-full h-full"
                  style={{
                    width: `${m.completionRate}%`,
                    background: barColor,
                  }}
                />
              </div>
              <div className="flex justify-between mb-3">
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {m.stopsThisWeek}/{m.totalStopsThisWeek} stop
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: barColor }}
                >
                  {m.completionRate}%
                </span>
              </div>

              {/* Metrics */}
              <div
                className="grid grid-cols-3 mb-3"
                style={{
                  borderTop: "0.5px solid var(--border-subtle)",
                  borderBottom: "0.5px solid var(--border-subtle)",
                  padding: "8px 0",
                }}
              >
                {[
                  {
                    val: m.kgPerStop,
                    lbl: "kg/stop",
                    color: "var(--coffee-latte)",
                  },
                  {
                    val: m.stopsToday,
                    lbl: "stop hari ini",
                    color: "var(--text-primary)",
                  },
                  {
                    val: m.skipsToday,
                    lbl: "skip",
                    color: isWarn ? "var(--coffee-latte)" : "var(--text-muted)",
                  },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className="text-center"
                    style={{
                      borderLeft:
                        i > 0 ? "0.5px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <p
                      className="font-semibold text-[14px]"
                      style={{ color: metric.color }}
                    >
                      {metric.val}
                    </p>
                    <p
                      className="text-[9px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {metric.lbl}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {isWarn ? (
                  <>
                    <a
                      href={`tel:${rawById[m.id]?.phone ?? ""}`}
                      className="flex-1 py-1.5 rounded text-[11px] flex items-center justify-center gap-1.5"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "0.5px solid var(--border-subtle)",
                      }}
                    >
                      <i className="fas fa-phone text-[9px]" /> Hubungi
                    </a>
                    <button
                      className="flex-1 py-1.5 rounded text-[11px]"
                      style={{
                        background: "rgba(196,136,47,0.1)",
                        color: "var(--coffee-latte)",
                        border: "0.5px solid rgba(196,136,47,0.3)",
                      }}
                      onClick={() => openRiwayat(rawById[m.id])}
                    >
                      Riwayat
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="flex-1 py-1.5 rounded text-[11px]"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "0.5px solid var(--border-subtle)",
                      }}
                      onClick={() => openRiwayat(rawById[m.id])}
                    >
                      Riwayat
                    </button>
                    <button
                      className="flex-1 py-1.5 rounded text-[11px]"
                      style={{
                        background: "rgba(196,136,47,0.1)",
                        color: "var(--coffee-latte)",
                        border: "0.5px solid rgba(196,136,47,0.3)",
                      }}
                      onClick={() => onGoToSchedule?.(m.id)}
                    >
                      Jadwal →
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Add collector card */}
        <div
          className="rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          style={{
            background: "var(--bg-card)",
            border: "0.5px dashed var(--border-default)",
            padding: "14px",
            minHeight: "200px",
            opacity: 0.6,
          }}
          onClick={() => setShowAddModal(true)}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          <i
            className="fas fa-user-plus text-2xl"
            style={{ color: "var(--text-muted)" }}
          />
          <p
            className="font-medium text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Tambah Collector
          </p>
          <p
            className="text-[10px] text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Daftarkan anggota tim baru sebagai collector lapangan
          </p>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OperationalSection — main export
// ─────────────────────────────────────────────────────────────────────────────

export default function OperationalSection() {
  const [activeTab, setActiveTab] = useState<SubTab>("schedule");

  // ── State live dari Supabase ───────────────────────────────────────────────
  const [weekRoutes, setWeekRoutes] = useState<RouteWithCollector[]>([]);
  const [todayRoutes, setTodayRoutes] = useState<RouteWithCollector[]>([]);
  const [todayStops, setTodayStops] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<any[]>([]);

  // ── Week navigation (ScheduleTab) ──────────────────────────────────────────
  const [weekOffset, setWeekOffset] = useState(0); // 0 = minggu ini, -1 = minggu lalu, +1 = minggu depan

  const weekStart = getMondayWITA(addDays(todayWITA(), weekOffset * 7));
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = (() => {
    const s = new Date(weekStart);
    const e = new Date(weekEnd);
    const fmt = (d: Date) => formatDisplayDate(formatDate(d), { short: true });
    const label = `${fmt(s)} – ${fmt(e)} ${e.getFullYear()}`;
    return weekOffset === 0
      ? `${label} · Minggu ini`
      : weekOffset === -1
        ? `${label} · Minggu lalu`
        : weekOffset === 1
          ? `${label} · Minggu depan`
          : label;
  })();

  const loadWeekRoutes = useCallback((start: string) => {
    fetchWeekRoutes(start)
      .then(setWeekRoutes)
      .catch((err) => console.error("[fetchWeekRoutes]", err?.message));
  }, []);

  // ── KPI dihitung dari data live ────────────────────────────────────────────
  const allStops = todayRoutes.flatMap((r) => r.stops);
  const stopsTotal = allStops.length;
  const stopsDone = allStops.filter((s) => s.status !== "pending").length;
  const stopsSkip = allStops.filter((s) => s.status === "skipped").length;
  const onlineCount = todayRoutes.filter(
    (r) => r.stops_done > 0 || r.status === "active",
  ).length;
  const alertCount = todayRoutes.filter((r) =>
    r.stops.some(
      (s) => s.status === "pending" && isTimeOverdue(s.scheduled_time),
    ),
  ).length;
  const collectorNames = todayRoutes
    .slice(0, 2)
    .map((r) => r.collector?.name?.split(" ")[0] ?? "—")
    .join(" · ");

  // ── Fetch semua data saat mount ────────────────────────────────────────────
  useEffect(() => {
    const safe = <T,>(p: Promise<T>, label: string, fallback: T): Promise<T> =>
      p.catch((err) => {
        console.error(
          `[OperationalSection] ${label} gagal:`,
          err?.message ?? err,
        );
        return fallback;
      });

    Promise.all([
      safe(fetchWeekRoutes(weekStart), "fetchWeekRoutes", []),
      safe(fetchTodayRoutes(), "fetchTodayRoutes", []),
      safe(fetchTodayStops(), "fetchTodayStops", []),
      safe(fetchCollectorStats(), "fetchCollectorStats", []),
    ]).then(([w, t, s, stats]) => {
      setWeekRoutes(w as any);
      setTodayRoutes(t as any);
      setTodayStops(
        // Safety net: pastikan urutan konsisten sebelum masuk ke state
        // meskipun fetchTodayStops sudah sort, ini lindungi dari future refactor
        (s as any[]).sort(
          (a, b) =>
            (b.completed_at ?? "").localeCompare(a.completed_at ?? "") ||
            (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "") ||
            (a.stop_order ?? 0) - (b.stop_order ?? 0),
        ),
      );
      setTeamStats(stats as any);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reload week routes saat offset berubah (navigasi minggu) ──────────────
  useEffect(() => {
    loadWeekRoutes(weekStart);
  }, [weekStart, loadWeekRoutes]);

  // ── Refresh Monitor + Log saat tab berubah ─────────────────────────────────
  useEffect(() => {
    if (activeTab !== "monitor" && activeTab !== "log") return;
    Promise.all([fetchTodayRoutes(), fetchTodayStops()])
      .then(([t, s]) => {
        setTodayRoutes(t);
        setTodayStops(
          (s as any[]).sort(
            (a, b) =>
              (b.completed_at ?? "").localeCompare(a.completed_at ?? "") ||
              (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "") ||
              (a.stop_order ?? 0) - (b.stop_order ?? 0),
          ),
        );
      })
      .catch(console.error);
  }, [activeTab]);

  return (
    <div>
      {/* Section header */}
      <div className="dash-section-header">
        <h2 className="dash-section-title">Operasional</h2>
        <p className="dash-section-sub">
          {alertCount > 0 && (
            <span style={{ color: "var(--color-error)" }}>
              ⚠ {alertCount} collector perlu perhatian ·{" "}
            </span>
          )}
          {onlineCount} collector aktif · Stop progress: {stopsDone} /{" "}
          {stopsTotal}
        </p>
      </div>

      {/* Summary KPI */}
      <div
        className="grid gap-2 mb-5"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {[
          {
            label: "Stop Progress",
            value: `${stopsDone} / ${stopsTotal}`,
            sub:
              stopsTotal > 0
                ? `${stopsSkip} skip · ${stopsTotal - stopsDone} pending`
                : "Belum ada rute",
            color: "var(--text-primary)",
          },
          {
            label: "Collector Online",
            value: String(onlineCount),
            sub: collectorNames || "Tidak ada yang aktif",
            color: "var(--forest-sage)",
          },
          {
            label: "Perlu Perhatian",
            value: String(alertCount),
            sub: alertCount > 0 ? "Cek tab Monitor" : "Semua on track",
            color: alertCount > 0 ? "var(--color-error)" : "var(--text-muted)",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-lg"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "12px 14px",
            }}
          >
            <p
              className="text-[10px] uppercase tracking-wider mb-1"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {k.label}
            </p>
            <p
              className="font-semibold text-[20px] leading-none mb-1"
              style={{ color: k.color, letterSpacing: "-0.02em" }}
            >
              {k.value}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {k.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Sub-tab navigation */}
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content — data live dikirim sebagai props */}
      {activeTab === "schedule" && (
        <ScheduleTab
          weekRoutes={weekRoutes}
          weekLabel={weekLabel}
          weekOffset={weekOffset}
          weekStart={weekStart}
          onWeekChange={(delta) =>
            delta === 0 ? setWeekOffset(0) : setWeekOffset((o) => o + delta)
          }
          onRefreshWeek={() => loadWeekRoutes(weekStart)}
          todayRoutes={todayRoutes}
        />
      )}
      {activeTab === "monitor" && <MonitorTab todayRoutes={todayRoutes} />}
      {activeTab === "log" && (
        <LogTab stops={todayStops} totalScheduled={stopsTotal} />
      )}
      {activeTab === "team" && (
        <TeamTab
          members={teamStats}
          onMemberAdded={() =>
            fetchCollectorStats()
              .then(setTeamStats)
              .catch((err) =>
                console.error("Refresh team gagal:", err?.message ?? err),
              )
          }
          onGoToSchedule={(_collectorId) => {
            // Switch ke tab Jadwal — filter by collector bisa ditambahkan nanti
            setActiveTab("schedule");
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

// isTimeOverdue dan getMondayWITA diimport dari @/utils/dateUtils
