"use client";

import Image from "next/image";
import { cn } from "@/utils";
import BlogManagementTab from "@/components/dashboard/BlogManagementTab";
import { useState } from "react";
import { useAuthModal } from "./AuthModalContext";
import { useLogo } from "@/hooks/useLogo";
import { type UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Tab config per role
// ─────────────────────────────────────────────────────────────────────────────

interface Tab {
  id: string;
  label: string;
  icon: string;
}

const TABS_BY_ROLE: Record<UserRole, Tab[]> = {
  admin: [
    { id: "overview", label: "Overview", icon: "fa-home" },
    { id: "waste", label: "Waste Log", icon: "fa-recycle" },
    { id: "partners", label: "Partners", icon: "fa-handshake" },
    { id: "esg", label: "ESG", icon: "fa-chart-bar" },
    { id: "blog", label: "Blog", icon: "fa-newspaper" },
    { id: "reports", label: "Reports", icon: "fa-file-download" },
  ],
  mitra: [
    { id: "overview", label: "My Dashboard", icon: "fa-home" },
    { id: "waste", label: "Contribution Log", icon: "fa-recycle" },
    { id: "impact", label: "Impact", icon: "fa-leaf" },
    { id: "certificate", label: "Certificate", icon: "fa-certificate" },
  ],
  government: [
    { id: "overview", label: "Impact Summary", icon: "fa-home" },
    { id: "esg", label: "ESG Data", icon: "fa-chart-bar" },
    { id: "reports", label: "Public Reports", icon: "fa-file-download" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="dash-stat-card">
      <p className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-ink-ghost mb-3">
        {label}
      </p>
      <p className="font-display text-[2.2rem] font-bold text-coffee-foam leading-none">
        {value}
        {unit && (
          <span className="text-[0.9rem] text-ink-dim font-normal ml-1">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab Content renderer
// ─────────────────────────────────────────────────────────────────────────────

function TabContent({ tabId, role }: { tabId: string; role: UserRole }) {
  const supabaseNote = (table: string) => (
    <div
      className="mt-4 rounded-md p-5 border"
      style={{
        background: "rgba(45,90,46,0.10)",
        borderColor: "rgba(74,124,78,0.20)",
      }}
    >
      <p className="font-mono text-[0.72rem] text-forest-sage tracking-[0.08em]">
        ⚡ SUPABASE READY — Connect to load live data from:{" "}
        <span className="text-text-muted">{table}</span>
      </p>
    </div>
  );

  const emptyTable = (cols: string[], tableNote: string) => (
    <div
      className="overflow-x-auto border rounded-md"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <table className="dash-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={cols.length} className="text-center py-12">
              <i className="fas fa-database text-2xl mb-2 block opacity-20 text-text-muted" />
              <span className="text-text-muted text-[0.82rem]">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Total Waste Collected" value="—" unit="kg" />
            <StatCard label="CO₂ Saved" value="—" unit="ton" />
            <StatCard label="Active Partners" value="—" />
            <StatCard label="Products Sold" value="—" unit="units" />
          </div>
          {supabaseNote(
            "global_stats → waste_collections → impact_logs → mitra → order_items",
          )}
        </>
      );
    case "waste":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-text-primary mb-5">
            {role === "mitra" ? "Contribution Log" : "Waste Collection Records"}
          </h3>
          {emptyTable(
            ["Date", "Mitra", "Waste Type", "Weight (kg)", "Status"],
            "waste_collections",
          )}
        </>
      );
    case "partners":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-text-primary mb-5">
            Partner Applications
          </h3>
          {emptyTable(
            ["Name", "Organization", "Type", "Applied", "Status"],
            "partner_applications",
          )}
        </>
      );
    case "impact":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-text-primary mb-5">
            Your Impact Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatCard label="Waste Contributed" value="—" unit="kg" />
            <StatCard label="CO₂ Avoided" value="—" unit="ton" />
          </div>
          {supabaseNote("impact_logs")}
        </>
      );
    case "esg":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-text-primary mb-5">
            ESG Scorecard
          </h3>
          {[
            {
              cat: "ENVIRONMENT (E)",
              items: ["Waste Diverted: — kg", "CO₂e Avoided: — ton"],
            },
            {
              cat: "SOCIAL (S)",
              items: ["Contributors Engaged: —", "Community Impact: —"],
            },
            {
              cat: "GOVERNANCE (G)",
              items: ["Data Verification: —", "Traceability: Full (ready)"],
            },
          ].map(({ cat, items }) => (
            <div key={cat} className="card-base rounded-md p-7 mb-4">
              <h4 className="font-mono text-[0.72rem] tracking-[0.15em] uppercase text-text-muted mb-4 flex items-center gap-2.5">
                {cat}
                <span
                  className="px-2.5 py-0.5 rounded-pill text-[0.65rem]"
                  style={{
                    background: "rgba(45,90,46,0.25)",
                    color: "var(--forest-sage)",
                  }}
                >
                  Score: Pending
                </span>
              </h4>
              {items.map((item) => (
                <p
                  key={item}
                  className="text-[0.9rem] text-text-secondary mb-1.5"
                >
                  {item}
                </p>
              ))}
            </div>
          ))}
        </>
      );
    case "blog":
      return <BlogManagementTab />;
    case "reports":
      return (
        <>
          <h3 className="font-display text-[1.4rem] text-text-primary mb-5">
            Reports & Exports
          </h3>
          <div className="card-base rounded-md p-7">
            <p className="text-text-secondary text-[0.88rem] mb-6">
              Reports will be generated from live Supabase data.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                {
                  label: "Executive Summary",
                  icon: "fa-file-pdf",
                  style: {
                    background: "rgba(45,90,46,0.2)",
                    border: "1px solid rgba(74,124,78,0.3)",
                    color: "var(--forest-sage)",
                  },
                },
                {
                  label: "Sustainability Report",
                  icon: "fa-file-pdf",
                  style: {
                    background: "rgba(45,90,46,0.2)",
                    border: "1px solid rgba(74,124,78,0.3)",
                    color: "var(--forest-sage)",
                  },
                },
                {
                  label: "Export Data (Excel)",
                  icon: "fa-file-excel",
                  style: {
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    color: "var(--coffee-latte)",
                  },
                },
              ].map(({ label, icon, style }) => (
                <button
                  key={label}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-[0.82rem] tracking-[0.08em] uppercase transition-all hover:brightness-110"
                  style={style}
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
        <div
          className="max-w-[560px] mx-auto text-center rounded-lg p-16"
          style={{
            border: "2px solid var(--border-default)",
            background:
              "linear-gradient(135deg, rgba(74,44,26,0.15), rgba(45,90,46,0.12))",
          }}
        >
          <div className="text-[3rem] mb-5" style={{ color: "#c8a84b" }}>
            <i className="fas fa-certificate" />
          </div>
          <h3 className="font-display text-[1.8rem] text-text-primary mb-3">
            Impact Certificate
          </h3>
          <p className="text-text-secondary text-[0.9rem]">
            Certificates will be generated when contribution data is verified
            via Supabase.
          </p>
        </div>
      );
    default:
      return <p className="text-text-secondary">Content coming soon.</p>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Overlay
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardOverlay() {
  const { session, setSession } = useAuthModal();
  const [activeTab, setActiveTab] = useState("overview");
  const logoSrc = useLogo();

  if (!session) return null;

  const tabs = TABS_BY_ROLE[session.role];

  return (
    <div className="fixed inset-0 z-50 bg-bg-primary overflow-y-auto">
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-12 py-4 flex items-center justify-between backdrop-blur-xl border-b"
        style={{
          backgroundColor: "var(--nav-scrolled-bg)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-3">
          <Image
            src={logoSrc}
            alt="Rebru"
            width={28}
            height={28}
            className="transition-opacity duration-300"
          />
          <span className="font-display text-[1.3rem] text-text-primary">
            rebru
          </span>
        </div>

        <button
          onClick={() => setSession(null)}
          className="flex items-center gap-2 font-mono text-[0.75rem] tracking-[0.1em] uppercase text-text-secondary hover:text-coffee-latte transition-colors"
        >
          <i className="fas fa-arrow-left" /> Back to Site
        </button>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[0.88rem] text-text-primary font-medium">
              {session.name}
            </span>
            <span className="font-mono text-[0.65rem] tracking-[0.12em] text-forest-sage uppercase">
              {session.role}
            </span>
          </div>
          <button
            onClick={() => {
              setSession(null);
              setActiveTab("overview");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-pill border text-text-secondary text-[0.8rem] hover:border-border-strong hover:text-coffee-latte transition-all"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1280px] mx-auto px-12 py-12">
        <div className="mb-10">
          <h2 className="font-display text-[2.4rem] font-semibold text-text-primary">
            Welcome back, {session.name}
          </h2>
          <p className="text-text-secondary text-[0.95rem] mt-1">
            Role:{" "}
            <strong className="text-forest-sage">
              {session.role.charAt(0).toUpperCase() + session.role.slice(1)}
            </strong>
            {" · "}
            <span className="text-text-muted">
              Supabase integration ready to connect
            </span>
          </p>
        </div>

        {/* Tab nav */}
        <div
          className="flex gap-1 overflow-x-auto mb-10"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-3 text-[0.82rem] tracking-[0.08em] uppercase whitespace-nowrap border-b-2 -mb-px flex items-center gap-2 transition-all duration-200",
                activeTab === tab.id
                  ? "text-coffee-latte border-coffee-latte"
                  : "text-text-muted border-transparent hover:text-text-secondary",
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
