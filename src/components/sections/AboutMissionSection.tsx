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

// ─────────────────────────────────────────────────────────────────────────────
// Mission / Vision data
// ─────────────────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    tag: "Our Mission",
    icon: "fa-bullseye",
    title: "Indonesia's Leading Coffee-Waste Innovator",
    body: "To become Indonesia's leading innovator in coffee-waste circularity — while expanding regenerative solutions that utilize organic waste responsibly and at meaningful scale.",
    accent: "var(--coffee-latte)",
    bg: "rgba(196,149,106,0.07)",
    border: "rgba(196,149,106,0.2)",
    tagBg: "rgba(74,44,26,0.3)",
  },
  {
    tag: "Our Vision",
    icon: "fa-eye",
    title: "A Circular, Low-Carbon Economy",
    body: "To turn coffee waste and other underutilized organic resources into regenerative materials that restore soil, reduce emissions, and drive a circular, low-carbon economy across the archipelago.",
    accent: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.07)",
    border: "rgba(122,171,126,0.2)",
    tagBg: "rgba(45,90,46,0.25)",
  },
];

export default function AboutMissionSection() {
  const { ref, inView } = useInView(0.15);

  return (
    <section className="relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* ── Top: dark pull-quote band ── */}
      <div className="relative py-28 px-12" style={{ background: "var(--cta-gradient)" }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "var(--cta-top-line)" }} />

        {/* Oversized decorative quote mark */}
        <div className="absolute top-[-2rem] left-1/2 -translate-x-1/2 font-display text-[16rem] leading-none pointer-events-none select-none"
          style={{ color: "rgba(122,171,126,0.05)" }} aria-hidden="true">&ldquo;</div>

        <div className="relative z-10 max-w-[820px] mx-auto text-center">
          <p className="font-mono text-[0.7rem] tracking-[0.25em] uppercase mb-8"
            style={{ color: "var(--forest-sage)" }}>
            About Rebru
          </p>
          <h2 className="font-display font-semibold leading-[1.12] mb-8"
            style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", color: "var(--cta-text)" }}>
            From Residue{" "}
            <em className="italic" style={{ color: "var(--cta-text-em)" }}>to Ritual</em>
          </h2>
          <p className="text-[1.05rem] leading-[1.9] mb-6" style={{ color: "var(--cta-text-sub)" }}>
            At Rebru, we specialize in transforming spent coffee grounds into high-value
            climate products and regenerative materials. Based in{" "}
            <strong style={{ color: "var(--cta-text)" }}>Makassar, South Sulawesi</strong>,
            we are one of the first startups in the region directly addressing
            the rapidly growing challenge of coffee waste.
          </p>
          <p className="text-[1rem] leading-[1.9]" style={{ color: "var(--cta-text-sub)", opacity: 0.8 }}>
            Our core expertise lies in collecting, processing, and upgrading spent coffee
            grounds into impactful products — from biochar that locks carbon for
            centuries, to compost that heals soil, to bio-briquettes that displace
            fossil fuels.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "var(--cta-top-line)", opacity: 0.3 }} />
      </div>

      {/* ── Bottom: Mission + Vision cards ── */}
      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto px-12 py-24">

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(45,90,46,0.06) 0%, transparent 70%)" }} />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-7">
          {PILLARS.map(({ tag, icon, title, body, accent, bg, border, tagBg }, i) => (
            <div key={tag}
              className={`rounded-lg p-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              style={{ background: bg, border: `1px solid ${border}`, transitionDelay: `${160 + i * 200}ms` }}>

              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-[0.65rem] tracking-[0.18em] uppercase px-3 py-1 rounded-pill"
                  style={{ background: tagBg, color: accent }}>{tag}</span>
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid ${border}` }}>
                  <i className={`fas ${icon} text-[0.85rem]`} style={{ color: accent }} />
                </div>
              </div>

              <h3 className="font-display font-semibold text-[1.55rem] leading-[1.25] mb-5"
                style={{ color: "var(--text-primary)" }}>{title}</h3>

              <div className="h-px mb-6" style={{ background: border }} />

              <p className="text-[0.92rem] leading-[1.85]" style={{ color: "var(--text-secondary)" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
