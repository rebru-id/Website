"use client";

import { useEffect, useRef, useState } from "react";
import { buildWhatsAppOrderURL, formatCurrency } from "@/lib/utils"; // ✅ FIXED: nama fungsi & tambah formatCurrency

// ─────────────────────────────────────────────────────────────────────────────
// Config — ganti dengan nomor WhatsApp bisnis yang sesungguhnya
// ─────────────────────────────────────────────────────────────────────────────
const WHATSAPP_PHONE = "6285237390994"; // TODO Sprint 4: pindahkan ke env / Supabase config

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock product data — Supabase-ready (Sprint 4: connect to `products` table)
// ─────────────────────────────────────────────────────────────────────────────
const CATALOG_PRODUCTS = [
  {
    id: "compost-001",
    name: "Compost",
    tagline:
      "Ampas kopi yang biasanya terbuang bisa menjadi sumber nutrisi berharga bagi tanah.",
    price: 25000,
    unit: "kg",
    icon: "fa-leaf",
    accent: "var(--forest-sage)",
    accentBg: "rgba(122,171,126,0.08)",
    accentBorder: "rgba(122,171,126,0.2)",
    badge: null,
    variants: ["1 Kg", "5 Kg", "10 Kg"],
    specs: {
      beratBersih: "1000 gram (1 Kg)",
      bahan:
        "Ampas kopi terfermentasi, dicampur sisa organik restoran dan bahan pendukung kompos.",
      fitur: [
        "Kaya Nitrogen & Mikroba Tanah",
        "Memperbaiki Struktur Tanah",
        "100% Organik",
      ],
    },
    impact: {
      stat: "1 Kg Compost",
      value: "menyelamatkan ~600g ampas kopi dari TPA",
      icon: "fa-seedling",
    },
  },
  {
    id: "briquette-001",
    name: "Bio-briquettes",
    tagline:
      "Rebru menghadirkan briket ramah lingkungan sebagai alternatif energi terbarukan.",
    price: 20000,
    unit: "kg",
    icon: "fa-fire",
    accent: "#d4783a",
    accentBg: "rgba(212,120,58,0.08)",
    accentBorder: "rgba(212,120,58,0.2)",
    badge: null,
    variants: ["1 Kg", "5 Kg"],
    specs: {
      beratBersih: "1000 gram (1 Kg)",
      bahan:
        "Ampas kopi dipadatkan dengan pengikat alami, bebas bahan kimia sintetis.",
      fitur: [
        "Pembakaran Lebih Bersih",
        "Kalori Tinggi",
        "Asap Minimal",
        "Pengganti Arang Kayu",
      ],
    },
    impact: {
      stat: "1 Kg Bio-briquettes",
      value: "menggantikan ~0.8 Kg arang kayu konvensional",
      icon: "fa-fire",
    },
  },
  {
    id: "rawmat-001",
    name: "Raw Materials",
    tagline:
      "Biodegradable cups, blocks, and sustainable packaging prototypes from compressed coffee waste.",
    price: null,
    unit: null,
    icon: "fa-flask",
    accent: "#c8a84b",
    accentBg: "rgba(200,168,75,0.07)",
    accentBorder: "rgba(200,168,75,0.2)",
    badge: "In R&D",
    variants: [],
    specs: {
      beratBersih: "—",
      bahan:
        "Ampas kopi terkompresi dengan polimer biodegradable. Masih dalam tahap pengembangan dan uji material.",
      fitur: [
        "Gelas Biodegradable",
        "Blok Bangunan Ringan",
        "Packaging Sustainable",
      ],
    },
    impact: {
      stat: "Target",
      value: "mengalihkan 100% sisa padat dari produksi biochar",
      icon: "fa-flask",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Accordion
// ─────────────────────────────────────────────────────────────────────────────
function AccordionItem({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span
          className="font-mono text-[0.68rem] tracking-[0.15em] uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </span>
        <i
          className={`fas fa-chevron-down text-[0.6rem] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-400 ${open ? "max-h-[320px] pb-4" : "max-h-0"}`}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({
  product,
  index,
  inView,
}: {
  product: (typeof CATALOG_PRODUCTS)[number];
  index: number;
  inView: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] ?? "",
  );
  const isRnD = product.badge === "In R&D";

  // ✅ FIXED: gunakan formatCurrency untuk konsistensi format IDR
  const formatted = product.price
    ? formatCurrency(product.price * qty)
    : "Hubungi Kami";

  // ✅ FIXED: gunakan buildWhatsAppOrderURL untuk produk yang ada harga
  //           produk R&D tetap pakai URL manual karena pesan berbeda
  const waURL = product.price
    ? buildWhatsAppOrderURL(
        WHATSAPP_PHONE,
        `${product.name}${selectedVariant ? ` (${selectedVariant})` : ""}`,
        qty,
        product.price * qty,
      )
    : `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
        `Halo Rebru! Saya tertarik dengan produk ${product.name} yang sedang dalam R&D. Boleh minta informasi lebih lanjut?`,
      )}`;

  return (
    <div
      className={`rounded-lg flex flex-col transition-all duration-700 overflow-hidden ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      style={{
        background: product.accentBg,
        border: `1px solid ${product.accentBorder}`,
        transitionDelay: `${160 + index * 160}ms`,
      }}
    >
      {/* Image area */}
      <div
        className="relative w-full aspect-[4/3] flex items-center justify-center"
        style={{
          background: "var(--about-img-bg)",
          borderBottom: `1px solid ${product.accentBorder}`,
        }}
      >
        <div className="flex flex-col items-center gap-3 opacity-25">
          <i
            className={`fas ${product.icon} text-[2.5rem]`}
            style={{ color: product.accent }}
          />
          <span
            className="font-mono text-[0.6rem] tracking-[0.15em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Product Image
          </span>
        </div>

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-4 right-4">
            <span
              className="font-mono text-[0.6rem] tracking-[0.12em] uppercase px-3 py-1.5 rounded-pill"
              style={{
                background: "rgba(200,168,75,0.2)",
                border: "1px solid rgba(200,168,75,0.35)",
                color: "#c8a84b",
              }}
            >
              {product.badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-7">
        {/* Name + tagline */}
        <h3
          className="font-display font-semibold text-[1.55rem] leading-tight mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {product.name}
        </h3>
        <p
          className="text-[0.88rem] leading-[1.8] mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          {product.tagline}
        </p>

        {/* Variant selector */}
        {product.variants.length > 0 && (
          <div className="mb-5">
            <p
              className="font-mono text-[0.62rem] tracking-[0.15em] uppercase mb-2.5"
              style={{ color: "var(--text-muted)" }}
            >
              Varian
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVariant(v)}
                  className="px-3.5 py-1.5 rounded-pill font-mono text-[0.68rem] tracking-[0.1em] transition-all duration-200"
                  style={{
                    border:
                      selectedVariant === v
                        ? `1px solid ${product.accent}`
                        : "1px solid var(--border-default)",
                    background:
                      selectedVariant === v
                        ? `${product.accentBg}`
                        : "transparent",
                    color:
                      selectedVariant === v
                        ? product.accent
                        : "var(--text-muted)",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price — ✅ FIXED: gunakan formatCurrency */}
        <div className="flex items-baseline gap-2 mb-5">
          {product.price ? (
            <>
              <span
                className="font-display font-semibold text-[1.6rem]"
                style={{ color: product.accent }}
              >
                {formatCurrency(product.price)}
              </span>
              <span
                className="font-mono text-[0.65rem] tracking-[0.1em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                / {product.unit}
              </span>
            </>
          ) : (
            <span
              className="font-mono text-[0.72rem] tracking-[0.12em] uppercase"
              style={{ color: product.accent }}
            >
              Harga menyusul · R&D Phase
            </span>
          )}
        </div>

        {/* Qty + CTA */}
        <div className="flex items-center gap-3 mb-7">
          {!isRnD && (
            <div
              className="flex items-center rounded-pill overflow-hidden flex-shrink-0"
              style={{ border: "1px solid var(--border-default)" }}
            >
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-10 flex items-center justify-center"
                style={{ color: "var(--text-secondary)" }}
              >
                <i className="fas fa-minus text-[0.6rem]" />
              </button>
              <span
                className="w-8 text-center font-mono text-[0.85rem]"
                style={{ color: "var(--text-primary)" }}
              >
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-9 h-10 flex items-center justify-center"
                style={{ color: "var(--text-secondary)" }}
              >
                <i className="fas fa-plus text-[0.6rem]" />
              </button>
            </div>
          )}

          {/* ✅ FIXED: href sekarang pakai waURL dari buildWhatsAppOrderURL */}
          <a
            href={waURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2.5 py-3 rounded-pill font-mono text-[0.72rem] tracking-[0.1em] uppercase transition-all duration-300"
            style={{
              background: isRnD ? "transparent" : product.accentBg,
              border: `1px solid ${product.accentBorder}`,
              color: product.accent,
            }}
          >
            <i className="fab fa-whatsapp" />
            {isRnD ? "Tanya R&D" : `Order · ${formatted}`}
          </a>
        </div>

        {/* Accordion */}
        <div
          className="border-t mt-auto"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <AccordionItem title="Berat Bersih" accent={product.accent}>
            <p
              className="text-[0.85rem]"
              style={{ color: "var(--text-secondary)" }}
            >
              {product.specs.beratBersih}
            </p>
          </AccordionItem>

          <AccordionItem title="Spesifikasi & Bahan" accent={product.accent}>
            <div className="flex flex-col gap-2.5 text-[0.85rem]">
              <p style={{ color: "var(--text-secondary)" }}>
                {product.specs.bahan}
              </p>
              <ul className="flex flex-col gap-1.5 mt-1">
                {product.specs.fitur.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: product.accent }}
                    />
                    <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem title="Dampak Lingkungan" accent={product.accent}>
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-md"
              style={{
                background: product.accentBg,
                border: `1px solid ${product.accentBorder}`,
              }}
            >
              <i
                className={`fas ${product.impact.icon} text-[0.78rem] mt-0.5`}
                style={{ color: product.accent }}
              />
              <p
                className="text-[0.82rem] leading-[1.75]"
                style={{ color: "var(--text-secondary)" }}
              >
                <strong style={{ color: product.accent }}>
                  {product.impact.stat}
                </strong>{" "}
                {product.impact.value}
              </p>
            </div>
          </AccordionItem>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductsCatalogSection() {
  const { ref, inView } = useInView(0.06);

  return (
    <section
      className="relative py-24 px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="absolute top-0 left-12 right-12 h-px"
        style={{ background: "var(--impact-bottom-line)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 70% 50%, rgba(45,90,46,0.06) 0%, transparent 70%)",
        }}
      />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        {/* Header */}
        <div
          className={`mb-14 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <p className="section-label mb-4">More Products</p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="section-title">Complete Catalog</h2>
            <p
              className="font-mono text-[0.68rem] tracking-[0.15em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {CATALOG_PRODUCTS.length} products · 1 in R&D
            </p>
          </div>
        </div>

        {/* Grid */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {CATALOG_PRODUCTS.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              inView={inView}
            />
          ))}
        </div>

        {/* Supabase note */}
        <div
          className={`mt-12 flex items-center justify-center gap-3 transition-all duration-700 ${inView ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: "700ms" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--forest-sage)" }}
          />
          <p
            className="font-mono text-[0.65rem] tracking-[0.15em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Harga & stok akan sync otomatis dari Supabase pada Sprint 4
          </p>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--forest-sage)" }}
          />
        </div>
      </div>
    </section>
  );
}
