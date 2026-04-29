// src/components/ui/Accordion.tsx
// ─────────────────────────────────────────────────────────────────────────────
// AccordionItem — komponen shared untuk semua section yang butuh accordion
//
// Sebelumnya didefinisikan dua kali dengan perbedaan kecil:
//   - ProductsFeaturedSection.tsx → punya prop defaultOpen, max-h-[400px]
//   - ProductsCatalogSection.tsx  → punya prop accent, max-h-[320px]
//
// Sekarang digabung jadi satu dengan semua props opsional.
//
// Usage:
//   import { AccordionItem } from "@/components/ui/Accordion";
//
//   <AccordionItem title="Spesifikasi" defaultOpen>...</AccordionItem>
//   <AccordionItem title="Dampak" accent="var(--forest-sage)">...</AccordionItem>
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";

interface AccordionItemProps {
  /** Label header accordion */
  title: string;
  /** Konten yang ditampilkan saat accordion terbuka */
  children: React.ReactNode;
  /**
   * Warna accent untuk chevron saat terbuka.
   * Jika tidak diisi, pakai --text-muted (perilaku default Featured section)
   */
  accent?: string;
  /**
   * Apakah accordion terbuka saat pertama render.
   * Default: false
   */
  defaultOpen?: boolean;
  /**
   * Max height saat terbuka — sesuaikan dengan panjang konten.
   * Default: "400px" (cukup untuk konten panjang)
   */
  maxHeight?: string;
}

export function AccordionItem({
  title,
  children,
  accent,
  defaultOpen = false,
  maxHeight = "400px",
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={open}
      >
        <span
          className="font-mono text-[0.72rem] tracking-[0.15em] uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </span>
        <i
          className={`fas fa-chevron-down text-[0.65rem] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
          style={{
            color: open && accent ? accent : "var(--text-muted)",
          }}
        />
      </button>

      {/* Smooth expand/collapse via max-height transition */}
      <div
        className="overflow-hidden transition-all duration-400"
        style={{
          maxHeight: open ? maxHeight : "0px",
          paddingBottom: open ? "1.25rem" : "0px",
          transitionTimingFunction: "ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
