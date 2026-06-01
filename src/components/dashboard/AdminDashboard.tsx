"use client";
// src/components/dashboard/AdminDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FASE 8 — Bio Conversion
//
// Perubahan dari Fase 7 (ditandai ← FASE 8):
//   1. Tambah import BioConversionSection
//   2. Ganti <PlaceholderSection id="bio" /> dengan <BioConversionSection />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
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

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SectionId =
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
    label: "Operasional",
    items: [
      {
        id: "operasional",
        label: "Operasional",
        icon: "fa-calendar-week",
        badge: 2,
        badgeColor: "red",
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
        badge: 5,
        badgeColor: "amber",
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
        badge: 3,
        badgeColor: "red",
      },
    ],
  },
];

const SECTION_TITLES: Record<SectionId, string> = {
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
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  name: string;
  onLogout: () => void;
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
                {item.badge !== undefined && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-px rounded-full leading-none"
                    style={{
                      background:
                        item.badgeColor === "red"
                          ? "rgba(160,72,72,0.15)"
                          : "rgba(196,136,47,0.15)",
                      color:
                        item.badgeColor === "red"
                          ? "var(--color-error)"
                          : "var(--coffee-latte)",
                      border: `0.5px solid ${item.badgeColor === "red" ? "rgba(160,72,72,0.4)" : "rgba(196,136,47,0.4)"}`,
                      fontFamily: "var(--font-space-mono)",
                    }}
                  >
                    {item.badge}
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
  const { session, setSession } = useAuthModal();
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("operasional");

  function handleLogout() {
    setSession(null);
    router.replace("/");
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
        />
        <div className="dash-content-area">
          <Topbar active={active} />
          <main className="dash-scroll">
            <div className="dash-panel">
              {active === "operasional" && <OperationalSection />}
              {active === "partner" && <PartnerSection />}
              {active === "products" && <ProductsSection />}
              {/* ── FASE 8: Bio Conversion ── */}
              {active === "bio" && <BioConversionSection />} {/* ← FASE 8 */}
              {active === "esg" && <EsgSection />}
              {active === "blog" && <BlogManagementTab />}
              {active === "pesan" && <MessageSection />}
            </div>
          </main>
        </div>
      </div>
    </DashToastProvider>
  );
}
