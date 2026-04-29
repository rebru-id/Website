// src/components/sections/ProductDetailSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Halaman detail produk — /products/[slug]
// Menampilkan: breadcrumb, info produk, variant selector, add to cart,
//              specs accordion, impact section, related products
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, slugify } from "@/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { useInView } from "@/hooks/useInView";
import { AccordionItem } from "@/components/ui/Accordion";
import type { UIProduct } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Related Product Card — mini card untuk section produk terkait
// ─────────────────────────────────────────────────────────────────────────────

function RelatedCard({ product }: { product: UIProduct }) {
  const lowestPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : null;

  return (
    <Link
      href={`/products/${slugify(product.name)}`}
      className="group flex flex-col gap-4 p-5 rounded-xl transition-all duration-300"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          product.accent;
        (e.currentTarget as HTMLAnchorElement).style.transform =
          "translateY(-2px)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          "0 8px 24px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor =
          "var(--border-subtle)";
        (e.currentTarget as HTMLAnchorElement).style.transform =
          "translateY(0)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: product.accentBg ?? "var(--bg-surface)" }}
      >
        <i
          className={`fas ${product.icon ?? "fa-leaf"} text-[0.9rem]`}
          style={{ color: product.accent }}
        />
      </div>

      {/* Info */}
      <div>
        <p
          className="font-display font-semibold text-[1rem] mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {product.name}
        </p>
        <p
          className="text-[0.78rem] leading-[1.6] line-clamp-2"
          style={{ color: "var(--text-muted)" }}
        >
          {product.tagline}
        </p>
      </div>

      {/* Price */}
      <div className="mt-auto">
        {lowestPrice ? (
          <span
            className="font-mono text-[0.78rem] font-semibold"
            style={{ color: product.accent }}
          >
            Mulai {formatCurrency(lowestPrice)}
          </span>
        ) : (
          <span
            className="font-mono text-[0.72rem] tracking-[0.1em] uppercase"
            style={{ color: product.accent }}
          >
            In R&D
          </span>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ProductDetailSection
// ─────────────────────────────────────────────────────────────────────────────

interface ProductDetailSectionProps {
  product: UIProduct;
  related: UIProduct[];
  slug: string;
}

export default function ProductDetailSection({
  product,
  related,
  slug,
}: ProductDetailSectionProps) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] ?? null,
  );
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const toast = useToast();
  const { ref, inView } = useInView(0.05);

  const activePrice = selectedVariant?.price ?? null;
  const totalPrice = activePrice ? activePrice * qty : null;
  const isRnD = product.badge === "In R&D";

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
    <div
      className="min-h-screen pt-32 pb-24 px-6 md:px-12"
      style={{ background: "var(--hero-gradient)" }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* ── Breadcrumb ── */}
        <nav
          className="flex items-center gap-2 mb-10 font-mono text-[0.68rem] tracking-[0.12em] uppercase"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            style={{ color: "var(--text-muted)" }}
            className="hover:text-text-primary transition-colors"
          >
            Home
          </Link>
          <span style={{ color: "var(--border-default)" }}>/</span>
          <Link
            href="/products"
            style={{ color: "var(--text-muted)" }}
            className="hover:text-text-primary transition-colors"
          >
            Products
          </Link>
          <span style={{ color: "var(--border-default)" }}>/</span>
          <span style={{ color: product.accent }}>{product.name}</span>
        </nav>

        {/* ── Main content grid ── */}
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* ── Left: Visual panel ── */}
          <div
            className={`transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
          >
            {/* Product visual card */}
            <div
              className="relative rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${product.accentBg ?? "var(--bg-card)"}, var(--bg-surface))`,
                border: `1px solid ${product.accentBorder ?? "var(--border-subtle)"}`,
                minHeight: "420px",
              }}
            >
              {/* Badge */}
              {product.badge && (
                <span
                  className="absolute top-5 left-5 font-mono text-[0.62rem] tracking-[0.15em] uppercase px-3 py-1.5 rounded-pill"
                  style={{
                    background: product.accentBg ?? "var(--bg-card)",
                    color: product.accent,
                    border: `1px solid ${product.accentBorder ?? "var(--border-subtle)"}`,
                  }}
                >
                  {product.badge}
                </span>
              )}

              {/* Large icon */}
              <div className="flex flex-col items-center gap-6">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{
                    background: product.accentBg ?? "var(--bg-card)",
                    border: `2px solid ${product.accentBorder ?? "var(--border-subtle)"}`,
                  }}
                >
                  <i
                    className={`fas ${product.icon ?? "fa-leaf"} text-[3.5rem]`}
                    style={{ color: product.accent }}
                  />
                </div>
                <p
                  className="font-mono text-[0.65rem] tracking-[0.2em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {product.unit ? `per ${product.unit}` : "R&D Phase"}
                </p>
              </div>
            </div>

            {/* Impact highlight — di bawah visual card */}
            {product.impact && (
              <div
                className="mt-4 p-4 rounded-xl flex items-center gap-4"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: product.accentBg ?? "var(--bg-surface)",
                  }}
                >
                  <i
                    className={`fas ${product.impact.icon} text-[0.85rem]`}
                    style={{ color: product.accent }}
                  />
                </div>
                <div>
                  <p
                    className="font-mono text-[0.62rem] tracking-[0.1em] uppercase mb-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Dampak Lingkungan
                  </p>
                  <p
                    className="text-[0.82rem] leading-[1.5]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {product.impact.description ??
                      `${product.impact.stat} ${product.impact.value}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Product info & order ── */}
          <div
            className={`transition-all duration-700 delay-150 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
          >
            {/* Category tag */}
            {product.category && (
              <p
                className="inline-flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.18em] uppercase mb-4"
                style={{ color: product.accent }}
              >
                <span
                  className="w-6 h-px"
                  style={{ background: product.accent }}
                />
                {product.category.replace("-", " ")}
              </p>
            )}

            {/* Name */}
            <h1
              className="font-display font-semibold leading-[1.05] mb-4"
              style={{
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                color: "var(--text-primary)",
              }}
            >
              {product.name}
            </h1>

            {/* Tagline */}
            <p
              className="text-[0.95rem] leading-[1.9] mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              {product.tagline}
            </p>

            {/* Price display */}
            <div className="mb-6">
              {activePrice ? (
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-display font-semibold text-[2.2rem]"
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
                </div>
              ) : (
                <span
                  className="font-mono text-[0.8rem] tracking-[0.12em] uppercase"
                  style={{ color: product.accent }}
                >
                  Harga menyusul · R&D Phase
                </span>
              )}
            </div>

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
                      <span
                        className="ml-2 text-[0.65rem]"
                        style={{
                          color:
                            selectedVariant?.label === v.label
                              ? product.accent
                              : "var(--text-muted)",
                          opacity: 0.8,
                        }}
                      >
                        {formatCurrency(v.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty control + Add to cart
                Layout:
                  mobile  → flex-col: qty stepper full-width, button full-width below
                  desktop → flex-row: qty stepper fixed left, button flex-1 right
                Alasan split: konten button (icon + label + harga) terlalu panjang
                untuk satu baris di viewport sempit — wrapping dihilangkan sepenuhnya.
            */}
            {!isRnD && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                {/* ── Qty stepper ── */}
                <div
                  className="flex items-center justify-between sm:justify-start rounded-pill overflow-hidden flex-shrink-0"
                  style={{ border: "1px solid var(--border-default)" }}
                >
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200"
                    style={{
                      color:
                        qty <= 1
                          ? "var(--border-default)"
                          : "var(--text-secondary)",
                      opacity: qty <= 1 ? 0.4 : 1,
                      cursor: qty <= 1 ? "not-allowed" : "pointer",
                    }}
                    aria-label="Kurangi jumlah"
                  >
                    <i className="fas fa-minus text-[0.6rem]" />
                  </button>
                  <span
                    className="flex-1 sm:flex-none sm:w-10 text-center font-mono text-[0.88rem]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    disabled={qty >= 99}
                    className="w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200"
                    style={{
                      color:
                        qty >= 99
                          ? "var(--border-default)"
                          : "var(--text-secondary)",
                      opacity: qty >= 99 ? 0.4 : 1,
                      cursor: qty >= 99 ? "not-allowed" : "pointer",
                    }}
                    aria-label="Tambah jumlah"
                  >
                    <i className="fas fa-plus text-[0.6rem]" />
                  </button>
                </div>

                {/* ── Add to Cart button ──
                    Menggunakan .btn .btn-md sebagai base shell dari globals.css
                    (padding, font-mono, tracking, border-radius, transition, cursor).
                    Warna di-handle via inline style — sesuai architecture contract
                    (dynamic value dari product.accent tidak bisa masuk ke CSS class).

                    Default state : solid fill (product.accent) + cream text
                    Hover state   : lift + glow shadow — lebih terang, lebih dalam
                    Disabled state: opacity reduced, cursor not-allowed

                    Kenapa solid fill di default (bukan ghost):
                    - "Add to Cart" adalah primary CTA — harus visible tanpa interaksi
                    - Ghost button butuh hover untuk terlihat sebagai tombol (UX anti-pattern)
                    - Solid fill bekerja di dark & light mode karena warna teks #f5efe6
                      (cream statis) selalu kontras di atas semua accent Rebru
                */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant}
                  className="btn btn-md flex-1 justify-center"
                  style={{
                    background: selectedVariant
                      ? product.accent
                      : "var(--bg-card)",
                    border: `1px solid ${selectedVariant ? product.accent : "var(--border-default)"}`,
                    color: selectedVariant ? "#f5efe6" : "var(--text-muted)",
                    opacity: selectedVariant ? 1 : 0.5,
                    cursor: selectedVariant ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedVariant) return;
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.transform = "translateY(-2px)";
                    btn.style.boxShadow = `0 8px 28px rgba(0,0,0,0.25)`;
                    btn.style.filter = "brightness(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedVariant) return;
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.style.transform = "translateY(0)";
                    btn.style.boxShadow = "none";
                    btn.style.filter = "brightness(1)";
                  }}
                >
                  <i className="fas fa-shopping-basket text-[0.82rem]" />
                  Tambah ke Keranjang
                  {/* Harga ditampilkan hanya di sm+ agar tidak wrap di mobile */}
                  {totalPrice && (
                    <span className="hidden sm:inline opacity-80">
                      · {formatCurrency(totalPrice)}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Specs accordion */}
            {product.specs && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)" }}
              >
                <AccordionItem
                  title="Spesifikasi Produk"
                  accent={product.accent}
                  defaultOpen
                >
                  <div
                    className="flex flex-col gap-3 text-[0.82rem]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {product.specs.beratBersih && (
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-muted)" }}>
                          Berat Bersih
                        </span>
                        <span>{product.specs.beratBersih}</span>
                      </div>
                    )}
                    {product.specs.bahan && (
                      <div className="flex flex-col gap-1">
                        <span style={{ color: "var(--text-muted)" }}>
                          Bahan Utama
                        </span>
                        <span>{product.specs.bahan}</span>
                      </div>
                    )}
                    {product.specs.varian && (
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-muted)" }}>
                          Tersedia
                        </span>
                        <span>{product.specs.varian}</span>
                      </div>
                    )}
                    {product.specs.fitur && product.specs.fitur.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span style={{ color: "var(--text-muted)" }}>
                          Fitur
                        </span>
                        <ul className="flex flex-col gap-1.5">
                          {product.specs.fitur.map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
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
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span
                className="w-8 h-px"
                style={{ background: "var(--border-default)" }}
              />
              <p
                className="font-mono text-[0.7rem] tracking-[0.2em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Produk Lainnya
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((p) => (
                <RelatedCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── Back button ── */}
        <div className="mt-16 flex justify-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 font-mono text-[0.72rem] tracking-[0.12em] uppercase px-6 py-3 rounded-pill transition-all duration-300"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "var(--border-strong)";
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-muted)";
            }}
          >
            <i className="fas fa-arrow-left text-[0.7rem]" />
            Kembali ke Semua Produk
          </Link>
        </div>
      </div>
    </div>
  );
}
