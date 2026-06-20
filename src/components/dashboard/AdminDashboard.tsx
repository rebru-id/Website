"use client";
// src/components/dashboard/AdminDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FASE 8 — Bio Conversion
//
// Perubahan dari Fase 7 (ditandai ← FASE 8):
//   1. Tambah import BioConversionSection
//   2. Ganti <PlaceholderSection id="bio" /> dengan <BioConversionSection />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import { DashToastProvider } from "@/components/dashboard/DashToastContext";
import BlogManagementTab from "@/components/dashboard/BlogManagementTab";
import MessageSection from "@/components/dashboard/sections/MessageSection";
import PartnerSection from "@/components/dashboard/sections/PartnerSection";
import ProductsSection from "@/components/dashboard/sections/ProductsSection";
import OperationalSection from "@/components/dashboard/sections/OperationalSection";
import BioConversionSection from "@/components/dashboard/sections/BioConversionSection";
import EsgSection from "@/components/dashboard/sections/EsgSection";

import { fetchTodayRoutes } from "@/lib/supabase-collector";
import {
  fetchPartnerApplications,
  computePartnerBadge,
} from "@/lib/supabase-partner";
import OverviewSection from "@/components/dashboard/sections/OverviewSection";
import { countUnreadMessages } from "@/lib/supabase-messages";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SectionId =
  | "overview"
  | "operasional"
  | "partner"
  | "products"
  | "bio"
  | "esg"
  | "blog"
  | "pesan";

interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: "red" | "amber";
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ id: "overview", label: "Overview", icon: "fa-home" }],
  },
  {
    label: "Operasional",
    items: [
      {
        id: "operasional",
        label: "Operasional",
        icon: "fa-calendar-week",
      },
    ],
  },
  {
    label: "Manajemen",
    items: [
      {
        id: "partner",
        label: "Partner Management",
        icon: "fa-handshake",
      },
      { id: "products", label: "Produk & Penjualan", icon: "fa-box" },
      { id: "bio", label: "Bio Conversion", icon: "fa-flask" },
      { id: "esg", label: "ESG Report", icon: "fa-chart-bar" },
    ],
  },
  {
    label: "Konten",
    items: [
      { id: "blog", label: "Blog", icon: "fa-newspaper" },
      {
        id: "pesan",
        label: "Pesan Masuk",
        icon: "fa-envelope",
      },
    ],
  },
];

const SECTION_TITLES: Record<SectionId, string> = {
  overview: "Overview",
  operasional: "Operasional",
  partner: "Partner Management",
  products: "Produk & Penjualan",
  bio: "Bio Conversion",
  esg: "ESG Report",
  blog: "Blog Management",
  pesan: "Pesan Masuk",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// PlaceholderSection
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderSection({ id }: { id: SectionId }) {
  const title = SECTION_TITLES[id];
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          color: "var(--text-muted)",
        }}
      >
        <i
          className={cn(
            "fas",
            NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === id)?.icon ??
              "fa-circle",
          )}
        />
      </div>
      <div className="text-center">
        <p
          className="font-display text-xl font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </p>
        <p
          className="text-xs tracking-widest uppercase"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-space-mono)",
          }}
        >
          Fase berikutnya — konten sedang dibangun
        </p>
      </div>
      <div
        className="px-3 py-1.5 rounded-md text-xs tracking-wider"
        style={{
          background: "rgba(196,149,106,0.07)",
          border: "1px solid rgba(196,149,106,0.15)",
          color: "var(--coffee-latte)",
          fontFamily: "var(--font-space-mono)",
        }}
      >
        section/{id} · placeholder
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LiveDateChip
// ─────────────────────────────────────────────────────────────────────────────

function LiveDateChip() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const DAYS = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const now = new Date();
    setLabel(
      `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    );
  }, []);
  if (!label) return null;
  return <span className="dash-date-chip">{label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({
  active,
  onSelect,
  name,
  onLogout,
  badges,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  name: string;
  onLogout: () => void;
  badges: Partial<Record<SectionId, number>>;
}) {
  const initials = getInitials(name);
  return (
    <aside className="dash-sidebar">
      <div
        className="flex items-center gap-2.5 px-3.5 py-4"
        style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{
            background: "var(--coffee-latte)",
            color: "var(--bg-primary)",
          }}
        >
          R
        </div>
        <div>
          <p
            className="font-display font-semibold leading-tight"
            style={{ fontSize: "14px", color: "var(--text-primary)" }}
          >
            rebru
          </p>
          <p
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
              letterSpacing: "0.08em",
            }}
          >
            Admin Panel
          </p>
        </div>
      </div>
      <nav className="nav-scroll flex-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="dash-nav-group">{group.label}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn("dash-nav-item", active === item.id && "active")}
              >
                <i className={cn("fas", item.icon)} />
                <span className="flex-1 text-left">{item.label}</span>
                {(badges[item.id] ?? 0) > 0 && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-px rounded-full leading-none"
                    style={{
                      background:
                        item.id === "partner"
                          ? "rgba(196,136,47,0.15)"
                          : "rgba(160,72,72,0.15)",
                      color:
                        item.id === "partner"
                          ? "var(--coffee-latte)"
                          : "var(--color-error)",
                      border: `0.5px solid ${item.id === "partner" ? "rgba(196,136,47,0.4)" : "rgba(160,72,72,0.4)"}`,
                      fontFamily: "var(--font-space-mono)",
                    }}
                  >
                    {badges[item.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3"
        style={{ borderTop: "0.5px solid var(--border-subtle)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: "rgba(196,149,106,0.15)",
            border: "0.5px solid var(--coffee-latte)",
            color: "var(--coffee-latte)",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="truncate font-medium leading-tight"
            style={{ fontSize: "12px", color: "var(--text-primary)" }}
          >
            {name}
          </p>
          <p
            className="truncate"
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            admin
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all"
          title="Logout"
          style={{
            border: "0.5px solid var(--border-subtle)",
            color: "var(--text-muted)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-error)";
            e.currentTarget.style.color = "var(--color-error)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <i className="fas fa-sign-out-alt text-xs" />
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Topbar
// ─────────────────────────────────────────────────────────────────────────────

function Topbar({ active }: { active: SectionId }) {
  return (
    <header className="dash-topbar">
      <h1
        className="flex-1 font-medium"
        style={{ fontSize: "13px", color: "var(--text-primary)" }}
      >
        {SECTION_TITLES[active]}
      </h1>
      <LiveDateChip />
      <button
        className="relative w-7 h-7 flex items-center justify-center rounded-md transition-all flex-shrink-0"
        style={{
          border: "0.5px solid var(--border-subtle)",
          color: "var(--text-muted)",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        <i className="fas fa-bell text-xs" />
        <span
          className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
          style={{
            background: "var(--color-error)",
            border: "1.5px solid var(--bg-surface)",
          }}
        />
      </button>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Guard
// ─────────────────────────────────────────────────────────────────────────────

function MobileGuard() {
  return (
    <div className="dash-mobile-guard">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2"
        style={{
          background: "rgba(196,149,106,0.1)",
          border: "1px solid var(--border-default)",
          color: "var(--coffee-latte)",
        }}
      >
        <i className="fas fa-desktop" />
      </div>
      <p
        className="font-display text-xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Buka di Desktop
      </p>
      <p
        className="text-sm max-w-xs leading-relaxed text-center"
        style={{ color: "var(--text-muted)" }}
      >
        Admin panel dirancang untuk layar desktop (min. 1024px). Gunakan laptop
        atau monitor untuk mengakses dashboard ini.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminDashboard — komponen utama
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { session, setSession, sessionLoading } = useAuthModal();
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("overview");
  const [badgeOps, setBadgeOps] = useState(0);
  const [badgePartner, setBadgePartner] = useState(0);
  const [badgePesan, setBadgePesan] = useState(0);

  const fetchBadges = useCallback(async () => {
    try {
      const supabase = createClient();

      // Badge Operasional: jumlah collector status alert hari ini
      const routes = await fetchTodayRoutes();
      const alertCount = routes.filter((r: any) => {
        const lastDone = [...(r.stops ?? [])]
          .filter((s: any) => s.status !== "pending")
          .sort((a: any, b: any) =>
            (b.completed_at ?? "").localeCompare(a.completed_at ?? ""),
          )[0];
        const minsAgo = lastDone?.completed_at
          ? Math.floor(
              (Date.now() - new Date(lastDone.completed_at).getTime()) / 60_000,
            )
          : r.stops_done === 0
            ? 999
            : 0;
        const overdueStops = (r.stops ?? []).filter(
          (s: any) =>
            s.status === "pending" &&
            s.scheduled_time &&
            s.scheduled_time < new Date().toTimeString().slice(0, 5),
        );
        return overdueStops.length > 0 && minsAgo > 75;
      }).length;
      setBadgeOps(alertCount);

      // Badge Partner: pending + expiring ≤3 hari
      const partners = await fetchPartnerApplications();
      setBadgePartner(computePartnerBadge(partners));

      // Badge Pesan: pakai countUnreadMessages() dari supabase-messages
      // — sumber tunggal, tidak ada duplikasi query inline
      const unreadCount = await countUnreadMessages();
      setBadgePesan(unreadCount);
    } catch (err) {
      console.error("fetchBadges gagal:", err);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 60_000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  function handleLogout() {
    setSession(null);
    router.replace("/");
  }

  // ── Session guard — tiga kondisi ──────────────────────────────────────────
  // 1. sessionLoading = true  → getSession() belum selesai → tampilkan skeleton
  //    (mencegah flash kosong dan adminName jatuh ke "Admin" literal)
  // 2. session null setelah loading → memang tidak login → return null
  // 3. role bukan admin → salah role → return null
  if (sessionLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <i
            className="fas fa-circle-notch fa-spin text-xl"
            style={{ color: "var(--text-muted)" }}
          />
          <p
            className="font-mono text-[0.65rem] tracking-[0.12em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Memuat sesi...
          </p>
        </div>
      </div>
    );
  }

  if (!session || session.role !== "admin") return null;

  return (
    <DashToastProvider>
      <MobileGuard />
      <div
        className="dash-admin-shell"
        style={{
          height: "100vh",
          background: "var(--bg-primary)",
          overflow: "hidden",
        }}
      >
        <Sidebar
          active={active}
          onSelect={setActive}
          name={session.name}
          onLogout={handleLogout}
          badges={{
            operasional: badgeOps,
            partner: badgePartner,
            pesan: badgePesan,
          }}
        />
        <div className="dash-content-area">
          <Topbar active={active} />
          <main className="dash-scroll">
            <div className="dash-panel">
              {active === "overview" && (
                <OverviewSection
                  onNavigate={(s) => setActive(s as SectionId)}
                  adminName={session?.name ?? "Admin"}
                />
              )}
              {active === "operasional" && <OperationalSection />}
              {active === "partner" && <PartnerSection />}
              {active === "products" && <ProductsSection />}
              {/* ── FASE 8: Bio Conversion ── */}
              {active === "bio" && <BioConversionSection />} {/* ← FASE 8 */}
              {active === "esg" && <EsgSection />}
              {active === "blog" && <BlogManagementTab />}
              {active === "pesan" && (
                <MessageSection
                  onUnreadCount={(count) => setBadgePesan(count)}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </DashToastProvider>
  );
}
