"use client";

import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.15) {
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

function OrbitsGraphic() {
  const nodes = [
    { angle: 0,   icon: "fa-seedling", label: "Biochar",       color: "var(--forest-sage)" },
    { angle: 90,  icon: "fa-leaf",     label: "Compost",       color: "var(--coffee-latte)" },
    { angle: 180, icon: "fa-fire",     label: "Bio-briquettes", color: "#d4783a" },
    { angle: 270, icon: "fa-flask",    label: "Raw Material",  color: "var(--forest-mist)" },
  ];
  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center">
      <div className="absolute w-[380px] h-[380px] rounded-full animate-ring-float"
        style={{ border: "1px solid var(--ring-border)", boxShadow: "var(--ring-shadow)" }} />
      <div className="absolute w-[280px] h-[280px] rounded-full"
        style={{ border: "1px solid var(--ring-inner-1)", animation: "ringFloat 11s ease-in-out infinite reverse" }} />
      <div className="absolute w-[180px] h-[180px] rounded-full"
        style={{ border: "1px solid var(--ring-inner-2)", animation: "ringFloat 14s ease-in-out infinite" }} />
      {/* Center icon */}
      <div className="relative z-10 w-[88px] h-[88px] rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, rgba(74,44,26,0.55) 0%, rgba(45,90,46,0.25) 100%)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 0 48px rgba(196,149,106,0.12)",
        }}>
        <i className="fas fa-coffee text-[1.5rem]" style={{ color: "var(--coffee-latte)" }} />
      </div>
      {/* Orbit nodes */}
      {nodes.map(({ angle, icon, label, color }) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <div key={label} className="absolute flex flex-col items-center gap-1.5"
            style={{ transform: `translate(${Math.cos(rad) * 140}px, ${Math.sin(rad) * 140}px)` }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
              <i className={`fas ${icon} text-[0.78rem]`} style={{ color }} />
            </div>
            <span className="font-mono text-[0.58rem] tracking-[0.12em] uppercase whitespace-nowrap"
              style={{ color: "var(--text-muted)" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AboutHeroSection() {
  const { ref, inView } = useInView(0.1);
  const stats = [
    { label: "Headquartered",   value: "Makassar" },
    { label: "Focus Region",    value: "S. Sulawesi" },
    { label: "Product Lines",   value: "4 Active" },
    { label: "Primary Waste",   value: "Coffee SCG" },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 px-12 overflow-hidden"
      style={{ background: "var(--hero-gradient)" }}>
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, var(--coffee-latte) 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, var(--coffee-latte) 0px, transparent 1px, transparent 80px)",
        }} />

      <div ref={ref}
        className="relative z-10 max-w-[1280px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left */}
        <div>
          <p className={`inline-flex items-center gap-2.5 font-mono text-[0.72rem] tracking-[0.2em] uppercase mb-7 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ color: "var(--forest-sage)", transitionDelay: "100ms" }}>
            <span className="block w-8 h-px" style={{ background: "var(--forest-sage)" }} />
            Makassar · South Sulawesi · Indonesia
          </p>

          <h1 className={`font-display font-semibold leading-[1.05] mb-8 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ fontSize: "clamp(2.6rem, 5vw, 4.8rem)", color: "var(--text-primary)", transitionDelay: "220ms" }}>
            Specializing in<br />
            <em className="italic" style={{ color: "var(--coffee-latte)" }}>Coffee Waste.</em><br />
            <span style={{ color: "var(--forest-sage)" }}>Leading in Climate</span><br />
            Solutions.
          </h1>

          <p className={`text-[1rem] leading-[1.9] max-w-[460px] mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ color: "var(--text-secondary)", transitionDelay: "360ms" }}>
            Rebru transforms spent coffee grounds into biochar, compost, and
            sustainable materials — supporting circular economy goals across
            Indonesia. We are one of the first startups in South Sulawesi
            directly addressing the growing challenge of coffee waste, at scale.
          </p>

          {/* Stats row */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-px transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{
              transitionDelay: "500ms",
              border: "1px solid var(--border-default)",
              borderRadius: "10px",
              overflow: "hidden",
            }}>
            {stats.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1 px-5 py-5"
                style={{ background: "var(--bg-card)", borderRight: "1px solid var(--border-subtle)" }}>
                <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase"
                  style={{ color: "var(--text-muted)" }}>{label}</span>
                <span className="font-display font-semibold text-[1.05rem]"
                  style={{ color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className={`hidden lg:flex items-center justify-center transition-all duration-1000 ${inView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          style={{ transitionDelay: "300ms" }}>
          <OrbitsGraphic />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-12 flex items-center gap-3 opacity-35 pointer-events-none">
        <div className="h-px w-12" style={{ background: "var(--scroll-line)" }} />
        <span className="font-mono text-[0.62rem] tracking-[0.18em] uppercase"
          style={{ color: "var(--text-secondary)" }}>Our Story</span>
      </div>
    </section>
  );
}
