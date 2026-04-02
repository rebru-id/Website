"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuthModal } from "./AuthModalContext";
import { type UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Tab config per role
// ─────────────────────────────────────────────────────────────────────────────

interface Tab { id: string; label: string; icon: string; }

const TABS_BY_ROLE: Record<UserRole, Tab[]> = {
  admin: [
    { id: "overview",  label: "Overview",    icon: "fa-home"         },
    { id: "waste",     label: "Waste Log",   icon: "fa-recycle"      },
    { id: "partners",  label: "Partners",    icon: "fa-handshake"    },
    { id: "esg",       label: "ESG",         icon: "fa-chart-bar"    },
    { id: "reports",   label: "Reports",     icon: "fa-file-download"},
  ],
  mitra: [
    { id: "overview",     label: "My Dashboard",     icon: "fa-home"       },
    { id: "waste",        label: "Contribution Log", icon: "fa-recycle"    },
    { id: "impact",       label: "Impact",           icon: "fa-leaf"       },
    { id: "certificate",  label: "Certificate",      icon: "fa-certificate"},
  ],
  government: [
    { id: "overview", label: "Impact Summary", icon: "fa-home"         },
    { id: "esg",      label: "ESG Data",       icon: "fa-chart-bar"    },
    { id: "reports",  label: "Public Reports", icon: "fa-file-download"},
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="dash-stat-card">
      <p className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-ink-ghost mb-3">{label}</p>
      <p className="font-display text-[2.2rem] font-bold text-coffee-foam leading-none">
        {value}
        {unit && <span className="text-[0.9rem] text-ink-dim font-normal ml-1">{unit}</span>}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Content renderer
// ─────────────────────────────────────────────────────────────────────────────

function TabContent({ tabId, role }: { tabId: string; role: UserRole }) {
  const supabaseNote = (table: string) => (
    <div className="mt-4 bg-forest-dark/30 border border-forest-leaf/20 rounded-md p-6">
      <p className="font-mono text-[0.72rem] text-forest-sage tracking-[0.1em]">
        ⚡ SUPABASE READY — Connect to load live data from:{" "}
        <span className="text-ink-ghost">{table}</span>
      </p>
    </div>
  );

  const emptyTable = (cols: string[], tableNote: string) => (
    <div className="overflow-x-auto border border-white/6 rounded-md">
      <table className="dash-table">
        <thead>
          <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={cols.length} className="text-center py-10">
              <i className="fas fa-database text-2xl mb-2 block opacity-20" />
              <span className="text-ink-ghost text-[0.82rem]">
                Connect Supabase to load {tableNote}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  switch (tabId) {
    case "overview":
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Waste Collected" value="—" unit="kg" />
            <StatCard label="CO₂ Saved"             value="—" unit="ton" />
            <StatCard label="Active Partners"        value="—" />
            <StatCard label="Products Sold"          value="—" />
          </div>
          {supabaseNote("global_stats → waste_collections → impact_logs → mitra → order_items")}
        </>
      );

    case "waste":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-coffee-foam mb-5">
            {role === "mitra" ? "Contribution Log" : "Waste Collection Records"}
          </h3>
          {emptyTable(["Date", "Mitra", "Waste Type", "Weight (kg)", "Status"], "waste_collections")}
        </>
      );

    case "partners":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-coffee-foam mb-5">Partner Applications</h3>
          {emptyTable(["Name", "Organization", "Type", "Applied", "Status"], "partner_applications")}
        </>
      );

    case "impact":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-coffee-foam mb-5">Your Impact Summary</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatCard label="Waste Contributed" value="—" unit="kg" />
            <StatCard label="CO₂ Avoided"       value="—" unit="ton" />
          </div>
          {supabaseNote("impact_logs")}
        </>
      );

    case "esg":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-coffee-foam mb-5">ESG Scorecard</h3>
          {[
            { cat: "ENVIRONMENT (E)", items: ["Waste Diverted: — kg", "CO₂e Avoided: — ton"] },
            { cat: "SOCIAL (S)",      items: ["Contributors Engaged: —", "Community Impact: —"] },
            { cat: "GOVERNANCE (G)",  items: ["Data Verification: —", "Traceability: Full (architecture ready)"] },
          ].map(({ cat, items }) => (
            <div key={cat} className="bg-white/[0.02] border border-white/6 rounded-md p-7 mb-4">
              <h4 className="font-mono text-[0.72rem] tracking-[0.15em] uppercase text-ink-ghost mb-4 flex items-center gap-2.5">
                {cat}
                <span className="px-2.5 py-0.5 rounded-pill bg-forest-moss/30 text-forest-sage text-[0.65rem]">
                  Score: Pending
                </span>
              </h4>
              {items.map((item) => (
                <p key={item} className="text-[0.9rem] text-ink-dim mb-1.5">{item}</p>
              ))}
            </div>
          ))}
        </>
      );

    case "reports":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-coffee-foam mb-5">Reports & Exports</h3>
          <div className="bg-white/[0.02] border border-white/6 rounded-md p-7">
            <p className="text-ink-dim text-[0.88rem] mb-6">
              Reports will be generated from live Supabase data.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Executive Summary",     icon: "fa-file-pdf",   cls: "bg-forest-moss/25 border-forest-leaf/30 text-forest-sage" },
                { label: "Sustainability Report", icon: "fa-file-pdf",   cls: "bg-forest-moss/25 border-forest-leaf/30 text-forest-sage" },
                { label: "Export Data (Excel)",   icon: "fa-file-excel", cls: "bg-coffee-latte/10 border-coffee-latte/20 text-coffee-latte" },
              ].map(({ label, icon, cls }) => (
                <button
                  key={label}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-md border text-[0.82rem] tracking-[0.08em] uppercase transition-all hover:brightness-110",
                    cls
                  )}
                  onClick={() => alert("Connect Supabase to enable export")}
                >
                  <i className={`fas ${icon}`} /> {label}
                </button>
              ))}
            </div>
          </div>
        </>
      );

    case "certificate":
      return (
        <div className="border-2 border-coffee-latte/20 rounded-lg p-16 text-center max-w-[560px] mx-auto bg-gradient-to-br from-coffee-mid/20 to-forest-moss/15">
          <div className="text-[3rem] text-gold mb-5">
            <i className="fas fa-certificate" />
          </div>
          <h3 className="font-display text-[1.8rem] text-coffee-foam mb-3">
            Impact Certificate
          </h3>
          <p className="text-ink-dim text-[0.9rem]">
            Certificates will be generated when contribution data is verified via Supabase.
          </p>
        </div>
      );

    default:
      return <p className="text-ink-dim">Content coming soon.</p>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Overlay
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardOverlay() {
  const { session, setSession } = useAuthModal();
  const [activeTab, setActiveTab] = useState("overview");

  if (!session) return null;

  const tabs = TABS_BY_ROLE[session.role];

  function handleLogout() {
    setSession(null);
    setActiveTab("overview");
  }

  return (
    <div className="fixed inset-0 z-[90] bg-coffee-deep overflow-y-auto">

      {/* Top bar */}
      <div className="sticky top-0 bg-coffee-deep/95 backdrop-blur-xl border-b border-coffee-latte/10 px-12 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/img/Glogo.png"
            alt="Rebru"
            width={28}
            height={28}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="font-display text-[1.3rem] text-coffee-cream">rebru</span>
        </div>

        <button
          onClick={() => setSession(null)}
          className="flex items-center gap-2 font-mono text-[0.75rem] tracking-[0.1em] uppercase text-ink-dim hover:text-coffee-latte transition-colors"
        >
          <i className="fas fa-arrow-left" /> Back to Site
        </button>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[0.88rem] text-coffee-cream font-medium">{session.name}</span>
            <span className="font-mono text-[0.65rem] tracking-[0.12em] text-forest-sage uppercase">
              {session.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-pill border border-white/8 text-ink-dim text-[0.8rem] hover:border-coffee-latte/25 hover:text-coffee-latte transition-all"
          >
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1280px] mx-auto px-12 py-12">

        {/* Welcome */}
        <div className="mb-10">
          <h2 className="font-display text-[2.4rem] font-semibold text-coffee-foam">
            Welcome back, {session.name}
          </h2>
          <p className="text-ink-dim text-[0.95rem] mt-1">
            Role:{" "}
            <strong className="text-forest-sage">
              {session.role.charAt(0).toUpperCase() + session.role.slice(1)}
            </strong>
            {" "}·{" "}
            <span className="text-ink-ghost">Supabase integration ready to connect</span>
          </p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-white/6 mb-10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-3 text-[0.82rem] tracking-[0.08em] uppercase whitespace-nowrap border-b-2 -mb-px flex items-center gap-2 transition-all duration-200",
                activeTab === tab.id
                  ? "text-coffee-latte border-coffee-latte"
                  : "text-ink-ghost border-transparent hover:text-ink-dim"
              )}
            >
              <i className={cn("fas", tab.icon)} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <TabContent tabId={activeTab} role={session.role} />

      </div>
    </div>
  );
}
