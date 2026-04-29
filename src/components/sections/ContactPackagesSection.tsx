// src/components/sections/ContactPackagesSection.tsx
"use client";

import { useRouter } from "next/navigation";
import { useInView } from "@/hooks/useInView";

// ─────────────────────────────────────────────────────────────────────────────
// Package data — from PDF
// ─────────────────────────────────────────────────────────────────────────────
export const PACKAGES = [
  {
    id: "kontributor",
    tier: "Mitra Kontributor",
    badge: "FREE",
    badgeColor: "var(--gold)",
    tagline: "Kontribusi lingkungan yang mudah dan tanpa biaya",
    accent: "var(--gold)",
    accentBg: "rgba(200,168,75,0.08)",
    accentBorder: "rgba(200,168,75,0.22)",
    featured: false,
    premium: false,
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
    badge: "IDR 250K / bulan",
    badgeColor: "var(--forest-sage)",
    tagline: "Kemudahan operasional + bukti dampak + eksposur brand",
    accent: "var(--forest-sage)",
    accentBg: "rgba(122,171,126,0.08)",
    accentBorder: "rgba(122,171,126,0.25)",
    featured: true,
    premium: false,
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
    badge: "IDR 500K / bulan",
    badgeColor: "var(--coffee-latte)",
    tagline:
      "Kemitraan strategis, data dampak, dan aktivasi brand berkelanjutan",
    accent: "var(--coffee-latte)",
    accentBg: "rgba(196,149,106,0.08)",
    accentBorder: "rgba(196,149,106,0.25)",
    featured: false,
    premium: true,
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
// ── Map package id → CSS button class (defined in globals.css) ───────────────
const PKG_BTN_CLASS: Record<string, string> = {
  kontributor: "btn-pkg-kontributor",
  dampak: "btn-pkg-dampak",
  strategis: "btn-pkg-strategis",
};

// ── Map package id → card border width (featured/premium get 2px) ─────────
const PKG_CARD_BORDER = (pkg: (typeof PACKAGES)[number]) => {
  if (pkg.featured || pkg.premium) return `2px solid ${pkg.accentBorder}`;
  return `1px solid ${pkg.accentBorder}`;
};

function PackageCard({
  pkg,
  index,
  inView,
  onSelect,
}: {
  pkg: (typeof PACKAGES)[number];
  index: number;
  inView: boolean;
  onSelect: (id: string) => void;
}) {
  const isPremium = pkg.premium ?? false;

  return (
    <div
      className={`flex flex-col rounded-lg overflow-hidden transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      style={{
        background: pkg.accentBg,
        border: PKG_CARD_BORDER(pkg),
        boxShadow: isPremium ? "0 0 40px rgba(196,149,106,0.10)" : "none",
        transitionDelay: `${160 + index * 140}ms`,
      }}
    >
      {/* Badge zone */}
      {pkg.featured ? (
        <div
          className="py-2 text-center flex-shrink-0"
          style={{
            background: "rgba(122,171,126,0.2)",
            borderBottom: "1px solid rgba(122,171,126,0.2)",
          }}
        >
          <span
            className="font-mono text-[0.6rem] tracking-[0.18em] uppercase"
            style={{ color: "var(--forest-sage)" }}
          >
            ✦ Most Popular
          </span>
        </div>
      ) : isPremium ? (
        <div
          className="py-2 text-center flex-shrink-0"
          style={{
            background: "rgba(196,149,106,0.15)",
            borderBottom: "1px solid rgba(196,149,106,0.25)",
          }}
        >
          <span
            className="font-mono text-[0.6rem] tracking-[0.18em] uppercase"
            style={{ color: "var(--coffee-latte)" }}
          >
            ✦ Premium Partner
          </span>
        </div>
      ) : (
        <div className="py-2 flex-shrink-0" style={{ visibility: "hidden" }}>
          <span className="font-mono text-[0.6rem]">&nbsp;</span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-8">
        {/* Tier + price */}
        <div className="mb-6 text-center">
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
            className="inline-flex items-center px-3.5 py-1.5 rounded-pill mx-auto"
            style={{
              background: `${pkg.accent}18`,
              border: `1px solid ${pkg.accent}30`,
            }}
          >
            <span
              className="font-mono text-[0.72rem] tracking-[0.1em] font-semibold"
              style={{ color: pkg.accent }}
            >
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
            <li
              key={f}
              className="flex items-start gap-3 text-[0.86rem]"
              style={{ color: "var(--text-secondary)" }}
            >
              <i
                className="fas fa-check text-[0.6rem] mt-1 flex-shrink-0"
                style={{ color: pkg.accent }}
              />
              {f}
            </li>
          ))}
        </ul>
        {/* CTA — uses CSS class from globals.css, no inline JS state needed */}
        <button
          onClick={() => onSelect(pkg.id)}
          className={`btn btn-md ${PKG_BTN_CLASS[pkg.id]} w-full justify-center mt-auto`}
        >
          <i className="fas fa-arrow-down text-[0.65rem]" />
          Pilih Paket Ini
        </button>{" "}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function ContactPackagesSection() {
  const { ref, inView } = useInView(0.08);
  const router = useRouter();

  // T2.2 — Menggantikan window.dispatchEvent(new CustomEvent("selectPackage")).
  //
  // Sebelumnya: komunikasi antar section via global window event — tidak bisa
  // di-test, tidak terlihat di React DevTools, dan tidak shareable.
  //
  // Sekarang: router.push("/contact?package=id") menulis state ke URL sehingga:
  //   • ContactFormSection membaca param via useSearchParams → pre-select otomatis
  //   • Link bisa dishare langsung ke paket tertentu (/contact?package=dampak)
  //   • State visible di URL bar → mudah di-debug dan di-trace
  //
  // scroll ke #partnership-form tetap terjadi, tapi via hash fragment di URL
  // agar lebih deklaratif daripada getElementById + scrollIntoView imperatif.
  const handleSelect = (id: string) => {
    router.push(`/contact?package=${id}#partnership-form`);
  };

  return (
    <section
      className="relative py-[var(--section-py)] px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="absolute top-0 left-12 right-12 h-px"
        style={{ background: "var(--impact-top-line)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,90,46,0.07) 0%, transparent 65%)",
        }}
      />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <p
            className={`section-label mb-5 text-center transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
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
            Rebru menyediakan tiga skema partisipasi agar kafe dan bisnis F&B
            dapat berkontribusi sesuai kapasitas operasional masing-masing.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {PACKAGES.map((pkg, i) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={i}
              inView={inView}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* T&C note */}
        <p
          className={`text-center font-mono text-[0.65rem] tracking-[0.12em] uppercase transition-all duration-700 ${inView ? "opacity-100" : "opacity-0"}`}
          style={{ color: "var(--text-muted)", transitionDelay: "680ms" }}
        >
          Syarat & Ketentuan: Minimum komitmen 3 bulan untuk Mitra Dampak dan
          Mitra Strategis.
        </p>
      </div>
    </section>
  );
}
