"use client";

import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.1) {
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
const SOLUTIONS = [
  {
    icon: "fa-leaf",
    title: "Biochar",
    body: "Improves soil health, increases water retention, and locks carbon for centuries.",
    accent: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.07)",
    border: "rgba(122,171,126,0.18)",
    badge: null,
  },
  {
    icon: "fa-seedling",
    title: "Compost",
    body: "Organic fertilizer made from coffee grounds blended with restaurant and food waste.",
    accent: "var(--coffee-latte)",
    bg: "rgba(196,149,106,0.07)",
    border: "rgba(196,149,106,0.18)",
    badge: null,
  },
  {
    icon: "fa-fire",
    title: "Bio-briquettes",
    body: "Cleaner-burning fuel briquettes using spent coffee grounds as the primary ingredient, displacing coal and wood.",
    accent: "#d4783a",
    bg: "rgba(212,120,58,0.08)",
    border: "rgba(212,120,58,0.2)",
    badge: null,
  },
  {
    icon: "fa-flask",
    title: "Raw Materials",
    body: "Biodegradable cups, blocks, and sustainable packaging prototypes made from compressed coffee waste.",
    accent: "#c8a84b",
    bg: "rgba(200,168,75,0.07)",
    border: "rgba(200,168,75,0.18)",
    badge: "In R&D",
  },
];

const WHO_WE_SERVE = [
  { icon: "fa-tractor",       label: "Gardeners & Agricultural Sectors" },
  { icon: "fa-industry",      label: "SMEs & Manufacturing Industries" },
  { icon: "fa-building",      label: "FMCG Brands & State-owned Enterprises" },
  { icon: "fa-coffee",        label: "Coffee Shops & Café Chains" },
];

const OUR_IMPACT = [
  { icon: "fa-recycle",       label: "Diverting coffee waste from landfills" },
  { icon: "fa-cloud",         label: "Reducing methane emissions at source" },
  { icon: "fa-circle-dollar-to-slot", label: "Creating circular economic value" },
  { icon: "fa-people-group",  label: "Empowering local mitra communities" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function SolutionCard({
  sol, index, inView,
}: { sol: typeof SOLUTIONS[number]; index: number; inView: boolean }) {
  return (
    <div className={`rounded-lg p-8 flex flex-col gap-5 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ background: sol.bg, border: `1px solid ${sol.border}`, transitionDelay: `${180 + index * 140}ms` }}>
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: sol.bg, border: `1px solid ${sol.border}` }}>
          <i className={`fas ${sol.icon} text-[0.95rem]`} style={{ color: sol.accent }} />
        </div>
        {sol.badge && (
          <span className="font-mono text-[0.6rem] tracking-[0.12em] uppercase px-2.5 py-1 rounded-pill"
            style={{ background: "rgba(200,168,75,0.18)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.28)" }}>
            {sol.badge}
          </span>
        )}
      </div>
      <div>
        <h4 className="font-display font-semibold text-[1.3rem] mb-3"
          style={{ color: "var(--text-primary)" }}>{sol.title}</h4>
        <p className="text-[0.88rem] leading-[1.8]" style={{ color: "var(--text-secondary)" }}>{sol.body}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function AboutValuesSection() {
  const { ref, inView } = useInView(0.08);

  return (
    <section className="relative py-36 px-12 overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      <div className="absolute top-0 left-12 right-12 h-px" style={{ background: "var(--impact-top-line)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(74,44,26,0.1) 0%, transparent 70%)" }} />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">

        {/* ── Section 1: Solutions ── */}
        <div className="mb-24">
          <div className="mb-14">
            <p className={`section-label mb-5 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "80ms" }}>Our Solutions</p>
            <h2 className={`section-title transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "180ms" }}>
              Circular Innovations
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SOLUTIONS.map((sol, i) => (
              <SolutionCard key={sol.title} sol={sol} index={i} inView={inView} />
            ))}
          </div>
        </div>

        {/* ── Section 2: Who We Serve + Our Impact ── */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-7 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ transitionDelay: "780ms" }}>

          {/* Who We Serve */}
          <div className="rounded-lg p-10"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
            <p className="font-mono text-[0.65rem] tracking-[0.18em] uppercase mb-3"
              style={{ color: "var(--coffee-latte)" }}>Who We Serve</p>
            <h3 className="font-display font-semibold text-[1.4rem] mb-2"
              style={{ color: "var(--text-primary)" }}>Partners in Sustainability</h3>
            <p className="text-[0.88rem] leading-[1.8] mb-8" style={{ color: "var(--text-secondary)" }}>
              We collaborate with organizations committed to reducing their environmental footprint.
            </p>
            <div className="h-px mb-8" style={{ background: "var(--border-subtle)" }} />
            <ul className="flex flex-col gap-4">
              {WHO_WE_SERVE.map(({ icon, label }) => (
                <li key={label} className="flex items-center gap-4 text-[0.9rem]"
                  style={{ color: "var(--text-secondary)" }}>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(196,149,106,0.1)", border: "1px solid rgba(196,149,106,0.18)" }}>
                    <i className={`fas ${icon} text-[0.7rem]`} style={{ color: "var(--coffee-latte)" }} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Our Impact */}
          <div className="rounded-lg p-10"
            style={{
              background: "rgba(122,171,126,0.06)",
              border: "1px solid rgba(122,171,126,0.18)",
            }}>
            <p className="font-mono text-[0.65rem] tracking-[0.18em] uppercase mb-3"
              style={{ color: "var(--forest-sage)" }}>Our Impact</p>
            <h3 className="font-display font-semibold text-[1.4rem] mb-2"
              style={{ color: "var(--text-primary)" }}>What We Change</h3>
            <p className="text-[0.88rem] leading-[1.8] mb-8" style={{ color: "var(--text-secondary)" }}>
              Every kilogram of waste we collect triggers a measurable chain of positive outcomes.
            </p>
            <div className="h-px mb-8" style={{ background: "rgba(122,171,126,0.18)" }} />
            <ul className="flex flex-col gap-4">
              {OUR_IMPACT.map(({ icon, label }) => (
                <li key={label} className="flex items-center gap-4 text-[0.9rem]"
                  style={{ color: "var(--text-secondary)" }}>
                  <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(122,171,126,0.12)", border: "1px solid rgba(122,171,126,0.22)" }}>
                    <i className={`fas ${icon} text-[0.7rem]`} style={{ color: "var(--forest-sage)" }} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
