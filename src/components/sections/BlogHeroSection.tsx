// src/components/sections/BlogHeroSection.tsx
"use client";

import { useInView } from "@/hooks/useInView";
// ─── CHANGE 1: Hapus "import Link" (tidak dipakai di sini),
//              tambah import Button — komponen yang sama dengan HeroSection ───
import Button from "@/components/ui/Button";

export default function BlogHeroSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section
      className="relative pt-40 pb-28 px-12 overflow-hidden"
      style={{ background: "var(--hero-gradient)" }}
    >
      {/* Ring decoration */}
      <div
        className="absolute top-[8%] right-[5%] w-[300px] h-[300px] rounded-full animate-ring-float pointer-events-none"
        style={{
          border: "1px solid var(--ring-border)",
          boxShadow: "var(--ring-shadow)",
        }}
      >
        <div
          className="absolute inset-5 rounded-full"
          style={{ border: "1px solid var(--ring-inner-1)" }}
        />
        <div
          className="absolute inset-[40px] rounded-full"
          style={{ border: "1px solid var(--ring-inner-2)" }}
        />
      </div>

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, var(--coffee-latte) 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, var(--coffee-latte) 0px, transparent 1px, transparent 80px)",
        }}
      />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        <p
          className={`inline-flex items-center gap-2.5 font-mono text-[0.72rem] tracking-[0.2em] uppercase mb-7 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ color: "var(--forest-sage)", transitionDelay: "100ms" }}
        >
          <span
            className="block w-8 h-px"
            style={{ background: "var(--forest-sage)" }}
          />
          Insights & Stories
        </p>

        <h1
          className={`font-display font-semibold leading-[1.05] mb-8 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{
            fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)",
            color: "var(--text-primary)",
            transitionDelay: "200ms",
          }}
        >
          From Coffee Waste
          <br />
          <em className="italic" style={{ color: "var(--coffee-latte)" }}>
            to Climate
          </em>{" "}
          <span style={{ color: "var(--forest-sage)" }}>Impact</span>
        </h1>

        <p
          className={`text-[1rem] leading-[1.9] max-w-[520px] mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ color: "var(--text-secondary)", transitionDelay: "320ms" }}
        >
          Every cup of coffee leaves a footprint. Rebru transforms that
          footprint into real environmental impact through circular innovation.
          Here we share the stories, science, and process behind that
          transformation.
        </p>

        <div
          className={`flex gap-4 flex-wrap transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "440ms" }}
        >
          {/* ─── CHANGE 2 & 3: <a className="btn-*"> → <Button href="..." variant="*"> ─── */}
          <Button href="#articles" variant="primary">
            <i className="fas fa-book-open" /> Explore Stories
          </Button>
          <Button href="#impact" variant="ghost">
            <i className="fas fa-chart-line" /> View Impact
          </Button>
        </div>
      </div>
    </section>
  );
}
