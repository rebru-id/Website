"use client";

import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const REASONS = [
  {
    number: "01",
    icon: "fa-chart-line",
    title: "High Volume",
    body: "Coffee consumption in Indonesia is the highest in Southeast Asia, creating consistent and predictable waste volumes year-round — a reliable feedstock for circular production.",
    accent: "var(--coffee-latte)",
    bg: "rgba(196,149,106,0.07)",
    border: "rgba(196,149,106,0.18)",
  },
  {
    number: "02",
    icon: "fa-smog",
    title: "Hidden Emissions",
    body: "Spent coffee grounds are a significantly underestimated methane emitter when left to decompose in landfills. Diverting them is one of the highest-impact, lowest-cost climate interventions available.",
    accent: "#d4783a",
    bg: "rgba(212,120,58,0.07)",
    border: "rgba(212,120,58,0.18)",
  },
  {
    number: "03",
    icon: "fa-atom",
    title: "High Potential",
    body: "When processed correctly, spent coffee grounds (SCG) yield premium-quality biochar for soil and clean bio-energy — making them one of the most valuable organic waste streams in Indonesia.",
    accent: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.07)",
    border: "rgba(122,171,126,0.18)",
  },
];

const SECONDARY_WASTE = [
  "Rice Husk",
  "Corn Husk",
  "Cocoa Waste",
  "Coconut Shells",
  "Biomass",
];

export default function AboutProcessSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section className="relative py-36 px-12 overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* Top separator */}
      <div className="absolute top-0 left-12 right-12 h-px" style={{ background: "var(--impact-top-line)" }} />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,90,46,0.07) 0%, transparent 70%)" }} />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="mb-20">
          <p className={`section-label mb-5 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "80ms" }}>
            The Core Problem
          </p>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <h2 className={`section-title max-w-[480px] transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "180ms" }}>
              Why Coffee Waste<br />Is Our Focus
            </h2>
            <p className={`text-[0.9rem] max-w-[360px] leading-[1.8] transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ color: "var(--text-muted)", transitionDelay: "280ms" }}>
              Three interconnected reasons why spent coffee grounds are the most
              strategic entry point for circular economy innovation in Indonesia.
            </p>
          </div>
        </div>

        {/* Reason cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-16">
          {REASONS.map(({ number, icon, title, body, accent, bg, border }, i) => (
            <div key={number}
              className={`rounded-lg p-9 flex flex-col transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
              style={{ background: bg, border: `1px solid ${border}`, transitionDelay: `${200 + i * 160}ms` }}>

              {/* Number + icon row */}
              <div className="flex items-center justify-between mb-8">
                <span className="font-display font-semibold"
                  style={{ fontSize: "clamp(2.2rem, 3vw, 3rem)", color: accent, opacity: 0.25 }}>
                  {number}
                </span>
                <div className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <i className={`fas ${icon} text-[0.92rem]`} style={{ color: accent }} />
                </div>
              </div>

              <h3 className="font-display font-semibold text-[1.5rem] leading-tight mb-5"
                style={{ color: "var(--text-primary)" }}>{title}</h3>

              <div className="h-px mb-6" style={{ background: border }} />

              <p className="text-[0.9rem] leading-[1.85] mt-auto" style={{ color: "var(--text-secondary)" }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Secondary waste section */}
        <div className={`rounded-lg p-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            transitionDelay: "720ms",
          }}>
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <p className="font-mono text-[0.65rem] tracking-[0.18em] uppercase mb-3"
                style={{ color: "var(--forest-sage)" }}>What Else We Process</p>
              <h4 className="font-display font-semibold text-[1.3rem] mb-2"
                style={{ color: "var(--text-primary)" }}>
                Complementary Organic Waste
              </h4>
              <p className="text-[0.88rem] leading-[1.8]" style={{ color: "var(--text-secondary)" }}>
                To support composting and biochar production at scale, we integrate
                other high-volume agricultural organic waste streams alongside coffee grounds.
              </p>
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-2.5 md:max-w-[340px]">
              {SECONDARY_WASTE.map((tag) => (
                <span key={tag}
                  className="font-mono text-[0.68rem] tracking-[0.1em] uppercase px-4 py-2 rounded-pill"
                  style={{
                    background: "rgba(122,171,126,0.1)",
                    border: "1px solid rgba(122,171,126,0.22)",
                    color: "var(--forest-sage)",
                  }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
