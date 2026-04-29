// src/components/sections/ProductsCatalogSection.tsx
"use client";

import { useState } from "react";
import { formatCurrency, cn, slugify } from "@/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { useInView } from "@/hooks/useInView";
import { AccordionItem } from "@/components/ui/Accordion";
import type { UIProduct } from "@/types";

import { getCatalogByCategory } from "@/lib/products";

// ─────────────────────────────────────────────────────────────────────────────
// Tab definitions — tambah entry baru di sini untuk kategori baru
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "all", label: "All" },
  { key: "soil-amendment", label: "Soil" },
  { key: "energy", label: "Energy" },
  { key: "ecogoods", label: "EcoGoods" },
  { key: "raw-materials", label: "R&D" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─────────────────────────────────────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({
  product,
  index,
  inView,
}: {
  product: UIProduct;
  index: number;
  inView: boolean;
}) {
  const [qty, setQty] = useState(1);
  // selectedVariant sekarang objek { label, price } — null untuk produk R&D tanpa varian
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] ?? null,
  );
  const isRnD = product.badge === "In R&D";

  // Harga dihitung dari varian yang dipilih, bukan harga flat produk
  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const formatted = activePrice
    ? formatCurrency(activePrice * qty)
    : "Hubungi Kami";

  const { addItem } = useCart();
  const toast = useToast();

  function handleAddToCart() {
    if (!selectedVariant || !activePrice) return;
    addItem({
      product_id: product.id,
      name: product.name,
      variant: selectedVariant.label,
      price: selectedVariant.price, // ✅ harga aktual varian yang dipilih
      qty: qty,
      accent: product.accent,
    });
    toast.show(
      `${product.name} · ${selectedVariant.label} ditambahkan ke keranjang`,
    );
  }

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
                  key={v.label}
                  onClick={() => setSelectedVariant(v)}
                  className="px-3.5 py-1.5 rounded-pill font-mono text-[0.68rem] tracking-[0.1em] transition-all duration-200"
                  style={{
                    border:
                      selectedVariant?.label === v.label
                        ? `1px solid ${product.accent}`
                        : "1px solid var(--border-default)",
                    background:
                      selectedVariant?.label === v.label
                        ? `${product.accentBg}`
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

        {/* Price — ditampilkan per varian yang dipilih */}
        <div className="flex items-baseline gap-2 mb-5">
          {activePrice ? (
            <>
              <span
                className="font-display font-semibold text-[1.6rem]"
                style={{ color: product.accent }}
              >
                {formatCurrency(activePrice)}
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

        {/* ── Unified Split-Button — card size ────────────────────────────
            Warna: forest-sage brand color (bukan per-product accent) agar
            grid 3-kolom terasa kohesif — accent tetap dipakai di price,
            badge, variant selector, dan accordion. Hanya CTA yang disamakan.

            R&D: full-width ghost button (tidak ada stepper).
        ─────────────────────────────────────────────────────────────── */}
        <div className="mb-7">
          {isRnD ? (
            /* ── R&D: ghost pill full-width ── */
            <button
              disabled
              className="btn btn-md w-full justify-center"
              style={{
                background: "transparent",
                border: "1px solid var(--border-default)",
                color: "var(--text-muted)",
                cursor: "not-allowed",
                opacity: 0.5,
              }}
            >
              <i className="fas fa-flask text-[0.8rem]" />
              Coming Soon
            </button>
          ) : (
            /* ── Active: split-button pill ── */
            <div
              className="flex items-stretch rounded-pill overflow-hidden"
              style={{
                border: "1.5px solid var(--forest-sage)",
                transition: "box-shadow 0.25s ease, transform 0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 6px 24px rgba(45,90,46,0.25)";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(0)";
              }}
            >
              {/* Qty stepper — transparan kiri */}
              <div className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-10 flex items-center justify-center transition-colors duration-200"
                  style={{
                    color:
                      qty <= 1
                        ? "var(--border-strong)"
                        : "var(--text-secondary)",
                    cursor: qty <= 1 ? "not-allowed" : "pointer",
                  }}
                  aria-label="Kurangi jumlah"
                >
                  <i className="fas fa-minus text-[0.55rem]" />
                </button>
                <span
                  className="w-7 text-center font-mono text-[0.82rem] select-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-9 h-10 flex items-center justify-center transition-colors duration-200"
                  style={{
                    color:
                      qty >= 99
                        ? "var(--border-strong)"
                        : "var(--text-secondary)",
                    cursor: qty >= 99 ? "not-allowed" : "pointer",
                  }}
                  aria-label="Tambah jumlah"
                >
                  <i className="fas fa-plus text-[0.55rem]" />
                </button>
              </div>

              {/* Divider */}
              <div
                className="w-px self-stretch flex-shrink-0"
                style={{ background: "var(--forest-sage)", opacity: 0.45 }}
              />

              {/* CTA — forest-dark fill, cream text */}
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 px-4 font-mono text-[0.66rem] tracking-[0.1em] uppercase transition-colors duration-250"
                style={{
                  background: "var(--forest-dark, rgba(13,31,14,0.92))",
                  color: "var(--forest-mist, #c8dfc9)",
                  minHeight: "40px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--forest-moss)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#f5efe6";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--forest-dark, rgba(13,31,14,0.92))";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--forest-mist, #c8dfc9)";
                }}
              >
                <i className="fas fa-bag-shopping text-[0.78rem]" />
                Add to Cart
                <span className="hidden lg:inline opacity-70 font-normal">
                  · {formatted}
                </span>
              </button>
            </div>
          )}
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
              {product.specs?.beratBersih}
            </p>
          </AccordionItem>

          <AccordionItem title="Spesifikasi & Bahan" accent={product.accent}>
            <div className="flex flex-col gap-2.5 text-[0.85rem]">
              <p style={{ color: "var(--text-secondary)" }}>
                {product.specs?.bahan}
              </p>
              <ul className="flex flex-col gap-1.5 mt-1">
                {product.specs?.fitur?.map((f) => (
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
                className={`fas ${product.impact?.icon} text-[0.78rem] mt-0.5`}
                style={{ color: product.accent }}
              />
              <p
                className="text-[0.82rem] leading-[1.75]"
                style={{ color: "var(--text-secondary)" }}
              >
                <strong style={{ color: product.accent }}>
                  {product.impact?.stat}
                </strong>{" "}
                {product.impact?.value}
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
  const { ref: headerRef, inView: headerInView } = useInView(0.06);
  const { ref: gridRef, inView: gridInView } = useInView(0.04);

  // ── Tab filter state ──
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const filteredProducts = getCatalogByCategory(activeTab);

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

      <div ref={headerRef} className="relative z-10 max-w-[1280px] mx-auto">
        {/* Header */}
        <div
          className={`mb-10 transition-all duration-700 ${headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <p className="section-label mb-4">More Products</p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="section-title">Complete Catalog</h2>
            <p
              className="font-mono text-[0.68rem] tracking-[0.15em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {filteredProducts.length} products
            </p>
          </div>
        </div>

        {/* ── Tab Filter ── */}
        <div
          className={`flex items-center gap-2 flex-wrap mb-10 transition-all duration-700 ${headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "100ms" }}
        >
          {TABS.map((tab) => {
            const count = getCatalogByCategory(tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-pill font-mono text-[0.68rem] tracking-[0.1em] uppercase transition-all duration-200"
                style={{
                  background: isActive
                    ? "var(--forest-dark, rgba(13,31,14,0.9))"
                    : "transparent",
                  border: isActive
                    ? "1px solid var(--forest-sage)"
                    : "1px solid var(--border-default)",
                  color: isActive ? "var(--forest-sage)" : "var(--text-muted)",
                }}
              >
                {tab.label}
                <span
                  className="font-mono text-[0.6rem] px-1.5 py-0.5 rounded-pill"
                  style={{
                    background: isActive
                      ? "rgba(122,171,126,0.2)"
                      : "var(--bg-card)",
                    color: isActive
                      ? "var(--forest-sage)"
                      : "var(--text-muted)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                inView={gridInView}
              />
            ))
          ) : (
            <div
              className="col-span-3 py-16 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <p className="font-mono text-[0.72rem] tracking-[0.15em] uppercase">
                Tidak ada produk di kategori ini
              </p>
            </div>
          )}
        </div>

        {/* Supabase note */}
        <div
          className={`mt-12 flex items-center justify-center gap-3 transition-all duration-700 ${gridInView ? "opacity-100" : "opacity-0"}`}
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
