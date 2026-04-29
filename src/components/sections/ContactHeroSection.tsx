// src/components/sections/ContactHeroSection.tsx
"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";

const CONTACT_INFO = [
  {
    icon: "fa-envelope",
    label: "Email",
    value: "rebruid@gmail.com",
    href: "mailto:rebruid@gmail.com",
    accent: "var(--coffee-latte)",
    accentHex: "#c4956a",
  },
  {
    icon: "fa-whatsapp fab",
    label: "WhatsApp",
    value: "+62 852-3739-0994",
    href: "https://wa.me/6285237390994",
    accent: "var(--forest-sage)",
    accentHex: "#7aab7e",
  },
  {
    icon: "fa-map-marker-alt",
    label: "Alamat",
    value: "Jl. Toddopuli 18 No.17, Makassar",
    href: "https://maps.google.com/?q=Jl.+Toddopuli+18+No.17+Makassar",
    accent: "var(--gold)",
    accentHex: "#c8a84b",
  },
  {
    icon: "fa-instagram fab",
    label: "Instagram",
    value: "@rebru.id",
    href: "https://www.instagram.com/rebru.id",
    accent: "var(--amber)",
    accentHex: "#d4884a",
  },
];

export default function ContactHeroSection() {
  const { ref, inView } = useInView(0.1);

  // T2.1 — State-driven hover menggantikan onMouseEnter/Leave DOM manipulation.
  // Sebelumnya: e.currentTarget.style.borderColor = ... (melewati React cycle,
  // tidak bekerja di touch device).
  // Sekarang: hoveredIdx mengontrol style lewat conditional expression di JSX —
  // React yang render, bukan imperative DOM mutation.
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section
      className="relative pt-[var(--section-py-lg)] pb-[var(--section-py)] px-12 overflow-hidden"
      style={{ background: "var(--hero-gradient)" }}
    >
      {/* Ring */}
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

      <div
        ref={ref}
        className="relative z-10 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
      >
        {/* Left */}
        <div>
          <p
            className={`inline-flex items-center gap-2.5 font-mono text-[0.72rem] tracking-[0.2em] uppercase mb-7 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ color: "var(--forest-sage)", transitionDelay: "100ms" }}
          >
            <span
              className="block w-8 h-px"
              style={{ background: "var(--forest-sage)" }}
            />
            BrewingResponsibly Initiative
          </p>

          <h1
            className={`font-display font-semibold leading-[1.05] mb-8 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{
              fontSize: "clamp(2.6rem, 5vw, 4.8rem)",
              color: "var(--text-primary)",
              transitionDelay: "200ms",
            }}
          >
            Let&apos;s Build
            <br />
            <em className="italic" style={{ color: "var(--coffee-latte)" }}>
              Something
            </em>
            <br />
            <span style={{ color: "var(--forest-sage)" }}>Circular</span>
          </h1>

          <p
            className={`text-[1rem] leading-[1.9] max-w-[460px] mb-4 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ color: "var(--text-secondary)", transitionDelay: "320ms" }}
          >
            Bergabunglah dengan jaringan kafe dan bisnis F&B yang sudah mengubah
            ampas kopi menjadi dampak nyata. Pilih skema kemitraan yang sesuai,
            atau sekadar kirimkan pesan kepada kami.
          </p>

          <p
            className={`font-mono text-[0.72rem] tracking-[0.12em] italic mb-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ color: "var(--text-muted)", transitionDelay: "400ms" }}
          >
            Minimum komitmen 3 bulan untuk Mitra Dampak & Mitra Strategis.
          </p>
        </div>

        {/* Right — contact cards */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          style={{ transitionDelay: "300ms" }}
        >
          {CONTACT_INFO.map(({ icon, label, value, href, accentHex }, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={
                  href.startsWith("http") ? "noopener noreferrer" : undefined
                }
                className={`group flex flex-col gap-3 p-6 rounded-lg transition-all duration-300 hover:-translate-y-0.5 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{
                  // T2.1 — style dikontrol React state, bukan DOM mutation
                  background: isHovered ? `${accentHex}10` : "var(--bg-card)",
                  border: isHovered
                    ? `1px solid ${accentHex}50`
                    : "1px solid var(--border-default)",
                  transitionDelay: `${420 + i * 80}ms`,
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${accentHex}18`,
                    border: `1px solid ${accentHex}28`,
                  }}
                >
                  <i
                    className={`${icon.includes("fab") ? "fab" : "fas"} ${icon.replace(" fab", "")} text-[0.82rem]`}
                    style={{ color: `${accentHex}` }}
                  />
                </div>
                <div>
                  <p
                    className="font-mono text-[0.6rem] tracking-[0.15em] uppercase mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-[0.88rem] leading-snug group-hover:underline"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {value}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
