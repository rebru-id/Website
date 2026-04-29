// src/components/sections/BlogImpactSection.tsx
// Sprint 1 changes:
//   - FIXED: borderRight logic sebelumnya rusak di 2-col mobile layout.
//     Ganti dengan CSS outline + gap pada wrapper — tidak ada inline border logic.
//   - ADDED: Context equivalency per stat ("setara X...") untuk investor & akademisi
//   - ADDED: Setiap stat card dapat diklik menuju artikel terkait (slug)
//   - Teks note "Sprint 3" tetap ada — akan dihapus saat Supabase live
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useInView } from "@/hooks/useInView";
import Link from "next/link";

const STATS = [
  {
    value: "1,300+",
    unit: "kg",
    label: "Coffee Waste Recycled",
    // Context: 1 kg SCG in landfill ≈ 0.6 kg CO₂e methane; 1300 kg ≈ 780 kg CO₂e
    context: "≈ emisi 3,200 km berkendara dihindari",
    icon: "fa-recycle",
    accent: "var(--coffee-latte)",
    articleSlug: "coffee-waste-to-climate-impact",
  },
  {
    value: "8+",
    unit: "mitra",
    label: "Active Mitra Partners",
    context: "Cafe, restoran & F&B di Makassar",
    icon: "fa-handshake",
    accent: "var(--forest-sage)",
    articleSlug: "inside-rebru-from-collection-to-transformation",
  },
  {
    value: "1.6",
    unit: "ton CO₂e",
    label: "Carbon Emissions Avoided",
    // 1.6 ton CO₂ ≈ absorbed by ~71 mature trees in 1 year
    context: "≈ serapan 71 pohon dewasa / tahun",
    icon: "fa-cloud",
    accent: "var(--gold)",
    articleSlug: "coffee-waste-to-climate-impact",
  },
  {
    value: "4",
    unit: "produk",
    label: "Circular Product Lines",
    context: "Biochar · Kompos · Briket · Bahan baku",
    icon: "fa-seedling",
    accent: "var(--amber)",
    articleSlug: "what-is-biochar-and-why-it-matters",
  },
];

export default function BlogImpactSection() {
  const { ref, inView } = useInView(0.15);

  return (
    <section
      id="impact"
      className="relative py-24 px-6 md:px-12 overflow-hidden"
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

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p
            className={`section-label mb-4 text-center transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Real Impact
          </p>
          <h2
            className={`font-display font-semibold transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              color: "var(--text-primary)",
              transitionDelay: "120ms",
            }}
          >
            Real Impact,{" "}
            <em className="italic" style={{ color: "var(--coffee-latte)" }}>
              Not Just Words
            </em>
          </h2>
        </div>

        {/*
          Stats grid — FIXED mobile border bug.

          Sebelumnya: borderRight diaplikasikan via inline style dengan logic
          `i < STATS.length - 1`. Ini hanya benar di 4-col layout. Di 2-col
          mobile (grid-cols-2), kolom ke-2 tidak seharusnya punya border-right
          tapi kolom ke-3 dapat — hasil tampilannya inconsistent.

          Solusi: Hapus semua border inline. Gunakan outline pada wrapper
          ditambah gap antar card. Visual separator muncul dari gap + background
          contrast, bukan border individual.
        */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-px rounded-lg overflow-hidden transition-all duration-700 ${
            inView ? "opacity-100" : "opacity-0"
          }`}
          style={{
            // gap-px + background dari wrapper = "border" antar cell yang
            // secara otomatis responsif di 2-col maupun 4-col layout
            background: "var(--impact-grid-border)",
            border: "1px solid var(--impact-grid-border)",
            transitionDelay: "200ms",
          }}
        >
          {STATS.map(
            ({ value, unit, label, context, icon, accent, articleSlug }, i) => (
              <Link
                key={label}
                href={`/blog/${articleSlug}`}
                className={`group flex flex-col items-center text-center px-6 lg:px-8 py-10 transition-all duration-500 cursor-pointer ${
                  inView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  background: "var(--impact-card-bg)",
                  transitionDelay: `${200 + i * 120}ms`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${accent}18`,
                    border: `1px solid ${accent}30`,
                  }}
                >
                  <i
                    className={`fas ${icon} text-[0.88rem]`}
                    style={{ color: accent }}
                  />
                </div>

                {/* Number */}
                <p
                  className="font-display font-semibold leading-none mb-1 transition-colors duration-300"
                  style={{
                    fontSize: "clamp(2rem, 3.5vw, 3rem)",
                    color: "var(--impact-stat-num)",
                  }}
                >
                  {value}
                </p>

                {/* Unit */}
                <p
                  className="font-mono text-[0.65rem] tracking-[0.15em] uppercase mb-3"
                  style={{ color: accent }}
                >
                  {unit}
                </p>

                {/* Label */}
                <p
                  className="text-[0.82rem] leading-[1.6] mb-3"
                  style={{ color: "var(--impact-stat-label)" }}
                >
                  {label}
                </p>

                {/* Context equivalency — the key addition for credibility */}
                <p
                  className="font-mono text-[0.6rem] tracking-[0.06em] leading-[1.5] transition-colors duration-300"
                  style={{ color: "var(--text-muted)" }}
                >
                  {context}
                </p>

                {/* Subtle "read more" indicator on hover */}
                <div
                  className="flex items-center gap-1.5 mt-4 font-mono text-[0.58rem] tracking-[0.12em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ color: accent }}
                >
                  Baca artikel{" "}
                  <i className="fas fa-arrow-right text-[0.5rem]" />
                </div>
              </Link>
            ),
          )}
        </div>

        {/* Sub note */}
        <p
          className={`text-center font-mono text-[0.65rem] tracking-[0.12em] uppercase mt-8 transition-all duration-700 ${
            inView ? "opacity-100" : "opacity-0"
          }`}
          style={{ color: "var(--text-muted)", transitionDelay: "700ms" }}
        >
          Data akan sync realtime dari Supabase pada Sprint 3
          <span
            className="inline-block w-1.5 h-1.5 rounded-full ml-3 align-middle"
            style={{ background: "var(--forest-sage)" }}
          />
        </p>
      </div>
    </section>
  );
}
