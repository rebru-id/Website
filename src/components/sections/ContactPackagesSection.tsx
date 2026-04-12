"use client";

import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.1) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Package data — from PDF
// ─────────────────────────────────────────────────────────────────────────────
export const PACKAGES = [
  {
    id: "kontributor",
    tier: "Mitra Kontributor",
    badge: "FREE",
    badgeColor: "#c8a84b",
    tagline: "Kontribusi lingkungan yang mudah dan tanpa biaya",
    accent: "#c8a84b",
    accentBg: "rgba(200,168,75,0.08)",
    accentBorder: "rgba(200,168,75,0.22)",
    featured: false,
    features: [
      "Pengantaran ampas kopi mandiri ke titik drop-off Rebru",
      "Pengelolaan dan pemanfaatan ampas kopi oleh Rebru",
      "Terdaftar sebagai Mitra Kontributor Rebru",
      "Pencatatan partisipasi dan ringkasan dampak berkala",
    ],
  },
  {
    id: "dampak",
    tier: "Mitra Dampak",
    badge: "IDR 150K / bulan",
    badgeColor: "var(--forest-sage)",
    tagline: "Kemudahan operasional + bukti dampak + eksposur brand",
    accent: "var(--forest-sage)",
    accentBg: "rgba(122,171,126,0.08)",
    accentBorder: "rgba(122,171,126,0.25)",
    featured: true,
    features: [
      "Penjemputan ampas kopi terjadwal oleh tim Rebru",
      "Pengelolaan ampas kopi end-to-end oleh Rebru",
      "Ringkasan dampak bulanan (volume + estimasi lingkungan)",
      "Visibilitas brand dalam ekosistem Rebru",
      "Identitas digital sebagai Mitra Dampak Rebru",
    ],
  },
  {
    id: "strategis",
    tier: "Mitra Strategis",
    badge: "IDR 250K / bulan",
    badgeColor: "var(--coffee-latte)",
    tagline: "Kemitraan strategis, data dampak, dan aktivasi brand berkelanjutan",
    accent: "var(--coffee-latte)",
    accentBg: "rgba(196,149,106,0.08)",
    accentBorder: "rgba(196,149,106,0.25)",
    featured: false,
    features: [
      "Penjemputan dengan frekuensi lebih tinggi",
      "Pengelolaan operasional prioritas",
      "Ringkasan dampak teragregasi dan mendalam",
      "Visibilitas brand premium dalam ekosistem Rebru",
      "Kolaborasi strategis (upcycling campaign, community activation, co-creating program)",
      "Akses login ke Dashboard Rebru untuk monitoring dampak",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Package Card
// ─────────────────────────────────────────────────────────────────────────────
function PackageCard({
  pkg,
  index,
  inView,
  onSelect,
}: {
  pkg: typeof PACKAGES[number];
  index: number;
  inView: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-lg overflow-hidden transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      style={{
        background: pkg.accentBg,
        border: pkg.featured ? `2px solid ${pkg.accentBorder}` : `1px solid ${pkg.accentBorder}`,
        transitionDelay: `${160 + index * 140}ms`,
      }}
    >
      {/* Featured badge */}
      {pkg.featured && (
        <div
          className="absolute top-0 left-0 right-0 py-2 text-center"
          style={{ background: "rgba(122,171,126,0.2)", borderBottom: `1px solid rgba(122,171,126,0.2)` }}
        >
          <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase" style={{ color: "var(--forest-sage)" }}>
            ✦ Most Popular
          </span>
        </div>
      )}

      <div className={`flex flex-col flex-1 p-8 ${pkg.featured ? "pt-10" : ""}`}>
        {/* Tier + price */}
        <div className="mb-6">
          <p
            className="font-mono text-[0.65rem] tracking-[0.18em] uppercase mb-3"
            style={{ color: pkg.accent }}
          >
            Skema Kemitraan
          </p>
          <h3
            className="font-display font-semibold text-[1.55rem] leading-tight mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {pkg.tier}
          </h3>
          <div
            className="inline-flex items-center px-3.5 py-1.5 rounded-pill"
            style={{ background: `${pkg.accent}18`, border: `1px solid ${pkg.accent}30` }}
          >
            <span className="font-mono text-[0.72rem] tracking-[0.1em] font-semibold" style={{ color: pkg.accent }}>
              {pkg.badge}
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-[0.88rem] leading-[1.8] mb-7 pb-7"
          style={{
            color: "var(--text-secondary)",
            borderBottom: `1px solid ${pkg.accentBorder}`,
          }}
        >
          {pkg.tagline}
        </p>

        {/* Features */}
        <ul className="flex flex-col gap-3 flex-1 mb-8">
          {pkg.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-[0.86rem]" style={{ color: "var(--text-secondary)" }}>
              <i
                className="fas fa-check text-[0.6rem] mt-1 flex-shrink-0"
                style={{ color: pkg.accent }}
              />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onSelect(pkg.id)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-pill font-mono text-[0.75rem] tracking-[0.1em] uppercase transition-all duration-300 hover:-translate-y-0.5 mt-auto"
          style={{
            background: pkg.featured
              ? "linear-gradient(135deg, var(--forest-moss), var(--forest-dark))"
              : "transparent",
            border: `1.5px solid ${pkg.accentBorder}`,
            color: pkg.featured ? "#f5efe6" : pkg.accent,
          }}
        >
          <i className="fas fa-arrow-down text-[0.65rem]" />
          Pilih Paket Ini
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function ContactPackagesSection() {
  const { ref, inView } = useInView(0.08);

  const handleSelect = (id: string) => {
    // Scroll ke form dan trigger pre-select
    const formEl = document.getElementById("partnership-form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
      // Dispatch custom event untuk pre-select paket di form
      window.dispatchEvent(new CustomEvent("selectPackage", { detail: id }));
    }
  };

  return (
    <section
      className="relative py-24 px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="absolute top-0 left-12 right-12 h-px" style={{ background: "var(--impact-top-line)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,90,46,0.07) 0%, transparent 65%)" }} />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className={`section-label mb-5 text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            BrewingResponsibly Initiative
          </p>
          <h2
            className={`section-title mx-auto mb-5 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "120ms" }}
          >
            Pilih Skema Kemitraan
          </h2>
          <p
            className={`text-[0.92rem] max-w-[520px] mx-auto leading-[1.85] transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ color: "var(--text-muted)", transitionDelay: "220ms" }}
          >
            Rebru menyediakan tiga skema partisipasi agar kafe dan bisnis F&B dapat
            berkontribusi sesuai kapasitas operasional masing-masing.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PACKAGES.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} index={i} inView={inView} onSelect={handleSelect} />
          ))}
        </div>

        {/* T&C note */}
        <p
          className={`text-center font-mono text-[0.65rem] tracking-[0.12em] uppercase transition-all duration-700 ${inView ? "opacity-100" : "opacity-0"}`}
          style={{ color: "var(--text-muted)", transitionDelay: "680ms" }}
        >
          Syarat & Ketentuan: Minimum komitmen 3 bulan untuk Mitra Dampak dan Mitra Strategis.
        </p>
      </div>
    </section>
  );
}
