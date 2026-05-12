// src/components/sections/ProductsFeaturedSection.tsx
"use client";

import { useState } from "react";
import { formatCurrency, cn, slugify } from "@/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { useInView } from "@/hooks/useInView";
import { AccordionItem } from "@/components/ui/Accordion";

import type { UIProduct } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Data — diambil dari lib/products (single source of truth)
// Sprint 4: getFeaturedProducts() akan fetch dari Supabase
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Main — Featured Carousel
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  products: UIProduct[];
}

export default function ProductsFeaturedSection({ products }: Props) {
  const { ref, inView } = useInView(0.08);

  // ── Carousel state ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const product = products[currentIndex];
  const total = products.length;

  function goTo(index: number) {
    setCurrentIndex((index + total) % total);
  }

  // ── Per-produk state — reset saat produk berganti ──
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] ?? null,
  );

  // Reset state saat pindah produk
  function handleGoTo(index: number) {
    const next = products[(index + total) % total];
    setSelectedVariant(next.variants[0] ?? null);
    setQty(1);
    goTo(index);
  }

  const { addItem } = useCart();
  const toast = useToast();

  const activePrice = selectedVariant?.price ?? null;
  const totalPrice = activePrice ? activePrice * qty : null;

  function handleAddToCart() {
    if (!selectedVariant || !activePrice) return;
    addItem({
      product_id: product.id,
      name: product.name,
      variant: selectedVariant.label,
      price: selectedVariant.price,
      qty,
      accent: product.accent,
    });
    toast.show(
      `${product.name} · ${selectedVariant.label} ditambahkan ke keranjang`,
    );
  }

  return (
    <section
      className="relative py-24 px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Ambient glow — berubah mengikuti warna produk aktif */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 30% 50%, ${product.accentBg ?? "rgba(74,44,26,0.12)"} 0%, transparent 65%)`,
        }}
      />

      {/* Top separator */}
      <div
        className="absolute top-0 left-12 right-12 h-px"
        style={{ background: "var(--impact-top-line)" }}
      />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        {/* ── Header: label + navigasi carousel ── */}
        <div
          className={`flex items-center justify-between mb-14 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "80ms" }}
        >
          <div className="flex items-center gap-3">
            <span className="section-label">Featured Product</span>
            <div
              className="h-px w-16"
              style={{ background: "var(--border-default)" }}
            />
            {product.badge && (
              <span
                className="font-mono text-[0.6rem] tracking-[0.15em] uppercase px-3 py-1 rounded-pill transition-all duration-500"
                style={{
                  background: product.accentBg ?? "rgba(196,149,106,0.12)",
                  color: product.accent,
                  border: `1px solid ${product.accentBorder ?? "rgba(196,149,106,0.22)"}`,
                }}
              >
                {product.badge}
              </span>
            )}
          </div>

          {/* Navigasi carousel */}
          <div className="flex items-center gap-4">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {products.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleGoTo(i)}
                  aria-label={`Produk ${i + 1}`}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === currentIndex ? "20px" : "6px",
                    height: "6px",
                    background:
                      i === currentIndex
                        ? product.accent
                        : "var(--border-default)",
                  }}
                />
              ))}
            </div>

            {/* Tombol prev/next */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGoTo(currentIndex - 1)}
                aria-label="Produk sebelumnya"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-muted)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    product.accent;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    product.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--border-default)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-muted)";
                }}
              >
                <i className="fas fa-chevron-left text-[0.65rem]" />
              </button>
              <button
                onClick={() => handleGoTo(currentIndex + 1)}
                aria-label="Produk berikutnya"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-muted)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    product.accent;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    product.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--border-default)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-muted)";
                }}
              >
                <i className="fas fa-chevron-right text-[0.65rem]" />
              </button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* ── Left: Image placeholder ── */}
          <div
            className={`relative transition-all duration-800 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
            style={{ transitionDelay: "180ms" }}
          >
            <div
              className="w-full aspect-square rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-500"
              style={{
                background: "var(--about-img-bg)",
                border: `1px solid ${product.accentBorder ?? "var(--border-default)"}`,
              }}
            >
              {/* Placeholder graphic */}
              <div className="flex flex-col items-center gap-4 opacity-30 transition-all duration-500">
                <i
                  className={`fas ${product.icon ?? "fa-leaf"} text-[3rem] transition-all duration-500`}
                  style={{ color: product.accent }}
                />
                <span
                  className="font-mono text-[0.68rem] tracking-[0.15em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  Product Image
                </span>
              </div>

              {/* Impact badge — floating */}
              {product.impact?.waste_saved && (
                <div
                  className="absolute bottom-5 left-5 right-5 rounded-md px-5 py-4 transition-all duration-500"
                  style={{
                    background: "rgba(13,31,14,0.88)",
                    border: `1px solid ${product.accentBorder ?? "rgba(122,171,126,0.25)"}`,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p
                        className="font-mono text-[0.6rem] tracking-[0.12em] uppercase mb-1"
                        style={{ color: product.accent }}
                      >
                        Per 1 {product.unit ?? "unit"} — Impact
                      </p>
                      <p
                        className="text-[0.82rem]"
                        style={{ color: "rgba(245,239,230,0.8)" }}
                      >
                        {product.impact?.waste_saved}
                      </p>
                    </div>
                    {product.impact?.co2_locked && (
                      <div className="text-right flex-shrink-0">
                        <p
                          className="font-display font-semibold text-[1.4rem] leading-none"
                          style={{ color: product.accent }}
                        >
                          {product.impact?.co2_locked}
                        </p>
                        <p
                          className="font-mono text-[0.58rem] tracking-[0.1em] uppercase mt-0.5"
                          style={{ color: "rgba(200,223,201,0.6)" }}
                        >
                          CO₂ locked
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Product info ── */}
          <div
            className={`transition-all duration-800 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
            style={{ transitionDelay: "300ms" }}
          >
            {/* Name + tagline */}
            <h2
              className="font-display font-semibold leading-tight mb-4 transition-all duration-500"
              style={{
                fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)",
                color: "var(--text-primary)",
              }}
            >
              {product.name}
            </h2>
            <p
              className="text-[0.95rem] leading-[1.85] mb-8 transition-all duration-500"
              style={{ color: "var(--text-secondary)" }}
            >
              {product.tagline}
            </p>

            {/* Variant selector */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <p
                  className="font-mono text-[0.65rem] tracking-[0.15em] uppercase mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  Pilih Varian
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.label}
                      onClick={() => setSelectedVariant(v)}
                      className="px-4 py-2 rounded-pill font-mono text-[0.72rem] tracking-[0.1em] transition-all duration-200"
                      style={{
                        border:
                          selectedVariant?.label === v.label
                            ? `1px solid ${product.accent}`
                            : "1px solid var(--border-default)",
                        background:
                          selectedVariant?.label === v.label
                            ? (product.accentBg ?? "transparent")
                            : "transparent",
                        color:
                          selectedVariant?.label === v.label
                            ? product.accent
                            : "var(--text-muted)",
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              {activePrice ? (
                <>
                  <span
                    className="font-display font-semibold text-[2rem] transition-all duration-300"
                    style={{ color: product.accent }}
                  >
                    {formatCurrency(activePrice)}
                  </span>
                  <span
                    className="font-mono text-[0.7rem] tracking-[0.1em] uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    / {product.unit}
                  </span>
                </>
              ) : (
                <span
                  className="font-mono text-[0.8rem] tracking-[0.12em] uppercase"
                  style={{ color: product.accent }}
                >
                  Harga menyusul · R&D Phase
                </span>
              )}
            </div>

            {/* ── Unified Split-Button Control ────────────────────────────────
                Pattern: qty stepper dan CTA dalam satu pill tunggal.
                Dipakai oleh Shopify Dawn, Arc'teryx, Patagonia featured product.

                Anatomy:
                  [ − · qty · + ]  |  [ 🛒  Add to Cart · Rp X ]
                  ←── transparan ──→  ←──── solid accent fill ────→
                  border tunggal     border-left sebagai divider

                Mobile: tetap satu baris (pill cukup lebar), qty stretch kiri,
                        harga disembunyikan agar tidak wrap.
                Desktop: harga tampil dengan opacity reduced (info, bukan CTA noise).
            ─────────────────────────────────────────────────────────────── */}
            {product.variants.length > 0 && (
              <div
                className="flex items-stretch rounded-pill overflow-hidden mb-10 transition-all duration-250"
                style={{
                  border: `1.5px solid ${selectedVariant ? product.accent : "var(--border-default)"}`,
                  opacity: selectedVariant ? 1 : 0.55,
                  boxShadow: selectedVariant
                    ? `0 0 0 0px ${product.accent}`
                    : "none",
                  transition:
                    "border-color 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  if (!selectedVariant) return;
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    `0 8px 32px rgba(0,0,0,0.22)`;
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(0)";
                }}
              >
                {/* ── Kiri: Qty stepper — transparan, no background ── */}
                <div
                  className="flex items-center flex-shrink-0"
                  style={{ background: "transparent" }}
                >
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    className="w-11 h-12 flex items-center justify-center transition-colors duration-200"
                    style={{
                      color:
                        qty <= 1
                          ? "var(--border-strong)"
                          : "var(--text-secondary)",
                      cursor: qty <= 1 ? "not-allowed" : "pointer",
                    }}
                    aria-label="Kurangi jumlah"
                  >
                    <i className="fas fa-minus text-[0.6rem]" />
                  </button>
                  <span
                    className="w-8 text-center font-mono text-[0.88rem] select-none"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(99, qty + 1))}
                    disabled={qty >= 99}
                    className="w-11 h-12 flex items-center justify-center transition-colors duration-200"
                    style={{
                      color:
                        qty >= 99
                          ? "var(--border-strong)"
                          : "var(--text-secondary)",
                      cursor: qty >= 99 ? "not-allowed" : "pointer",
                    }}
                    aria-label="Tambah jumlah"
                  >
                    <i className="fas fa-plus text-[0.6rem]" />
                  </button>
                </div>

                {/* ── Divider vertikal ── */}
                <div
                  className="w-px self-stretch flex-shrink-0"
                  style={{
                    background: selectedVariant
                      ? product.accent
                      : "var(--border-default)",
                    opacity: 0.5,
                  }}
                />

                {/* ── Kanan: Add to Cart — solid accent fill ── */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 font-mono text-[0.72rem] tracking-[0.12em] uppercase transition-colors duration-250"
                  style={{
                    background: selectedVariant
                      ? product.accent
                      : "var(--bg-card)",
                    color: selectedVariant ? "#f5efe6" : "var(--text-muted)",
                    cursor: selectedVariant ? "pointer" : "not-allowed",
                    minHeight: "48px",
                  }}
                >
                  <i className="fas fa-bag-shopping text-[0.85rem]" />
                  Add to Cart
                  {totalPrice && (
                    <span className="hidden sm:inline opacity-75 font-normal">
                      · {formatCurrency(totalPrice)}
                    </span>
                  )}
                </button>
              </div>
            )}

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
                  {product.specs?.beratBersih}
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
                    {product.specs?.bahan}
                  </p>
                  {product.specs?.varian && (
                    <p>
                      <span style={{ color: "var(--text-primary)" }}>
                        Opsi Varian:
                      </span>{" "}
                      {product.specs.varian}
                    </p>
                  )}
                  {product.specs?.fitur && product.specs.fitur.length > 0 && (
                    <div>
                      <p
                        className="mb-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Fitur:
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {product.specs.fitur.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <span
                              className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: product.accent }}
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionItem>

              {product.impact?.description && (
                <AccordionItem title="Dampak Lingkungan">
                  <div className="flex flex-col gap-4">
                    <p
                      className="text-[0.88rem] leading-[1.8]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {product.impact.description}
                    </p>
                    {product.impact.waste_saved && (
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-md"
                        style={{
                          background: product.accentBg ?? "rgba(45,90,46,0.12)",
                          border: `1px solid ${product.accentBorder ?? "rgba(122,171,126,0.2)"}`,
                        }}
                      >
                        <i
                          className={`fas ${product.impact.icon} text-[0.8rem]`}
                          style={{ color: product.accent }}
                        />
                        <p
                          className="text-[0.82rem]"
                          style={{ color: product.accent }}
                        >
                          <strong>{product.impact.waste_saved}</strong>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {" "}
                            — setara dengan mengunci{" "}
                          </span>
                          <strong style={{ color: product.accent }}>
                            {product.impact.co2_locked}
                          </strong>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {" "}
                            dari atmosfer.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </AccordionItem>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
