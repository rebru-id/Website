// src/components/sections/ProductsFeaturedSection.tsx
"use client";

import { useState, useEffect, useRef } from "react";
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

// Durasi "hilang dulu" sebelum konten produk baru muncul kembali.
// Match dengan transition-delay terlama di product-stage.css (controls: 320ms)
// + sedikit buffer supaya animasi masuk tidak terpotong.
const STAGE_TRANSITION_MS = 360;

// ─────────────────────────────────────────────────────────────────────────────
// RailCard — kartu kecil mengambang di kanan-bawah stage, selector produk
// ─────────────────────────────────────────────────────────────────────────────
function RailCard({
  product,
  active,
  onClick,
}: {
  product: UIProduct;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="product-rail-card"
      data-active={active}
      aria-label={`Lihat ${product.name}`}
      aria-pressed={active}
      style={
        {
          "--product-rail-accent": product.accent,
        } as React.CSSProperties
      }
    >
      <span className="product-rail-card-dot" aria-hidden="true" />
      <i
        className={`fas ${product.icon ?? "fa-leaf"} product-rail-card-icon`}
        style={{ color: product.accent }}
        aria-hidden="true"
      />
      <span className="product-rail-card-scrim" aria-hidden="true" />
      <span className="product-rail-card-label">{product.name}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main — Featured Product Stage
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

  // ── Delay-choreography: setiap ganti produk, sembunyikan konten dulu,
  //    lalu munculkan lagi setelah STAGE_TRANSITION_MS (lihat product-stage.css,
  //    attribute data-transitioning mengontrol opacity/transform semua teks). ──
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goTo(index: number) {
    setCurrentIndex((index + total) % total);
  }

  // ── Per-produk state — reset saat produk berganti ──
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] ?? null,
  );

  // Reset state saat pindah produk + jalankan delay-choreography
  function handleGoTo(index: number) {
    const next = products[(index + total) % total];
    if (next.id === product.id) return; // klik produk yang sama — no-op

    setIsTransitioning(true);
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);

    transitionTimeout.current = setTimeout(() => {
      setSelectedVariant(next.variants[0] ?? null);
      setQty(1);
      goTo(index);
      setIsTransitioning(false);
    }, STAGE_TRANSITION_MS);
  }

  useEffect(() => {
    return () => {
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    };
  }, []);

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
        {/* ── Header: label + badge ── */}
        <div
          className={`flex items-center gap-3 mb-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "80ms" }}
        >
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

        {/* ══════════════════════════════════════════════════════════════
            PRODUCT STAGE — full-bleed hero + controls (kiri-bawah)
            + rail selector (kanan-bawah, setengah-tinggi, scroll horizontal)
           ══════════════════════════════════════════════════════════════ */}
        <div
          className={`product-stage transition-all duration-800 ${inView ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"}`}
          data-transitioning={isTransitioning}
          style={{ transitionDelay: "160ms" }}
        >
          {/* Layer 1 — background placeholder (icon besar + warna accent) */}
          <div
            className="product-stage-bg"
            style={{
              background: `radial-gradient(ellipse 60% 70% at 75% 50%, ${product.accentBg ?? "rgba(74,44,26,0.18)"} 0%, var(--coffee-mid) 100%)`,
            }}
          >
            <i
              className={`fas ${product.icon ?? "fa-leaf"} product-stage-bg-icon`}
              style={{ color: product.accent }}
              aria-hidden="true"
            />
          </div>

          {/* Layer 2 — scrim gradient (kiri + bawah) */}
          <div className="product-stage-scrim" aria-hidden="true" />

          {/* Layer 3 — konten */}
          <div className="product-stage-content">
            {/* ── Hero text (kiri-atas) ── */}
            <div className="product-stage-hero">
              <p className="product-stage-eyebrow">
                <span
                  className="block w-7 h-px"
                  style={{ background: product.accent }}
                />
                <span
                  className="font-mono text-[0.65rem] tracking-[0.2em] uppercase"
                  style={{ color: product.accent }}
                >
                  Per {product.unit ?? "unit"}
                  {activePrice ? ` · ${formatCurrency(activePrice)}` : ""}
                </span>
              </p>

              <h2 className="product-stage-title">{product.name}</h2>

              {product.impact?.waste_saved && (
                <span
                  className="product-stage-tagline-accent"
                  style={{ color: product.accent }}
                >
                  {product.impact.waste_saved}
                </span>
              )}

              <p className="product-stage-desc">{product.tagline}</p>
            </div>

            {/* ── Footer: controls (kiri) + rail (kanan) ── */}
            <div className="product-stage-footer">
              {/* ── Kontrol: variant, harga, qty+cart, accordion ── */}
              <div className="product-stage-controls">
                {/* Variant selector */}
                {product.variants.length > 0 && (
                  <div className="mb-5">
                    <p
                      className="font-mono text-[0.62rem] tracking-[0.15em] uppercase mb-2.5"
                      style={{ color: "rgba(245,239,230,0.55)" }}
                    >
                      Pilih Varian
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => (
                        <button
                          key={v.label}
                          onClick={() => setSelectedVariant(v)}
                          className="px-3.5 py-1.5 rounded-pill font-mono text-[0.7rem] tracking-[0.1em] transition-all duration-200"
                          style={{
                            border:
                              selectedVariant?.label === v.label
                                ? `1px solid ${product.accent}`
                                : "1px solid rgba(245,239,230,0.22)",
                            background:
                              selectedVariant?.label === v.label
                                ? (product.accentBg ?? "transparent")
                                : "transparent",
                            color:
                              selectedVariant?.label === v.label
                                ? product.accent
                                : "rgba(245,239,230,0.65)",
                          }}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qty + Add to Cart — split pill */}
                {product.variants.length > 0 && (
                  <div
                    className="flex items-stretch rounded-pill overflow-hidden mb-1 transition-all duration-250"
                    style={{
                      border: `1.5px solid ${selectedVariant ? product.accent : "rgba(245,239,230,0.25)"}`,
                      opacity: selectedVariant ? 1 : 0.55,
                      background: "rgba(13,10,8,0.45)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {/* Qty stepper */}
                    <div className="flex items-center flex-shrink-0">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        disabled={qty <= 1}
                        className="w-10 h-11 flex items-center justify-center transition-colors duration-200"
                        style={{
                          color:
                            qty <= 1
                              ? "rgba(245,239,230,0.25)"
                              : "rgba(245,239,230,0.8)",
                          cursor: qty <= 1 ? "not-allowed" : "pointer",
                        }}
                        aria-label="Kurangi jumlah"
                      >
                        <i className="fas fa-minus text-[0.6rem]" />
                      </button>
                      <span
                        className="w-7 text-center font-mono text-[0.85rem] select-none"
                        style={{ color: "#f5efe6" }}
                      >
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(Math.min(99, qty + 1))}
                        disabled={qty >= 99}
                        className="w-10 h-11 flex items-center justify-center transition-colors duration-200"
                        style={{
                          color:
                            qty >= 99
                              ? "rgba(245,239,230,0.25)"
                              : "rgba(245,239,230,0.8)",
                          cursor: qty >= 99 ? "not-allowed" : "pointer",
                        }}
                        aria-label="Tambah jumlah"
                      >
                        <i className="fas fa-plus text-[0.6rem]" />
                      </button>
                    </div>

                    <div
                      className="w-px self-stretch flex-shrink-0"
                      style={{
                        background: selectedVariant
                          ? product.accent
                          : "rgba(245,239,230,0.2)",
                        opacity: 0.5,
                      }}
                    />

                    <button
                      onClick={handleAddToCart}
                      disabled={!selectedVariant}
                      className="flex-1 flex items-center justify-center gap-2 px-5 font-mono text-[0.68rem] tracking-[0.12em] uppercase transition-colors duration-250"
                      style={{
                        background: selectedVariant
                          ? product.accent
                          : "transparent",
                        color: selectedVariant
                          ? "#1a0f0a"
                          : "rgba(245,239,230,0.4)",
                        cursor: selectedVariant ? "pointer" : "not-allowed",
                        minHeight: "44px",
                      }}
                    >
                      <i className="fas fa-bag-shopping text-[0.8rem]" />
                      Add to Cart
                      {totalPrice && (
                        <span className="hidden sm:inline opacity-80 font-normal">
                          · {formatCurrency(totalPrice)}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Accordion — versi on-dark (lihat .accordion-on-stage di CSS) */}
                <div className="accordion-on-stage">
                  <AccordionItem title="Berat Bersih" defaultOpen>
                    <p
                      className="text-[0.85rem] leading-relaxed"
                      style={{ color: "rgba(245,239,230,0.72)" }}
                    >
                      {product.specs?.beratBersih}
                    </p>
                  </AccordionItem>

                  <AccordionItem title="Spesifikasi & Bahan">
                    <div
                      className="flex flex-col gap-2.5 text-[0.85rem]"
                      style={{ color: "rgba(245,239,230,0.72)" }}
                    >
                      <p>
                        <span style={{ color: "#f5efe6" }}>Bahan Utama:</span>{" "}
                        {product.specs?.bahan}
                      </p>
                      {product.specs?.varian && (
                        <p>
                          <span style={{ color: "#f5efe6" }}>Opsi Varian:</span>{" "}
                          {product.specs.varian}
                        </p>
                      )}
                      {product.specs?.fitur &&
                        product.specs.fitur.length > 0 && (
                          <div>
                            <p className="mb-1.5" style={{ color: "#f5efe6" }}>
                              Fitur:
                            </p>
                            <ul className="flex flex-col gap-1">
                              {product.specs.fitur.map((f) => (
                                <li key={f} className="flex items-start gap-2">
                                  <span
                                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
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
                      <div className="flex flex-col gap-3">
                        <p
                          className="text-[0.85rem] leading-[1.75]"
                          style={{ color: "rgba(245,239,230,0.72)" }}
                        >
                          {product.impact.description}
                        </p>
                        {product.impact.waste_saved && (
                          <div
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-md"
                            style={{
                              background: "rgba(13,10,8,0.5)",
                              border: `1px solid ${product.accentBorder ?? "rgba(122,171,126,0.3)"}`,
                            }}
                          >
                            <i
                              className={`fas ${product.impact.icon} text-[0.78rem]`}
                              style={{ color: product.accent }}
                            />
                            <p
                              className="text-[0.8rem]"
                              style={{ color: product.accent }}
                            >
                              <strong>{product.impact.waste_saved}</strong>
                              <span style={{ color: "rgba(245,239,230,0.65)" }}>
                                {" "}
                                — setara dengan mengunci{" "}
                              </span>
                              <strong style={{ color: product.accent }}>
                                {product.impact.co2_locked}
                              </strong>
                              <span style={{ color: "rgba(245,239,230,0.65)" }}>
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

              {/* ── Rail: arrows + card selector (kanan-bawah) ── */}
              <div className="product-rail-wrap">
                <div className="product-rail-arrows">
                  <button
                    type="button"
                    onClick={() => handleGoTo(currentIndex - 1)}
                    aria-label="Produk sebelumnya"
                    className="product-rail-arrow"
                  >
                    <i className="fas fa-chevron-up text-[0.65rem]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGoTo(currentIndex + 1)}
                    aria-label="Produk berikutnya"
                    className="product-rail-arrow"
                  >
                    <i className="fas fa-chevron-down text-[0.65rem]" />
                  </button>
                </div>

                <div className="product-rail-track">
                  {products.map((p, i) => (
                    <RailCard
                      key={p.id}
                      product={p}
                      active={i === currentIndex}
                      onClick={() => handleGoTo(i)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
