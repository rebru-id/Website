// components/cart/CartDrawer.tsx

"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { buildCartMessage, buildWhatsAppOrderURL } from "@/services/order";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — placeholder saat data loading (Sprint 4: pass isLoading dari hook)
// ─────────────────────────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <div className="py-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-4 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {/* Accent bar placeholder */}
          <div
            className="w-1 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: "var(--border-default)", height: "80px" }}
          />
          <div className="flex-1 space-y-2.5">
            {/* Name */}
            <div
              className="h-4 rounded animate-pulse"
              style={{ background: "var(--border-subtle)", width: "55%" }}
            />
            {/* Variant */}
            <div
              className="h-3 rounded animate-pulse"
              style={{ background: "var(--border-subtle)", width: "30%" }}
            />
            {/* Price */}
            <div
              className="h-3 rounded animate-pulse mt-3"
              style={{ background: "var(--border-subtle)", width: "40%" }}
            />
            {/* Qty + subtotal row */}
            <div className="flex justify-between items-center mt-2">
              <div
                className="h-8 w-24 rounded-pill animate-pulse"
                style={{ background: "var(--border-subtle)" }}
              />
              <div
                className="h-5 w-20 rounded animate-pulse"
                style={{ background: "var(--border-subtle)" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
            {/* Minus — disabled & visual feedback saat qty = 1 */}
            <button
              onClick={() => updateQty(item.id, item.qty - 1)}
              className="w-8 h-8 flex items-center justify-center transition-all duration-200"
              style={{
                color:
                  item.qty <= 1
                    ? "var(--border-default)"
                    : "var(--text-secondary)",
                cursor: item.qty <= 1 ? "not-allowed" : "pointer",
                opacity: item.qty <= 1 ? 0.4 : 1,
              }}
              disabled={item.qty <= 1}
              aria-label="Kurangi jumlah"
            >
              <i className="fas fa-minus text-[0.55rem]" />
            </button>
            <span
              className="w-8 text-center font-mono text-[0.82rem]"
              style={{ color: "var(--text-primary)" }}
            >
              {item.qty}
            </span>
            {/* Plus — disabled & visual feedback saat qty = 99 */}
            <button
              onClick={() => updateQty(item.id, item.qty + 1)}
              className="w-8 h-8 flex items-center justify-center transition-all duration-200"
              style={{
                color:
                  item.qty >= 99
                    ? "var(--border-default)"
                    : "var(--text-secondary)",
                cursor: item.qty >= 99 ? "not-allowed" : "pointer",
                opacity: item.qty >= 99 ? 0.4 : 1,
              }}
              disabled={item.qty >= 99}
              aria-label="Tambah jumlah"
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

interface CartDrawerProps {
  /**
   * Sprint 4: pass isLoading dari Supabase data hook.
   * Saat true, item list diganti skeleton placeholder.
   * Default false — data hardcoded tidak butuh loading state.
   */
  isLoading?: boolean;
}

export default function CartDrawer({ isLoading = false }: CartDrawerProps) {
  const { items, isOpen, closeCart, grandTotal, totalItems, clearCart } =
    useCart();
  const toast = useToast();

  // State konfirmasi clearCart — inline confirm tanpa modal baru
  const [confirmClear, setConfirmClear] = useState(false);

  // State checkout — mencegah double-submit + memberi feedback visual
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);

  function handleClearCart() {
    clearCart();
    setConfirmClear(false);
  }

  // Reset semua state saat drawer ditutup
  function handleClose() {
    closeCart();
    setConfirmClear(false);
    // Jangan reset checkoutDone di sini — biarkan animasi selesai dulu
  }

  // ── Checkout handler ──
  // 1. Buka WA di tab baru
  // 2. Tampilkan feedback "Pesanan dikirim"
  // 3. Setelah 1.5 detik: kosongkan cart + tutup drawer
  function handleCheckout() {
    if (isCheckingOut || checkoutDone) return;

    const message = buildCartMessage(items, grandTotal);
    const url = buildWhatsAppOrderURL(message);

    window.open(url, "_blank", "noopener,noreferrer");

    setIsCheckingOut(true);

    // Fase 1: tampilkan "Pesanan dikirim ✓"
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutDone(true);

      toast.show("Pesanan berhasil dikirim ke WhatsApp 🌱");

      // Fase 2: kosongkan cart + tutup drawer
      setTimeout(() => {
        clearCart();
        closeCart();
        setCheckoutDone(false);
        setConfirmClear(false);
      }, 1200);
    }, 800);
  }

  // Build WA message dipindah ke dalam handleCheckout
  // Sprint 4: bisa diganti dengan Supabase order creation di dalam handleCheckout

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
        onClick={handleClose}
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
              <>
                {confirmClear ? (
                  // ── State konfirmasi: tampil dua tombol Yakin / Batal ──
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-mono text-[0.6rem] tracking-[0.08em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Yakin?
                    </span>
                    <button
                      onClick={handleClearCart}
                      className="font-mono text-[0.62rem] tracking-[0.1em] uppercase px-3 py-1.5 rounded-pill transition-all duration-200"
                      style={{
                        color: "#f87171",
                        border: "1px solid rgba(248,113,113,0.35)",
                        background: "rgba(248,113,113,0.08)",
                      }}
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="font-mono text-[0.62rem] tracking-[0.1em] uppercase px-3 py-1.5 rounded-pill transition-all duration-200"
                      style={{
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  // ── State normal: tombol Kosongkan ──
                  <button
                    onClick={() => setConfirmClear(true)}
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
              </>
            )}
            <button
              onClick={handleClose}
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
          {isLoading ? (
            // Sprint 4: skeleton muncul saat data Supabase belum tersedia
            <CartSkeleton />
          ) : items.length === 0 ? (
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

            {/* WA Checkout button — 3 state: idle / checking out / done */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || checkoutDone}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-pill font-mono text-[0.78rem] tracking-[0.1em] uppercase transition-all duration-300"
              style={{
                background: checkoutDone
                  ? "linear-gradient(135deg, #0f2e10, #071a08)" // lebih gelap saat done
                  : "linear-gradient(135deg, #1a3a1b, #0d1f0e)",
                border: checkoutDone
                  ? "1px solid rgba(74,124,78,0.7)"
                  : "1px solid rgba(74,124,78,0.4)",
                color: "#f5efe6",
                opacity: isCheckingOut ? 0.85 : 1,
                cursor: isCheckingOut || checkoutDone ? "default" : "pointer",
                transform: checkoutDone ? "scale(0.99)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (isCheckingOut || checkoutDone) return;
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 28px rgba(45,90,46,0.35)";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                if (isCheckingOut || checkoutDone) return;
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
              }}
            >
              {isCheckingOut ? (
                // State: memproses — spinner sederhana via animasi border
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "rgba(245,239,230,0.3)",
                      borderTopColor: "#f5efe6",
                    }}
                  />
                  Membuka WhatsApp...
                </>
              ) : checkoutDone ? (
                // State: selesai — konfirmasi visual sebelum drawer menutup
                <>
                  <i className="fas fa-check text-[0.85rem]" />
                  Pesanan Dikirim
                </>
              ) : (
                // State: idle — default
                <>
                  <i className="fab fa-whatsapp text-[1rem]" />
                  Checkout via WhatsApp
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
