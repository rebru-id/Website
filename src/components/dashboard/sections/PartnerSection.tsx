"use client";
// src/components/dashboard/sections/PartnerSection.tsx
// FASE 6A v4 — Close button, filter reset, merge Tidak Aktif, sort priority, new list item layout

import { useState, useEffect, useCallback } from "react";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import { useDashToast } from "@/components/dashboard/DashToastContext";
import {
  fetchPartnerApplications,
  updatePartnerStatus,
  approvePartner,
  extendPartner,
  type PartnerApplication,
  type ApplicationStatus,
  type PackageType,
} from "@/lib/supabase-partner";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const PACKAGE_CFG: Record<
  PackageType,
  { label: string; color: string; bg: string; border: string }
> = {
  kontributor: {
    label: "Kontributor",
    color: "var(--gold)",
    bg: "rgba(200,168,75,0.12)",
    border: "rgba(200,168,75,0.30)",
  },
  dampak: {
    label: "Dampak",
    color: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.12)",
    border: "rgba(122,171,126,0.30)",
  },
  strategis: {
    label: "Strategis",
    color: "var(--coffee-latte)",
    bg: "rgba(196,149,106,0.12)",
    border: "rgba(196,149,106,0.30)",
  },
};

const SOURCE_CFG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  ig_landing: {
    label: "Instagram",
    icon: "fa-instagram",
    color: "var(--amber)",
  },
  website: { label: "Website", icon: "fa-globe", color: "var(--teal)" },
};

const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "var(--coffee-latte)",
    bg: "rgba(196,149,106,0.10)",
    border: "rgba(196,149,106,0.30)",
  },
  review: {
    label: "Review",
    color: "var(--teal)",
    bg: "var(--teal-bg)",
    border: "var(--teal-border)",
  },
  active: {
    label: "Active",
    color: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.10)",
    border: "rgba(122,171,126,0.30)",
  },
  rejected: {
    label: "Rejected",
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.25)",
  },
  inactive: {
    label: "Inactive",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.04)",
    border: "var(--border-subtle)",
  },
  // fallback untuk nilai enum lama
  reviewed: {
    label: "Reviewed",
    color: "var(--teal)",
    bg: "var(--teal-bg)",
    border: "var(--teal-border)",
  },
  accepted: {
    label: "Accepted",
    color: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.10)",
    border: "rgba(122,171,126,0.30)",
  },
  on_hold: {
    label: "On Hold",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.04)",
    border: "var(--border-subtle)",
  },
};
const STATUS_FALLBACK = {
  label: "Unknown",
  color: "var(--text-muted)",
  bg: "rgba(255,255,255,0.04)",
  border: "var(--border-subtle)",
};

const DURATION_OPTIONS = [
  { value: 1, label: "1 Bln" },
  { value: 3, label: "3 Bln" },
  { value: 6, label: "6 Bln" },
  { value: 12, label: "12 Bln" },
  { value: "custom", label: "Custom" },
] as const;
type DurationValue = 1 | 3 | 6 | 12 | "custom";

// Filter tabs — "tidak-aktif" menggabungkan expired + inactive
type FilterTab =
  | "all"
  | "pending"
  | "review"
  | "active"
  | "expiring"
  | "tidak-aktif"
  | "rejected";

type DrawerAction =
  | {
      type: "approve";
      activeFrom: string;
      activeUntil: string | null;
      pickupIntervalDays: number;
    }
  | { type: "reject" }
  | { type: "deactivate" }
  | { type: "reactivate" }
  | { type: "reconsider" }
  | { type: "extend"; activeUntil: string };

const FILTER_TABS: { id: FilterTab; label: string; urgent?: boolean }[] = [
  { id: "all", label: "Semua" },
  { id: "pending", label: "Pending" },
  { id: "review", label: "Review" },
  { id: "active", label: "Active" },
  { id: "expiring", label: "Expiring", urgent: true },
  { id: "tidak-aktif", label: "Tidak Aktif" },
  { id: "rejected", label: "Rejected" },
];

const ACTION_STATUS_MAP: Record<
  Exclude<DrawerAction["type"], "approve" | "extend">,
  ApplicationStatus
> = {
  reject: "rejected",
  deactivate: "inactive",
  reactivate: "review",
  reconsider: "review",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  return `${Math.floor(days / 7)}mg lalu`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysLeft(activeUntil: string): number {
  return Math.floor(
    (new Date(activeUntil).getTime() - Date.now()) / 86_400_000,
  );
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

type ExpiryState = "none" | "ok" | "soon" | "warning" | "urgent" | "expired";

function getExpiryState(p: PartnerApplication): ExpiryState {
  if (p.status !== "active" || !p.active_until) return "none";
  const days = getDaysLeft(p.active_until);
  if (days < 0) return "expired";
  if (days <= 3) return "urgent";
  if (days <= 7) return "warning";
  if (days <= 14) return "soon";
  return "ok";
}

// Computed filter key — dipakai untuk sort priority dan filter logic
type ComputedState = ApplicationStatus | "expiring" | "expired";

function getComputedState(p: PartnerApplication): ComputedState {
  const exp = getExpiryState(p);
  if (exp === "expired") return "expired";
  if (exp === "urgent" || exp === "warning" || exp === "soon")
    return "expiring";
  return p.status;
}

// Sort priority (0 = paling urgent)
function getSortPriority(p: PartnerApplication): number {
  const cs = getComputedState(p);
  if (cs === "expired") return 0;
  if (cs === "expiring") return 1;
  if (cs === "pending") return 2;
  if (cs === "review") return 3;
  if (cs === "active") return 4;
  if (cs === "inactive") return 5;
  if (cs === "rejected") return 6;
  return 7;
}

function sortPartners(list: PartnerApplication[]): PartnerApplication[] {
  return [...list].sort((a, b) => {
    const pa = getSortPriority(a);
    const pb = getSortPriority(b);
    if (pa !== pb) return pa - pb;

    // Secondary sort dalam grup yang sama
    switch (pa) {
      case 0: // Expired → terlama expired duluan
        return (
          new Date(a.active_until!).getTime() -
          new Date(b.active_until!).getTime()
        );
      case 1: // Expiring → paling dekat expired duluan
        return (
          new Date(a.active_until!).getTime() -
          new Date(b.active_until!).getTime()
        );
      case 2: // Pending → terlama menunggu duluan
      case 3: // Review → terlama dalam review duluan
        return (
          new Date(a.submitted_at).getTime() -
          new Date(b.submitted_at).getTime()
        );
      case 4: // Active → paling dekat masa aktifnya duluan
        if (!a.active_until && !b.active_until) return 0;
        if (!a.active_until) return 1; // kontributor (tidak berbatas) → paling akhir
        if (!b.active_until) return -1;
        return (
          new Date(a.active_until).getTime() -
          new Date(b.active_until).getTime()
        );
      default: // Inactive/Rejected → paling baru ditindak duluan
        const ra = a.reviewed_at ? new Date(a.reviewed_at).getTime() : 0;
        const rb = b.reviewed_at ? new Date(b.reviewed_at).getTime() : 0;
        return rb - ra;
    }
  });
}

// Warna border kiri permanen berdasarkan status
function getStatusBorderColor(p: PartnerApplication): string {
  const cs = getComputedState(p);
  if (cs === "expired") return "rgba(248,113,113,0.50)";
  if (cs === "expiring") {
    const days = getDaysLeft(p.active_until!);
    return days <= 3 ? "rgba(248,113,113,0.50)" : "rgba(212,136,74,0.50)";
  }
  switch (p.status) {
    case "pending":
      return "rgba(196,149,106,0.45)";
    case "review":
      return "rgba(45,128,128,0.45)";
    case "active":
      return "rgba(122,171,126,0.45)";
    case "rejected":
      return "rgba(150,150,150,0.25)";
    case "inactive":
      return "rgba(150,150,150,0.25)";
    default:
      return "rgba(150,150,150,0.20)";
  }
}

function buildMailto(p: PartnerApplication): string {
  const days = p.active_until ? getDaysLeft(p.active_until) : null;
  const expired = days !== null && days < 0;
  const subject = encodeURIComponent(
    `Reminder Perpanjangan Kemitraan Rebru — ${p.organization}`,
  );
  const body = encodeURIComponent(
    `Halo ${p.pic_name},\n\n` +
      (expired
        ? `Kami ingin menginformasikan bahwa masa kemitraan ${p.organization} telah berakhir ${Math.abs(days!)} hari yang lalu.`
        : `Kami ingin menginformasikan bahwa masa kemitraan ${p.organization} akan berakhir dalam ${days} hari.`) +
      `\n\nUntuk melanjutkan kemitraan bersama Rebru, silakan konfirmasikan kepada kami.\n\nTerima kasih,\nTim Rebru`,
  );
  return `mailto:${p.email}?subject=${subject}&body=${body}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Atom components
// ─────────────────────────────────────────────────────────────────────────────

function PackageBadge({ type }: { type: PackageType }) {
  const c = PACKAGE_CFG[type];
  return (
    <span
      className="inline-flex items-center px-1.5 py-px rounded text-[10px] leading-none"
      style={{
        background: c.bg,
        color: c.color,
        border: `0.5px solid ${c.border}`,
      }}
    >
      ✦ {c.label}
    </span>
  );
}

function SourceBadge({ platform }: { platform: string }) {
  const c = SOURCE_CFG[platform] ?? {
    label: platform,
    icon: "fa-question",
    color: "var(--text-muted)",
  };
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] leading-none"
      style={{
        background: "var(--bg-elevated)",
        color: c.color,
        border: "0.5px solid var(--border-subtle)",
      }}
    >
      <i className={`fab ${c.icon} text-[9px]`} aria-hidden />
      {c.label}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_FALLBACK;
  return (
    <span
      className="inline-flex items-center px-2 py-px rounded text-[10px] leading-none flex-shrink-0"
      style={{
        background: c.bg,
        color: c.color,
        border: `0.5px solid ${c.border}`,
        fontFamily: "var(--font-space-mono)",
      }}
    >
      {c.label}
    </span>
  );
}

function ExpiryLabel({ partner }: { partner: PartnerApplication }) {
  const state = getExpiryState(partner);
  if (state === "none" || state === "ok") return null;
  const days = getDaysLeft(partner.active_until!);
  const color =
    state === "expired" || state === "urgent"
      ? "#f87171"
      : state === "warning"
        ? "var(--amber)"
        : "var(--gold)";
  const text =
    state === "expired"
      ? `⚠ Berakhir ${Math.abs(days)}h lalu`
      : state === "urgent"
        ? `⚠ ${days}h lagi`
        : `${days}h lagi`;
  return (
    <span
      className="text-[10px]"
      style={{ color, fontFamily: "var(--font-space-mono)" }}
    >
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Row (Stat Bar)
// ─────────────────────────────────────────────────────────────────────────────

function KpiRow({ partners }: { partners: PartnerApplication[] }) {
  const expiringUrgent = partners.filter((p) => {
    const s = getExpiryState(p);
    return s === "expired" || s === "urgent";
  }).length;

  const stats = [
    { label: "Total", value: partners.length, color: "var(--text-primary)" },
    {
      label: "Pending",
      value: partners.filter((p) => p.status === "pending").length,
      color: "var(--coffee-latte)",
    },
    {
      label: "Active",
      value: partners.filter((p) => p.status === "active").length,
      color: "var(--forest-sage)",
    },
    {
      label: "⚠ Perlu Tindakan",
      value: expiringUrgent,
      color: expiringUrgent > 0 ? "#f87171" : "var(--text-muted)",
    },
  ];

  return (
    <div className="dash-kpi-grid mb-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "0.5px solid var(--border-subtle)",
            padding: "14px 16px",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-wider mb-1.5"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            {s.label}
          </p>
          <p
            className="text-[26px] font-semibold leading-none"
            style={{ color: s.color, letterSpacing: "-0.02em" }}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Duration Picker
// ─────────────────────────────────────────────────────────────────────────────

function DurationPicker({
  packageType,
  activeFrom,
  activeUntil,
  onActiveFromChange,
  onActiveUntilChange,
}: {
  packageType: PackageType;
  activeFrom: string;
  activeUntil: string;
  onActiveFromChange: (v: string) => void;
  onActiveUntilChange: (v: string) => void;
}) {
  const [duration, setDuration] = useState<DurationValue>(3);

  if (packageType === "kontributor") {
    return (
      <div
        className="px-3 py-2.5 rounded-md"
        style={{
          background: "var(--bg-elevated)",
          border: "0.5px solid var(--border-subtle)",
        }}
      >
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          <i className="fas fa-infinity mr-1.5 text-[9px]" aria-hidden />
          Mitra Kontributor tidak memiliki batas waktu kemitraan.
        </p>
      </div>
    );
  }

  function handleDuration(d: DurationValue) {
    setDuration(d);
    if (d !== "custom") onActiveUntilChange(addMonths(activeFrom, d));
  }

  function handleFromChange(v: string) {
    onActiveFromChange(v);
    if (duration !== "custom")
      onActiveUntilChange(addMonths(v, duration as number));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleDuration(opt.value as DurationValue)}
            className="flex-1 py-1.5 rounded text-[10px] transition-all"
            style={{
              background:
                duration === opt.value
                  ? "rgba(196,149,106,0.15)"
                  : "var(--bg-elevated)",
              color:
                duration === opt.value
                  ? "var(--coffee-latte)"
                  : "var(--text-muted)",
              border:
                duration === opt.value
                  ? "0.5px solid rgba(196,149,106,0.45)"
                  : "0.5px solid var(--border-subtle)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <p
            className="text-[9px] uppercase tracking-wider mb-1"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            Mulai
          </p>
          <input
            type="date"
            value={activeFrom}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded text-[11px] outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          />
        </div>
        <div className="flex-1">
          <p
            className="text-[9px] uppercase tracking-wider mb-1"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            Berakhir
          </p>
          {duration === "custom" ? (
            <input
              type="date"
              value={activeUntil}
              onChange={(e) => onActiveUntilChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded text-[11px] outline-none"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            />
          ) : (
            <div
              className="w-full px-2.5 py-1.5 rounded text-[11px]"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {activeUntil ? formatDateShort(activeUntil) : "—"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Partner List Item — layout baru
// ─────────────────────────────────────────────────────────────────────────────

function PartnerListItem({
  partner,
  isSelected,
  onClick,
}: {
  partner: PartnerApplication;
  isSelected: boolean;
  onClick: () => void;
}) {
  const borderColor = isSelected
    ? "var(--coffee-latte)"
    : getStatusBorderColor(partner);

  return (
    <div
      onClick={onClick}
      className="px-4 py-3 cursor-pointer transition-all duration-150 border-b"
      style={{
        background: isSelected ? "rgba(196,149,106,0.06)" : "transparent",
        borderColor: "var(--border-subtle)",
        borderLeft: `${isSelected ? "3px" : "2px"} solid ${borderColor}`,
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          e.currentTarget.style.background = "var(--bg-elevated)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Baris 1: Nama + Status pill */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p
          className="text-[12px] leading-tight truncate font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {partner.organization}
        </p>
        <StatusPill status={partner.status} />
      </div>

      {/* Baris 2: Jenis usaha */}
      <p
        className="text-[11px] mb-1.5 truncate"
        style={{ color: "var(--text-secondary)" }}
      >
        {partner.jenis_usaha}
      </p>

      {/* Baris 3: Badges + Lokasi */}
      <div className="flex flex-wrap items-center gap-1 mb-1.5">
        <PackageBadge type={partner.package_type} />
        <SourceBadge platform={partner.source_platform} />
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          · Kec. {partner.kecamatan_nama}
        </span>
      </div>

      {/* Baris 4: Expiry (kiri) + Tanggal daftar (kanan) */}
      <div className="flex items-center justify-between">
        <ExpiryLabel partner={partner} />
        <span
          className="text-[10px]"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-space-mono)",
          }}
        >
          {formatDateShort(partner.submitted_at)}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail panel helpers
// ─────────────────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3 items-start">
      <span
        className="text-[9px] uppercase tracking-wider flex-shrink-0 mt-0.5"
        style={{
          color: "var(--text-muted)",
          fontFamily: "var(--font-space-mono)",
          width: "72px",
        }}
      >
        {label}
      </span>
      <span
        className="text-[12px] leading-snug flex-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="my-4"
      style={{ height: "0.5px", background: "var(--border-subtle)" }}
    />
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[9px] tracking-[0.12em] uppercase mb-2.5"
      style={{
        color: "var(--text-muted)",
        fontFamily: "var(--font-space-mono)",
      }}
    >
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Partner Detail — tambah onClose prop + tombol X
// ─────────────────────────────────────────────────────────────────────────────

function PartnerDetail({
  partner,
  note,
  onNoteChange,
  onAction,
  actionLoading,
  onClose,
}: {
  partner: PartnerApplication;
  note: string;
  onNoteChange: (v: string) => void;
  onAction: (a: DrawerAction) => void;
  actionLoading: boolean;
  onClose: () => void;
}) {
  const today = todayStr();
  const defaultUntil =
    partner.package_type !== "kontributor" ? addMonths(today, 3) : "";

  const [activeFrom, setActiveFrom] = useState(today);
  const [activeUntil, setActiveUntil] = useState(defaultUntil);
  const [showExtend, setShowExtend] = useState(false);
  const [extendFrom, setExtendFrom] = useState(today);
  const [extendUntil, setExtendUntil] = useState(addMonths(today, 3));

  // ── Interval penjemputan ──────────────────────────────────────────────────
  // Default: kontributor = 0 (tidak perlu dijemput, antar sendiri)
  //          dampak/strategis = ambil dari data partner jika sudah ada, fallback 3
  const defaultInterval =
    partner.package_type === "kontributor"
      ? 0
      : (partner.pickup_interval_days ?? 3);
  const [pickupInterval, setPickupInterval] = useState(defaultInterval);

  const isDecidable =
    partner.status === "pending" || partner.status === "review";
  const isActive = partner.status === "active";
  const isInactive = partner.status === "inactive";
  const isRejected = partner.status === "rejected";
  const expState = getExpiryState(partner);
  const showRenew =
    isActive && (expState === "urgent" || expState === "expired");
  const btnBase: React.CSSProperties = { opacity: actionLoading ? 0.6 : 1 };

  return (
    <div className="flex flex-col h-full">
      {/* Header — tombol X di kanan atas */}
      <div
        className="px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <p
              className="font-display font-semibold leading-tight mb-1 truncate"
              style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}
            >
              {partner.organization}
            </p>
            <p
              className="text-[10px]"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {formatDate(partner.submitted_at)} ·{" "}
              {timeAgo(partner.submitted_at)}
            </p>
          </div>

          {/* Kanan: tombol X (atas) + StatusPill (bawah) */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-5 h-5 rounded flex items-center justify-center transition-all"
              style={{
                color: "var(--text-muted)",
                border: "0.5px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
              aria-label="Tutup detail"
            >
              <i className="fas fa-times text-[9px]" aria-hidden />
            </button>
            <StatusPill status={partner.status} />
            {expState !== "none" && expState !== "ok" && (
              <ExpiryLabel partner={partner} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <PackageBadge type={partner.package_type} />
          <SourceBadge platform={partner.source_platform} />
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Masa aktif (hanya jika sudah active + ada tanggal) */}
        {isActive && partner.active_from && (
          <>
            <SLabel>Masa Aktif</SLabel>
            <div className="flex flex-col gap-2">
              <DetailRow
                label="Mulai"
                value={formatDateShort(partner.active_from)}
              />
              <DetailRow
                label="Berakhir"
                value={
                  partner.active_until
                    ? formatDateShort(partner.active_until)
                    : "Tidak berbatas"
                }
              />
            </div>
            <Divider />
          </>
        )}

        <SLabel>Kontak PIC</SLabel>
        <div className="flex flex-col gap-2">
          <DetailRow label="Nama" value={partner.pic_name} />
          <DetailRow label="Phone" value={partner.phone || "—"} />
          <DetailRow label="Email" value={partner.email || "—"} />
        </div>
        <Divider />

        <SLabel>Detail Usaha</SLabel>
        <div className="flex flex-col gap-2">
          <DetailRow label="Jenis" value={partner.jenis_usaha} />
          <DetailRow label="Volume" value={partner.volume_limbah} />
        </div>
        <Divider />

        <SLabel>Lokasi</SLabel>
        <div className="flex flex-col gap-2">
          <DetailRow label="Kota" value={partner.kota_nama} />
          <DetailRow label="Kecamatan" value={partner.kecamatan_nama} />
          <DetailRow label="Kelurahan" value={partner.kelurahan_nama} />
          <DetailRow label="Alamat" value={partner.alamat_detail} />
        </div>

        {partner.message && (
          <>
            <Divider />
            <SLabel>Catatan Pendaftar</SLabel>
            <p
              className="text-[12px] leading-relaxed px-3 py-2.5 rounded-md"
              style={{
                color: "var(--text-secondary)",
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--border-subtle)",
                fontStyle: "italic",
              }}
            >
              {partner.message}
            </p>
          </>
        )}

        {/* Duration picker — saat review */}
        {isDecidable && (
          <>
            <Divider />
            <SLabel>Masa Aktif Kemitraan</SLabel>
            <DurationPicker
              packageType={partner.package_type}
              activeFrom={activeFrom}
              activeUntil={activeUntil}
              onActiveFromChange={setActiveFrom}
              onActiveUntilChange={setActiveUntil}
            />
          </>
        )}

        {/* ── Frekuensi Penjemputan — tampil saat review dan saat aktif ──── */}
        {(isDecidable || isActive) &&
          partner.package_type !== "kontributor" && (
            <>
              <Divider />
              <SLabel>Frekuensi Penjemputan</SLabel>

              {/* Preset buttons */}
              <div className="flex gap-2 mb-3">
                {[2, 3, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() => setPickupInterval(d)}
                    className="flex-1 py-1.5 rounded text-[11px] transition-all"
                    style={{
                      background:
                        pickupInterval === d
                          ? "var(--coffee-latte)"
                          : "var(--bg-elevated)",
                      color:
                        pickupInterval === d
                          ? "var(--bg-primary)"
                          : "var(--text-secondary)",
                      border: `0.5px solid ${
                        pickupInterval === d
                          ? "var(--coffee-latte)"
                          : "var(--border-subtle)"
                      }`,
                    }}
                  >
                    {d === 7 ? "1× seminggu" : `${d} hari`}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Atau atur manual:
                </span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={pickupInterval}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 1 && v <= 30) setPickupInterval(v);
                  }}
                  className="w-14 px-2 py-1 rounded text-center text-[12px] outline-none"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "0.5px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  hari sekali
                </span>
              </div>

              {/* Preview jadwal berikutnya */}
              {pickupInterval > 0 && (
                <div
                  className="rounded-md px-3 py-2"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "0.5px solid var(--border-subtle)",
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-wider mb-1.5"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-space-mono)",
                    }}
                  >
                    Estimasi jadwal
                  </p>
                  {(() => {
                    const base = partner.last_pickup_date
                      ? new Date(partner.last_pickup_date + "T00:00:00")
                      : new Date(activeFrom + "T00:00:00");
                    const fmt = (d: Date) =>
                      d.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                    return (
                      <div className="flex flex-col gap-1">
                        {partner.last_pickup_date && (
                          <p
                            className="text-[11px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Terakhir dijemput: <strong>{fmt(base)}</strong>
                          </p>
                        )}
                        <div className="flex gap-2 flex-wrap mt-0.5">
                          {[1, 2, 3].map((n) => {
                            const d = new Date(base);
                            d.setDate(d.getDate() + pickupInterval * n);
                            return (
                              <span
                                key={n}
                                className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(196,136,47,0.1)",
                                  color: "var(--coffee-latte)",
                                  border: "0.5px solid rgba(196,136,47,0.25)",
                                }}
                              >
                                {fmt(d)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Info last_pickup_date untuk partner aktif */}
              {isActive && (
                <p
                  className="text-[10px] mt-2"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-space-mono)",
                  }}
                >
                  {partner.last_pickup_date
                    ? `Terakhir dijemput: ${new Date(partner.last_pickup_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Belum pernah dijemput — last_pickup_date akan terisi otomatis setelah collector submit stop pertama."}
                </p>
              )}
            </>
          )}

        {/* Perpanjang — saat urgent/expired */}
        {showRenew && (
          <>
            <Divider />
            <div className="flex items-center justify-between mb-2.5">
              <SLabel>Perpanjang Masa Aktif</SLabel>
              <button
                onClick={() => setShowExtend(!showExtend)}
                className="text-[10px] transition-colors"
                style={{
                  color: showExtend
                    ? "var(--text-muted)"
                    : "var(--coffee-latte)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                {showExtend ? "Batalkan" : "Atur Durasi →"}
              </button>
            </div>
            {showExtend && (
              <DurationPicker
                packageType={partner.package_type}
                activeFrom={extendFrom}
                activeUntil={extendUntil}
                onActiveFromChange={setExtendFrom}
                onActiveUntilChange={setExtendUntil}
              />
            )}
          </>
        )}

        <Divider />
        <SLabel>
          Catatan Internal{" "}
          <span className="normal-case opacity-60" style={{ letterSpacing: 0 }}>
            (tidak terlihat mitra)
          </span>
        </SLabel>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Tulis catatan review…"
          rows={3}
          className="w-full rounded-md px-3 py-2 text-[12px] outline-none resize-none transition-colors"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            fontStyle: "italic",
            lineHeight: "1.7",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-strong)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-subtle)")
          }
        />

        {partner.reviewed_by && (
          <p
            className="text-[10px] mt-2"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            {partner.status === "active"
              ? "Disetujui"
              : partner.status === "rejected"
                ? "Ditolak"
                : "Ditinjau"}{" "}
            oleh {partner.reviewed_by}
            {partner.reviewed_at && ` · ${timeAgo(partner.reviewed_at)}`}
          </p>
        )}
      </div>

      {/* Footer — fixed 2 zona */}
      <div
        className="px-5 py-3 flex gap-2 flex-shrink-0"
        style={{
          borderTop: "0.5px solid var(--border-subtle)",
          minHeight: "56px",
        }}
      >
        {/* Pending / Review */}
        {isDecidable && (
          <>
            <button
              onClick={() => onAction({ type: "reject" })}
              disabled={actionLoading}
              className="flex-1 py-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
              style={{
                ...btnBase,
                background: "rgba(248,113,113,0.07)",
                color: "#f87171",
                border: "0.5px solid rgba(248,113,113,0.25)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(248,113,113,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(248,113,113,0.07)")
              }
            >
              <i className="fas fa-times text-[9px]" aria-hidden /> Tolak
            </button>
            <button
              onClick={() =>
                onAction({
                  type: "approve",
                  activeFrom,
                  activeUntil:
                    partner.package_type === "kontributor"
                      ? null
                      : activeUntil || null,
                  pickupIntervalDays: pickupInterval,
                })
              }
              disabled={
                actionLoading ||
                (partner.package_type !== "kontributor" && !activeUntil)
              }
              className="flex-[2] py-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
              style={{
                ...btnBase,
                background: "rgba(122,171,126,0.12)",
                color: "var(--forest-sage)",
                border: "0.5px solid rgba(122,171,126,0.35)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(122,171,126,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(122,171,126,0.12)")
              }
            >
              {actionLoading ? (
                <i
                  className="fas fa-circle-notch fa-spin text-[9px]"
                  aria-hidden
                />
              ) : (
                <i className="fas fa-check text-[9px]" aria-hidden />
              )}
              Approve & Aktivasi
            </button>
          </>
        )}

        {/* Active */}
        {isActive && (
          <>
            {showRenew && (
              <a
                href={buildMailto(partner)}
                className="flex-1 py-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: "rgba(196,149,106,0.08)",
                  color: "var(--coffee-latte)",
                  border: "0.5px solid rgba(196,149,106,0.28)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(196,149,106,0.16)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(196,149,106,0.08)")
                }
              >
                <i className="fas fa-envelope text-[9px]" aria-hidden /> Kirim
                Reminder
              </a>
            )}
            {showRenew && showExtend && extendUntil && (
              <button
                onClick={() =>
                  onAction({ type: "extend", activeUntil: extendUntil })
                }
                disabled={actionLoading}
                className="flex-[2] py-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
                style={{
                  ...btnBase,
                  background: "rgba(122,171,126,0.12)",
                  color: "var(--forest-sage)",
                  border: "0.5px solid rgba(122,171,126,0.35)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(122,171,126,0.22)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(122,171,126,0.12)")
                }
              >
                {actionLoading ? (
                  <i
                    className="fas fa-circle-notch fa-spin text-[9px]"
                    aria-hidden
                  />
                ) : (
                  <i className="fas fa-calendar-check text-[9px]" aria-hidden />
                )}
                Konfirmasi Perpanjangan
              </button>
            )}
            <button
              onClick={() => onAction({ type: "deactivate" })}
              disabled={actionLoading}
              className="py-2 px-3 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
              style={{
                ...btnBase,
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "0.5px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f87171";
                e.currentTarget.style.borderColor = "rgba(248,113,113,0.40)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
            >
              <i className="fas fa-ban text-[9px]" aria-hidden /> Nonaktifkan
            </button>
          </>
        )}

        {/* Inactive */}
        {isInactive && (
          <button
            onClick={() => onAction({ type: "reactivate" })}
            disabled={actionLoading}
            className="flex-1 py-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
            style={{
              ...btnBase,
              background: "var(--teal-bg)",
              color: "var(--teal)",
              border: "0.5px solid var(--teal-border)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(45,128,128,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--teal-bg)")
            }
          >
            <i className="fas fa-redo text-[9px]" aria-hidden /> Reaktivasi
          </button>
        )}

        {/* Rejected */}
        {isRejected && (
          <button
            onClick={() => onAction({ type: "reconsider" })}
            disabled={actionLoading}
            className="flex-1 py-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
            style={{
              ...btnBase,
              background: "rgba(196,149,106,0.08)",
              color: "var(--coffee-latte)",
              border: "0.5px solid rgba(196,149,106,0.28)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(196,149,106,0.16)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(196,149,106,0.08)")
            }
          >
            <i className="fas fa-rotate-left text-[9px]" aria-hidden />{" "}
            Pertimbangkan Ulang
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main — PartnerSection
// ─────────────────────────────────────────────────────────────────────────────

export default function PartnerSection() {
  const { session } = useAuthModal();
  const { show } = useDashToast();
  const [partners, setPartners] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PartnerApplication | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPartners(await fetchPartnerApplications());
    } catch {
      setError("Gagal memuat data. Periksa koneksi Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  // Klik item: toggle (klik sama = tutup), auto-move pending→review
  async function handleSelect(partner: PartnerApplication) {
    if (selected?.id === partner.id) {
      setSelected(null);
      return;
    }
    setSelected(partner);
    if (partner.status === "pending") {
      try {
        await updatePartnerStatus(partner.id, "review");
        const updated = { ...partner, status: "review" as ApplicationStatus };
        setPartners((prev) =>
          prev.map((p) => (p.id === partner.id ? updated : p)),
        );
        setSelected(updated);
      } catch {
        show(
          "Gagal memperbarui status ke Review. Data tetap tersimpan.",
          "error",
        );
      }
    }
  }

  // Ganti filter → tutup detail panel
  function handleFilterChange(tab: FilterTab) {
    setFilter(tab);
    setSelected(null);
  }

  async function handleAction(action: DrawerAction) {
    if (!selected || !session) return;
    setActionLoading(true);
    try {
      if (action.type === "approve") {
        await approvePartner(
          selected.id,
          session.name,
          action.activeFrom,
          action.activeUntil,
          action.pickupIntervalDays,
        );
        const updated: PartnerApplication = {
          ...selected,
          status: "active",
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.name,
          active_from: action.activeFrom,
          active_until: action.activeUntil,
          pickup_interval_days: action.pickupIntervalDays,
        };
        setPartners((prev) =>
          prev.map((p) => (p.id === selected.id ? updated : p)),
        );
        setSelected(updated);
        show(
          action.activeUntil
            ? `✓ ${selected.organization} diaktifkan hingga ${formatDateShort(action.activeUntil)}`
            : `✓ ${selected.organization} diaktifkan — tidak berbatas`,
          "success",
        );
      } else if (action.type === "extend") {
        await extendPartner(selected.id, session.name, action.activeUntil);
        const updated: PartnerApplication = {
          ...selected,
          active_until: action.activeUntil,
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.name,
        };
        setPartners((prev) =>
          prev.map((p) => (p.id === selected.id ? updated : p)),
        );
        setSelected(updated);
        show(
          `Masa aktif ${selected.organization} diperpanjang hingga ${formatDateShort(action.activeUntil)}`,
          "success",
        );
      } else {
        const newStatus = ACTION_STATUS_MAP[action.type];
        await updatePartnerStatus(selected.id, newStatus, session.name);
        const updated: PartnerApplication = {
          ...selected,
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.name,
        };
        setPartners((prev) =>
          prev.map((p) => (p.id === selected.id ? updated : p)),
        );
        setSelected(updated);

        const successMsg: Record<typeof action.type, string> = {
          reject: `${selected.organization} ditolak`,
          deactivate: `${selected.organization} dinonaktifkan`,
          reactivate: `${selected.organization} dikembalikan ke Review`,
          reconsider: `${selected.organization} dikembalikan ke Review`,
        };
        show(successMsg[action.type], "success");
      }
    } catch {
      const errorMsg: Record<DrawerAction["type"], string> = {
        approve: `Gagal mengaktifkan ${selected.organization}. Coba lagi.`,
        reject: `Gagal menolak ${selected.organization}. Coba lagi.`,
        deactivate: `Gagal menonaktifkan ${selected.organization}. Coba lagi.`,
        reactivate: `Gagal memperbarui status. Coba lagi.`,
        reconsider: `Gagal memperbarui status. Coba lagi.`,
        extend: `Gagal memperpanjang masa aktif. Coba lagi.`,
      };
      show(errorMsg[action.type], "error");
    } finally {
      setActionLoading(false);
    }
  }

  // Sort + filter logic
  const sorted = sortPartners(partners);

  const getFiltered = (tab: FilterTab) => {
    if (tab === "all") return sorted;
    if (tab === "expiring")
      return sorted.filter((p) => getComputedState(p) === "expiring");
    if (tab === "tidak-aktif")
      return sorted.filter(
        (p) => getComputedState(p) === "expired" || p.status === "inactive",
      );
    return sorted.filter((p) => p.status === tab);
  };

  const filtered = getFiltered(filter);

  const countFor = (tab: FilterTab): number => getFiltered(tab).length;

  const pendingCount = partners.filter((p) => p.status === "pending").length;

  if (loading)
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <i
          className="fas fa-circle-notch fa-spin text-sm"
          style={{ color: "var(--text-muted)" }}
          aria-hidden
        />
        <span
          className="text-sm tracking-widest uppercase"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-space-mono)",
          }}
        >
          Memuat data partner…
        </span>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <i
          className="fas fa-exclamation-circle text-2xl"
          style={{ color: "#f87171" }}
          aria-hidden
        />
        <p
          className="text-sm"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-space-mono)",
          }}
        >
          {error}
        </p>
        <button
          onClick={loadPartners}
          className="px-4 py-2 rounded-md text-xs transition-all"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            border: "0.5px solid var(--border-default)",
          }}
        >
          <i className="fas fa-redo mr-1.5" aria-hidden /> Coba lagi
        </button>
      </div>
    );

  return (
    <div>
      <div className="mb-5">
        <h2 className="dash-section-title">Partner Management</h2>
        <p className="dash-section-sub">
          {pendingCount > 0
            ? `${pendingCount} pendaftaran baru menunggu review`
            : "Semua pendaftaran telah diproses"}
        </p>
      </div>

      <KpiRow partners={partners} />

      {/* Filter tabs — ganti filter juga tutup detail */}
      <div className="dash-stab-bar" style={{ marginBottom: 0 }}>
        {FILTER_TABS.map((tab) => {
          const count = countFor(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`dash-stab ${filter === tab.id ? "active" : ""}`}
              style={
                tab.urgent && count > 0 && filter !== tab.id
                  ? { color: "#f87171" }
                  : {}
              }
            >
              {tab.label}
              {count > 0 && (
                <span
                  className="dash-tab-badge"
                  style={
                    filter === tab.id
                      ? {
                          background: "rgba(196,149,106,0.20)",
                          color: "var(--coffee-latte)",
                        }
                      : tab.urgent
                        ? {
                            background: "rgba(248,113,113,0.12)",
                            color: "#f87171",
                          }
                        : {}
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Split-pane */}
      <div
        className="rounded-b-lg rounded-tr-lg overflow-hidden flex"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderTop: "none",
          height: "calc(100vh - 260px)",
          minHeight: "440px",
        }}
      >
        {/* List */}
        <div
          className="flex flex-col flex-shrink-0 overflow-y-auto"
          style={{
            width: "290px",
            borderRight: "0.5px solid var(--border-subtle)",
          }}
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <i
                className="fas fa-users text-xl"
                style={{ color: "var(--text-muted)" }}
                aria-hidden
              />
              <p
                className="text-[11px]"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                Tidak ada data
              </p>
            </div>
          ) : (
            filtered.map((p) => (
              <PartnerListItem
                key={p.id}
                partner={p}
                isSelected={selected?.id === p.id}
                onClick={() => handleSelect(p)}
              />
            ))
          )}
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <PartnerDetail
              partner={selected}
              note={notes[selected.id] ?? ""}
              onNoteChange={(v) =>
                setNotes((prev) => ({ ...prev, [selected.id]: v }))
              }
              onAction={handleAction}
              actionLoading={actionLoading}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <i
                className="fas fa-user-tie text-3xl"
                style={{ color: "var(--text-muted)", opacity: 0.4 }}
                aria-hidden
              />
              <p
                className="text-[12px]"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                Pilih partner untuk melihat detail
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
