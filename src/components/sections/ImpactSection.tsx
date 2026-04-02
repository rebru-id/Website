"use client";

import { useEffect, useRef, useState } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { type GlobalStats } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Uncomment block below and remove PLACEHOLDER_STATS once Supabase connected
//
// async function fetchGlobalStats(): Promise<GlobalStats> {
//   const supabase = createClient();
//   const { data, error } = await supabase
//     .from("global_stats")   // This is a Supabase View
//     .select("*")
//     .single();
//   if (error) throw error;
//   return data;
// }
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_STATS = {
  total_waste_collected: 0,
  total_co2_saved:       0,
  total_partners:        0,
  total_products_sold:   0,
};

interface StatDef {
  id:       string;
  label:    string;
  sublabel: string;
  unit:     string;
  decimals: number;
  iconClass:string;
  iconColor:string;
  value:    number;
}

function useCounterAnimation(target: number, decimals: number, active: boolean) {
  const [display, setDisplay] = useState("—");

  useEffect(() => {
    if (!active) return;
    const start    = performance.now();
    const duration = 2000;

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = eased * target;

      setDisplay(
        decimals > 0
          ? current.toFixed(decimals)
          : Math.floor(current).toLocaleString("id-ID")
      );

      if (progress < 1) requestAnimationFrame(step);
    }

    if (target === 0) {
      setDisplay("0");
    } else {
      requestAnimationFrame(step);
    }
  }, [active, target, decimals]);

  return display;
}

function StatCard({ stat, active }: { stat: StatDef; active: boolean }) {
  const display = useCounterAnimation(stat.value, stat.decimals, active);

  return (
    <div className="group flex flex-col items-center text-center py-11 px-8 bg-white/[0.02] border-r border-coffee-latte/8 last:border-r-0 relative overflow-hidden transition-colors duration-300 hover:bg-coffee-latte/[0.04]">
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-coffee-latte opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className={`text-[1.4rem] mb-4 opacity-60 ${stat.iconColor}`}>
        <i className={`fas ${stat.iconClass}`} />
      </div>

      <div className="font-display text-[3rem] font-bold text-coffee-foam leading-none mb-2 flex items-baseline gap-1 justify-center">
        <span>{display}</span>
        {stat.unit && (
          <span className="text-[1rem] text-ink-dim font-normal">{stat.unit}</span>
        )}
      </div>

      <p className="text-[0.78rem] tracking-[0.1em] uppercase text-ink-ghost mb-1">
        {stat.label}
      </p>
      <p className="font-mono text-[0.65rem] text-forest-sage">
        {stat.sublabel}
      </p>
    </div>
  );
}

export default function ImpactSection() {
  const sectionRef    = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  // TODO: Replace with real Supabase fetch
  const stats = PLACEHOLDER_STATS;

  const statDefs: StatDef[] = [
    {
      id:        "waste",
      label:     "Waste Collected",
      sublabel:  "← waste_collections",
      unit:      "kg",
      decimals:  0,
      iconClass: "fa-weight-hanging",
      iconColor: "text-forest-sage",
      value:     stats.total_waste_collected,
    },
    {
      id:        "co2",
      label:     "CO₂ Saved",
      sublabel:  "← impact_logs",
      unit:      "ton",
      decimals:  1,
      iconClass: "fa-cloud",
      iconColor: "text-coffee-latte",
      value:     stats.total_co2_saved,
    },
    {
      id:        "partners",
      label:     "Active Partners",
      sublabel:  "← mitra",
      unit:      "",
      decimals:  0,
      iconClass: "fa-handshake",
      iconColor: "text-gold",
      value:     stats.total_partners,
    },
    {
      id:        "products",
      label:     "Products Sold",
      sublabel:  "← order_items",
      unit:      "units",
      decimals:  0,
      iconClass: "fa-box",
      iconColor: "text-amber",
      value:     stats.total_products_sold,
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="impact"
      className="px-12 py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1a0f0a 0%, #0d1f0e 50%, #1a0f0a 100%)",
      }}
    >
      {/* Top/bottom border lines */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #c4956a, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #2d5a2e, transparent)" }} />

      {/* Header */}
      <div className="text-center mb-14">
        <span className="section-label mb-3">Live Impact</span>
        <h2 className="section-title">Our Numbers Speak</h2>
      </div>

      {/* Stats grid */}
      <div
        className="max-w-[1100px] mx-auto border border-coffee-latte/10 rounded-lg overflow-hidden"
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {statDefs.map((s) => (
          <StatCard key={s.id} stat={s} active={active} />
        ))}
      </div>
    </section>
  );
}
