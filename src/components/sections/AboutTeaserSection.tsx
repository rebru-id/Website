// src/components/sections/AboutTeaserSection.tsx
"use client";

/**
 * AboutTeaserSection — Updated
 *
 * Perubahan dari versi sebelumnya:
 * 1. CTA "Read Our Story" → "Our Team" (mengarah ke /about#team)
 * 2. Tambah CTA "Lihat Deck" → trigger InvestorDeckModal
 * 3. Dua investor context card (market signal + company profile)
 *    ditampilkan dengan soft preview di bawah stat row
 * 4. InvestorDeckModal di-import dan dikontrol state di sini
 *
 * Catatan arsitektur:
 * - Section ini menjadi "use client" karena mengontrol state modal.
 * - Modal di-render via React portal pattern (conditional render di footer section).
 * - Investor card tidak ada label "Untuk Investor" yang eksplisit —
 *   framing tetap natural untuk semua audience (data point, bukan pitch).
 */

import { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import InvestorDeckModal from "@/components/sections/InvestorDeckModal";

/* ─── Investor Context Cards data ───────────────────────────────────────────
 * Dua card ini dirancang sebagai "data points" yang natural —
 * informatif bagi audience umum, tapi high-signal bagi investor.
 * Tidak ada label "Investor" yang eksplisit di card itu sendiri.
 * ────────────────────────────────────────────────────────────────────────── */
const CONTEXT_CARDS = [
  {
    id: "market",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" opacity="0.5" />
        <path d="M2 12l10 5 10-5" opacity="0.75" />
      </svg>
    ),
    label: "Global Market Opportunity",
    value: "18 Juta Ton SCG/Tahun",
    sublabel: "Indonesia — terbesar di Asia Tenggara, <3% terdaur ulang",
  },
  {
    id: "profile",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Company Profile",
    value: "Est. 2025 · Makassar",
    sublabel: "Sulawesi Selatan · Operasional Aktif",
  },
] as const;

/* ─── Stat row data — tidak berubah dari versi sebelumnya ─────────────────── */
const STATS = [
  { value: "2025", label: "Founded" },
  { value: "4+", label: "Products" },
  { value: "100%", label: "Organic" },
] as const;

export default function AboutTeaserSection() {
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);

  return (
    <>
      <section
        id="about-teaser"
        className="max-w-[1280px] mx-auto px-12 py-28 grid grid-cols-1 md:grid-cols-2 gap-20 items-center"
      >
        {/* ── Column kiri: Text content ────────────────────────────────────── */}
        <div className="flex flex-col">
          <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-coffee-latte mb-5">
            // Who we are
          </span>

          <h2
            className="font-display font-semibold text-text-primary leading-[1.1] mb-7"
            style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}
          >
            From Residue
            <br />
            to <em className="italic text-forest-sage">Ritual</em>
          </h2>

          <p className="text-[1rem] text-text-secondary leading-[1.9] mb-9">
            Rebru is one of South Sulawesi&apos;s first startups dedicated to
            transforming spent coffee grounds into high-impact climate products.
            We collect, process, and upgrade waste into biochar, compost, and
            bio-briquettes that restore soil and reduce emissions.
          </p>

          {/* ── CTA buttons ── */}
          <div className="flex items-center gap-3 flex-wrap self-start mb-8">
            {/*
             * CTA primer: "Our Team" — menggantikan "Read Our Story"
             * Rationale: (1) tidak duplikat hero CTA "Our Story"
             *            (2) membangun trust — semua audience & investor
             */}
            <Button href="/about#team" variant="primary">
              Our Team <i className="fas fa-arrow-right ml-1" />
            </Button>

            {/*
             * CTA sekunder: "Lihat Deck" — trigger modal
             * Tampil sebagai ghost button — tidak mencolok bagi audience umum,
             * tapi visible bagi siapa pun yang mencari sinyal investasi.
             */}
            <button
              onClick={() => setIsDeckModalOpen(true)}
              className="inline-flex items-center gap-2 text-[0.82rem] font-medium px-5 py-2.5 rounded-lg transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border-strong)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border-default)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Request Deck
            </button>
          </div>

          {/* ── Stat row — tidak berubah ── */}
          <div className="flex gap-8 pt-8 border-t border-border-subtle">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <strong className="block font-display text-[2rem] font-bold text-coffee-latte">
                  {value}
                </strong>
                <span className="text-[0.75rem] tracking-[0.08em] uppercase text-text-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Investor context cards ────────────────────────────────────────
           * Diletakkan di bawah stat row — flow natural setelah angka.
           * Dua card ini hadir sebagai "konteks tambahan" bagi semua audience,
           * tapi framing value-nya speak to investors.
           * Tidak ada label "Untuk Investor" — sengaja soft & non-intrusive.
           * ─────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
            {CONTEXT_CARDS.map((card) => (
              <InvestorContextCard key={card.id} card={card} />
            ))}
          </div>
        </div>

        {/* ── Column kanan: Visual — tidak berubah dari versi sebelumnya ─── */}
        <div className="relative">
          <div
            className="rounded-lg overflow-hidden relative"
            style={{ aspectRatio: "4/5", background: "var(--about-img-bg)" }}
          >
            <Image
              src="/assets/img/intro-image.png"
              alt="Rebru Process"
              fill
              className="object-cover opacity-80 mix-blend-luminosity"
            />
            <div
              className="absolute inset-0"
              style={{ background: "var(--about-img-overlay)" }}
            />
          </div>

          {/* SCG badge — tidak berubah */}
          <div className="absolute -bottom-5 -left-5 rounded-md px-6 py-5 z-10 bg-forest-dark border border-border-DEFAULT">
            <strong className="block font-display text-[1.6rem] text-forest-sage">
              SCG
            </strong>
            <span className="text-[0.72rem] text-text-muted tracking-[0.1em] uppercase">
              Spent Coffee Grounds
            </span>
          </div>
        </div>
      </section>

      {/* ── InvestorDeckModal — render di luar section untuk z-index bersih ── */}
      <InvestorDeckModal
        isOpen={isDeckModalOpen}
        onClose={() => setIsDeckModalOpen(false)}
      />
    </>
  );
}

/* ─── InvestorContextCard ────────────────────────────────────────────────── */
type ContextCard = (typeof CONTEXT_CARDS)[number];

function InvestorContextCard({ card }: { card: ContextCard }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg px-4 py-4 transition-all duration-200 group"
      style={{
        background: "var(--about-signal-bg)",
        border: "1px solid var(--about-signal-border)",
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center mt-0.5"
        style={{
          background: "var(--about-signal-icon-bg)",
          color: "var(--coffee-latte)",
          border: "1px solid var(--about-signal-icon-border)",
        }}
      >
        {card.icon}
      </div>

      {/* Content */}
      <div className="min-w-0">
        <p
          className="font-mono text-[0.6rem] tracking-[0.14em] uppercase mb-1"
          style={{ color: "var(--about-signal-label)" }}
        >
          {card.label}
        </p>
        <p
          className="font-display font-semibold text-[0.95rem] leading-[1.2] mb-0.5"
          style={{ color: "var(--about-signal-value)" }}
        >
          {card.value}
        </p>
        <p
          className="text-[0.7rem] leading-[1.5]"
          style={{ color: "var(--about-signal-sub)" }}
        >
          {card.sublabel}
        </p>
      </div>
    </div>
  );
}
