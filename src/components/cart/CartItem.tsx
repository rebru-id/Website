// components/cart/CartDrawer.tsx

"use client";

import { useCart } from "@/context/CartContext";
import { buildCartMessage, buildWhatsAppOrderURL } from "@/services/order";

// ─────────────────────────────────────────────────────────────────────────────
// Cart Item Row
// ─────────────────────────────────────────────────────────────────────────────

function CartItemRow({
  item,
}: {
  item: ReturnType<typeof useCart>["items"][number];
}) {
  const { removeItem, updateQty } = useCart();

  return (
    <div
      className="flex gap-4 py-5"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      {/* Accent indicator */}
      <div
        className="w-1 rounded-full flex-shrink-0"
        style={{ background: item.accent, opacity: 0.7 }}
      />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <p
              className="font-display font-semibold text-[1rem] leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {item.name}
            </p>
            {item.variant && (
              <p
                className="font-mono text-[0.62rem] tracking-[0.12em] uppercase mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {item.variant}
              </p>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={() => removeItem(item.id)}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(248,113,113,0.4)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(248,113,113,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border-subtle)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
            aria-label={`Hapus ${item.name}`}
          >
            <i className="fas fa-times text-[0.62rem]" />
          </button>
        </div>

        {/* Price per unit */}
        <p
          className="text-[0.78rem] mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Rp {item.price.toLocaleString("id-ID")} / kg
        </p>

        {/* Qty editor + subtotal */}
        <div className="flex items-center justify-between">
          {/* Qty control */}
          <div
            className="flex items-center rounded-pill overflow-hidden"
            style={{ border: "1px solid var(--border-default)" }}
          >
            <button
              onClick={() => updateQty(item.id, item.qty - 1)}
              className="w-8 h-8 flex items-center justify-center transition-colors"
              style={{ color: "var(--text-secondary)" }}
              disabled={item.qty <= 1}
            >
              <i className="fas fa-minus text-[0.55rem]" />
            </button>
            <span
              className="w-8 text-center font-mono text-[0.82rem]"
              style={{ color: "var(--text-primary)" }}
            >
              {item.qty}
            </span>
            <button
              onClick={() => updateQty(item.id, item.qty + 1)}
              className="w-8 h-8 flex items-center justify-center transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <i className="fas fa-plus text-[0.55rem]" />
            </button>
          </div>

          {/* Subtotal */}
          <p
            className="font-display font-semibold text-[1.1rem]"
            style={{ color: item.accent }}
          >
            Rp {item.subtotal.toLocaleString("id-ID")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <i
          className="fas fa-shopping-basket text-[1.3rem]"
          style={{ color: "var(--text-muted)" }}
        />
      </div>
      <p
        className="font-display text-[1.2rem] font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Keranjang Kosong
      </p>
      <p
        className="text-[0.85rem] leading-[1.7]"
        style={{ color: "var(--text-muted)" }}
      >
        Tambahkan produk ke keranjang untuk mulai memesan.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Drawer
// ─────────────────────────────────────────────────────────────────────────────

export default function CartDrawer() {
  const { items, isOpen, closeCart, grandTotal, totalItems, clearCart } =
    useCart();

  // Build WA message — Sprint 4: bisa diganti dengan Supabase order creation

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] transition-all duration-400"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: isOpen ? "blur(2px)" : "none",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={closeCart}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full z-[60] flex flex-col transition-transform duration-400"
        style={{
          width: "min(420px, 100vw)",
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-default)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-7 py-5 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <i
              className="fas fa-shopping-basket text-[1rem]"
              style={{ color: "var(--coffee-latte)" }}
            />
            <h2
              className="font-display font-semibold text-[1.2rem]"
              style={{ color: "var(--text-primary)" }}
            >
              Keranjang Belanja
            </h2>
            {totalItems > 0 && (
              <span
                className="font-mono text-[0.62rem] tracking-[0.1em] px-2.5 py-0.5 rounded-pill"
                style={{
                  background: "rgba(196,149,106,0.15)",
                  color: "var(--coffee-latte)",
                  border: "1px solid rgba(196,149,106,0.25)",
                }}
              >
                {totalItems} item
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="font-mono text-[0.62rem] tracking-[0.1em] uppercase px-3 py-1.5 rounded-pill transition-all duration-200"
                style={{
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#f87171";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(248,113,113,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-muted)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--border-subtle)";
                }}
              >
                Kosongkan
              </button>
            )}
            <button
              onClick={closeCart}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
              aria-label="Tutup keranjang"
            >
              <i className="fas fa-times text-[0.72rem]" />
            </button>
          </div>
        </div>

        {/* ── Item list ── */}
        <div className="flex-1 overflow-y-auto px-7">
          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div>
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: summary + checkout ── */}
        {items.length > 0 && (
          <div
            className="flex-shrink-0 px-7 py-6"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            {/* Order summary */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-mono text-[0.65rem] tracking-[0.15em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {totalItems} item
                </span>
                <span
                  className="text-[0.88rem]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Subtotal
                </span>
              </div>

              <div
                className="flex items-baseline justify-between py-3 px-4 rounded-md"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <span
                  className="font-mono text-[0.65rem] tracking-[0.12em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  Estimasi Total
                </span>
                <span
                  className="font-display font-semibold text-[1.4rem]"
                  style={{ color: "var(--coffee-latte)" }}
                >
                  Rp {grandTotal.toLocaleString("id-ID")}
                </span>
              </div>

              <p
                className="text-[0.72rem] leading-[1.6] mt-2.5"
                style={{ color: "var(--text-muted)" }}
              >
                * Harga belum termasuk ongkos kirim. Admin akan mengkonfirmasi
                total akhir via WhatsApp.
              </p>
            </div>

            {/* WA Checkout button */}
            <a
              href={buildWhatsAppOrderURL(buildCartMessage(items, grandTotal))}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-4 rounded-pill font-mono text-[0.78rem] tracking-[0.1em] uppercase transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #1a3a1b, #0d1f0e)",
                border: "1px solid rgba(74,124,78,0.4)",
                color: "#f5efe6",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 8px 28px rgba(45,90,46,0.35)";
                (e.currentTarget as HTMLAnchorElement).style.transform =
                  "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                (e.currentTarget as HTMLAnchorElement).style.transform =
                  "translateY(0)";
              }}
            >
              <i className="fab fa-whatsapp text-[1rem]" />
              Checkout via WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}
