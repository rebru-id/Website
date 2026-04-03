"use client";

import { useEffect, useRef, useState } from "react";

const PLACEHOLDER_STATS = {
  total_waste_collected: 0,
  total_co2_saved: 0,
  total_partners: 0,
  total_products_sold: 0,
};

interface StatDef {
  id: string;
  label: string;
  sublabel: string;
  unit: string;
  decimals: number;
  iconClass: string;
  value: number;
}

function useCounterAnimation(
  target: number,
  decimals: number,
  active: boolean,
) {
  const [display, setDisplay] = useState("—");
  useEffect(() => {
    if (!active) return;
    if (target === 0) {
      setDisplay("0");
      return;
    }
    const start = performance.now();
    function step(now: number) {
      const progress = Math.min((now - start) / 2000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(
        decimals > 0
          ? (eased * target).toFixed(decimals)
          : Math.floor(eased * target).toLocaleString("id-ID"),
      );
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [active, target, decimals]);
  return display;
}

function StatCard({
  stat,
  active,
  isLast,
}: {
  stat: StatDef;
  active: boolean;
  isLast: boolean;
}) {
  const display = useCounterAnimation(stat.value, stat.decimals, active);
  return (
    <div
      className="group flex flex-col items-center text-center py-11 px-8 relative overflow-hidden transition-all duration-300"
      style={{
        background: "var(--impact-card-bg)",
        borderRight: isLast ? "none" : "1px solid var(--impact-grid-border)",
      }}
    >
      {/* Hover tint */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "var(--impact-card-hover)" }}
      />
      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "var(--impact-card-accent)" }}
      />

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="text-[1.4rem] mb-4 opacity-70 text-forest-sage">
          <i className={`fas ${stat.iconClass}`} />
        </div>
        <div
          className="font-display text-[3rem] font-bold leading-none mb-2 flex items-baseline gap-1 justify-center"
          style={{ color: "var(--impact-stat-num)" }}
        >
          <span>{display}</span>
          {stat.unit && (
            <span
              className="text-[1rem] font-normal"
              style={{ color: "var(--impact-stat-unit)" }}
            >
              {stat.unit}
            </span>
          )}
        </div>
        <p
          className="text-[0.78rem] tracking-[0.1em] uppercase mb-1"
          style={{ color: "var(--impact-stat-label)" }}
        >
          {stat.label}
        </p>
        <p
          className="font-mono text-[0.65rem]"
          style={{ color: "var(--impact-stat-sub)" }}
        >
          {stat.sublabel}
        </p>
      </div>
    </div>
  );
}

export default function ImpactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  const statDefs: StatDef[] = [
    {
      id: "waste",
      label: "Waste Collected",
      sublabel: "← waste_collections",
      unit: "kg",
      decimals: 0,
      iconClass: "fa-weight-hanging",
      value: PLACEHOLDER_STATS.total_waste_collected,
    },
    {
      id: "co2",
      label: "CO₂ Saved",
      sublabel: "← impact_logs",
      unit: "ton",
      decimals: 1,
      iconClass: "fa-cloud",
      value: PLACEHOLDER_STATS.total_co2_saved,
    },
    {
      id: "partners",
      label: "Active Partners",
      sublabel: "← mitra",
      unit: "",
      decimals: 0,
      iconClass: "fa-handshake",
      value: PLACEHOLDER_STATS.total_partners,
    },
    {
      id: "products",
      label: "Products Sold",
      sublabel: "← order_items",
      unit: "units",
      decimals: 0,
      iconClass: "fa-box",
      value: PLACEHOLDER_STATS.total_products_sold,
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setActive(true);
      },
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="impact"
      className="px-12 py-20 relative overflow-hidden"
      style={{ background: "var(--impact-gradient)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "var(--impact-top-line)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "var(--impact-bottom-line)" }}
      />

      <div className="text-center mb-14">
        <span className="section-label mb-3">Live Impact</span>
        <h2 className="section-title">Our Numbers Speak</h2>
      </div>

      <div
        className="max-w-[1100px] mx-auto rounded-lg overflow-hidden"
        style={{
          border: "1px solid var(--impact-grid-border)",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        {statDefs.map((s, i) => (
          <StatCard
            key={s.id}
            stat={s}
            active={active}
            isLast={i === statDefs.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
