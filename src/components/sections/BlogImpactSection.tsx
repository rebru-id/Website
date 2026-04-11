"use client";

import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const STATS = [
  { value: "1,300+", unit: "kg",      label: "Coffee Waste Recycled",      icon: "fa-recycle",    accent: "var(--coffee-latte)" },
  { value: "8+",     unit: "partners", label: "Active Mitra Partners",      icon: "fa-handshake",  accent: "var(--forest-sage)" },
  { value: "1.6",    unit: "ton CO₂e", label: "Carbon Emissions Avoided",   icon: "fa-cloud",      accent: "#c8a84b" },
  { value: "4",      unit: "products", label: "Circular Product Lines",     icon: "fa-seedling",   accent: "#d4783a" },
];

export default function BlogImpactSection() {
  const { ref, inView } = useInView(0.15);

  return (
    <section
      id="impact"
      className="relative py-24 px-12 overflow-hidden"
      style={{ background: "var(--impact-gradient)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--impact-top-line)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "var(--impact-bottom-line)" }} />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className={`section-label mb-4 text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Real Impact
          </p>
          <h2
            className={`font-display font-semibold transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "var(--text-primary)", transitionDelay: "120ms" }}
          >
            Real Impact,{" "}
            <em className="italic" style={{ color: "var(--coffee-latte)" }}>Not Just Words</em>
          </h2>
        </div>

        {/* Stats grid */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--impact-grid-border)" }}
        >
          {STATS.map(({ value, unit, label, icon, accent }, i) => (
            <div
              key={label}
              className={`flex flex-col items-center text-center px-8 py-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{
                background: "var(--impact-card-bg)",
                borderRight: i < STATS.length - 1 ? "1px solid var(--impact-grid-border)" : "none",
                transitionDelay: `${200 + i * 120}ms`,
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-5"
                style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
              >
                <i className={`fas ${icon} text-[0.88rem]`} style={{ color: accent }} />
              </div>

              <p
                className="font-display font-semibold leading-none mb-1"
                style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", color: "var(--impact-stat-num)" }}
              >
                {value}
              </p>
              <p
                className="font-mono text-[0.65rem] tracking-[0.15em] uppercase mb-3"
                style={{ color: accent }}
              >
                {unit}
              </p>
              <p
                className="text-[0.82rem] leading-[1.6]"
                style={{ color: "var(--impact-stat-label)" }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Sub note */}
        <p
          className={`text-center font-mono text-[0.65rem] tracking-[0.12em] uppercase mt-8 transition-all duration-700 ${inView ? "opacity-100" : "opacity-0"}`}
          style={{ color: "var(--text-muted)", transitionDelay: "700ms" }}
        >
          Data akan sync realtime dari Supabase pada Sprint 3
          <span className="inline-block w-1.5 h-1.5 rounded-full ml-3 align-middle" style={{ background: "var(--forest-sage)" }} />
        </p>
      </div>
    </section>
  );
}
