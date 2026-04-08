"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency, cn, slugify } from "@/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "../ui/Toast";

function useInView(threshold = 0.1) {
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
// Accordion Item
// ─────────────────────────────────────────────────────────────────────────────
function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span
          className="font-mono text-[0.72rem] tracking-[0.15em] uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          {title}
        </span>
        <i
          className={`fas fa-chevron-down text-[0.65rem] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-400 ${open ? "max-h-[400px] pb-5" : "max-h-0"}`}
        style={{ transitionTimingFunction: "ease" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock product data — Supabase-ready structure (Sprint 4: connect to `products`)
// ─────────────────────────────────────────────────────────────────────────────
const BIOCHAR = {
  id: "biochar-001", // → products.id
  name: "Biochar",
  tagline:
    "Biochar adalah bukti nyata bahwa ampas kopi dapat memberi manfaat jauh melampaui meja café.",
  price: 35000, // → products.price
  unit: "kg", // → products.unit
  category: "soil-amendment", // → products.category
  variants: ["1 Kg", "5 Kg", "10 Kg", "25 Kg"],
  specs: {
    beratBersih: "1000 gram (1 Kg)",
    bahanUtama:
      "Ampas Kopi (Upcycled, 80%), Biomassa Pilihan Lain (20%), diproses melalui Pirolisis.",
    varian: "1 Kg, 5 Kg, 10 Kg, dan 25 Kg",
    fitur: [
      "Kapasitas Tukar Kation (KTK) Tinggi",
      "Peningkatan Retensi Air",
      "Menyimpan Karbon Jangka Panjang",
      "pH Netral",
    ],
  },
  impact: {
    waste_saved: "800g Ampas Kopi Diselamatkan",
    co2_locked: "1.03 Kg CO₂e",
    description:
      "Biochar memiliki dampak mitigasi iklim terkuat karena secara aktif menyimpan karbon dalam bentuk stabil di dalam tanah.",
  },
  badge: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductsFeaturedSection() {
  const { ref, inView } = useInView(0.08);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(BIOCHAR.variants[0]);
  const { addItem } = useCart();

  const totalPrice = BIOCHAR.price * qty;
  const formatted = formatCurrency(totalPrice);

  function handleAddToCart() {
    addItem({
      product_id: BIOCHAR.id,
      name: BIOCHAR.name,
      variant: selectedVariant,
      price: BIOCHAR.price,
      qty,
      accent: "var(--coffee-latte)",
    });
  }

  return (
    <section
      className="relative py-24 px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(74,44,26,0.12) 0%, transparent 65%)",
        }}
      />

      {/* Top separator */}
      <div
        className="absolute top-0 left-12 right-12 h-px"
        style={{ background: "var(--impact-top-line)" }}
      />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        {/* Featured label */}
        <div
          className={`flex items-center gap-3 mb-14 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "80ms" }}
        >
          <span className="section-label">Featured Product</span>
          <div
            className="h-px flex-1 max-w-[80px]"
            style={{ background: "var(--border-default)" }}
          />
          <span
            className="font-mono text-[0.6rem] tracking-[0.15em] uppercase px-3 py-1 rounded-pill"
            style={{
              background: "rgba(196,149,106,0.12)",
              color: "var(--coffee-latte)",
              border: "1px solid rgba(196,149,106,0.22)",
            }}
          >
            Best Seller
          </span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* ── Left: Image placeholder ── */}
          <div
            className={`relative transition-all duration-800 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
            style={{ transitionDelay: "180ms" }}
          >
            {/* Image area */}
            <div
              className="w-full aspect-square rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{
                background: "var(--about-img-bg)",
                border: "1px solid var(--border-default)",
              }}
            >
              {/* Placeholder graphic */}
              <div className="flex flex-col items-center gap-4 opacity-30">
                <i
                  className="fas fa-seedling text-[3rem]"
                  style={{ color: "var(--forest-sage)" }}
                />
                <span
                  className="font-mono text-[0.68rem] tracking-[0.15em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  Product Image
                </span>
              </div>

              {/* Impact badge — floating */}
              <div
                className="absolute bottom-5 left-5 right-5 rounded-md px-5 py-4"
                style={{
                  background: "rgba(13,31,14,0.88)",
                  border: "1px solid rgba(122,171,126,0.25)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p
                      className="font-mono text-[0.6rem] tracking-[0.12em] uppercase mb-1"
                      style={{ color: "var(--forest-sage)" }}
                    >
                      Per 1 Kg — Impact
                    </p>
                    <p
                      className="text-[0.82rem]"
                      style={{ color: "rgba(245,239,230,0.8)" }}
                    >
                      {BIOCHAR.impact.waste_saved}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="font-display font-semibold text-[1.4rem] leading-none"
                      style={{ color: "var(--forest-sage)" }}
                    >
                      {BIOCHAR.impact.co2_locked}
                    </p>
                    <p
                      className="font-mono text-[0.58rem] tracking-[0.1em] uppercase mt-0.5"
                      style={{ color: "rgba(200,223,201,0.6)" }}
                    >
                      CO₂ locked
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Product info ── */}
          <div
            className={`transition-all duration-800 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
            style={{ transitionDelay: "300ms" }}
          >
            {/* Name + tagline */}
            <h2
              className="font-display font-semibold leading-tight mb-4"
              style={{
                fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)",
                color: "var(--text-primary)",
              }}
            >
              {BIOCHAR.name}
            </h2>
            <p
              className="text-[0.95rem] leading-[1.85] mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              {BIOCHAR.tagline}
            </p>

            {/* Variant selector */}
            <div className="mb-6">
              <p
                className="font-mono text-[0.65rem] tracking-[0.15em] uppercase mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                Pilih Varian
              </p>
              <div className="flex flex-wrap gap-2">
                {BIOCHAR.variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariant(v)}
                    className="px-4 py-2 rounded-pill font-mono text-[0.72rem] tracking-[0.1em] transition-all duration-200"
                    style={{
                      border:
                        selectedVariant === v
                          ? "1px solid var(--coffee-latte)"
                          : "1px solid var(--border-default)",
                      background:
                        selectedVariant === v
                          ? "rgba(196,149,106,0.15)"
                          : "transparent",
                      color:
                        selectedVariant === v
                          ? "var(--coffee-latte)"
                          : "var(--text-muted)",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Price — ✅ FIXED: gunakan formatCurrency */}
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="font-display font-semibold text-[2rem]"
                style={{ color: "var(--coffee-latte)" }}
              >
                {formatCurrency(BIOCHAR.price)}
              </span>
              <span
                className="font-mono text-[0.7rem] tracking-[0.1em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                / {BIOCHAR.unit}
              </span>
            </div>

            {/* Quantity + CTA */}
            <div className="flex items-center gap-4 mb-10">
              {/* Qty control */}
              <div
                className="flex items-center rounded-pill overflow-hidden"
                style={{ border: "1px solid var(--border-default)" }}
              >
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-11 flex items-center justify-center transition-colors hover:bg-bg-elevated"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <i className="fas fa-minus text-[0.65rem]" />
                </button>
                <span
                  className="w-10 text-center font-mono text-[0.9rem]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-11 flex items-center justify-center transition-colors hover:bg-bg-elevated"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <i className="fas fa-plus text-[0.65rem]" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 justify-center"
              >
                <i className="fas fa-cart-plus" />
                Add to Cart · {formatted}
              </button>
            </div>

            {/* Accordion */}
            <div
              className="border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <AccordionItem title="Berat Bersih" defaultOpen>
                <p
                  className="text-[0.88rem] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {BIOCHAR.specs.beratBersih}
                </p>
              </AccordionItem>

              <AccordionItem title="Spesifikasi & Bahan">
                <div
                  className="flex flex-col gap-3 text-[0.88rem]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <p>
                    <span style={{ color: "var(--text-primary)" }}>
                      Bahan Utama:
                    </span>{" "}
                    {BIOCHAR.specs.bahanUtama}
                  </p>
                  <p>
                    <span style={{ color: "var(--text-primary)" }}>
                      Opsi Varian:
                    </span>{" "}
                    {BIOCHAR.specs.varian}
                  </p>
                  <div>
                    <p
                      className="mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Fitur:
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {BIOCHAR.specs.fitur.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span
                            className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: "var(--forest-sage)" }}
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem title="Dampak Lingkungan">
                <div className="flex flex-col gap-4">
                  <p
                    className="text-[0.88rem] leading-[1.8]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {BIOCHAR.impact.description}
                  </p>
                  {/* Impact highlight */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-md"
                    style={{
                      background: "rgba(45,90,46,0.12)",
                      border: "1px solid rgba(122,171,126,0.2)",
                    }}
                  >
                    <i
                      className="fas fa-leaf text-[0.8rem]"
                      style={{ color: "var(--forest-sage)" }}
                    />
                    <p
                      className="text-[0.82rem]"
                      style={{ color: "var(--forest-sage)" }}
                    >
                      <strong>{BIOCHAR.impact.waste_saved}</strong>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {" "}
                        — setara dengan mengunci{" "}
                      </span>
                      <strong style={{ color: "var(--coffee-latte)" }}>
                        {BIOCHAR.impact.co2_locked}
                      </strong>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {" "}
                        dari atmosfer.
                      </span>
                    </p>
                  </div>
                </div>
              </AccordionItem>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
