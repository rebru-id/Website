"use client";

import { useCart } from "@/context/CartContext";

// ─────────────────────────────────────────────────────────────────────────────
// CartButton — bisa dipakai di Navbar atau floating
// ─────────────────────────────────────────────────────────────────────────────

export default function CartButton() {
  const { openCart, totalItems } = useCart();

  return (
    <button
      onClick={openCart}
      aria-label="Buka keranjang belanja"
      className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
      style={{
        border: "1px solid var(--border-default)",
        color: "var(--text-muted)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border-strong)";
        (e.currentTarget as HTMLButtonElement).style.color =
          "var(--coffee-latte)";
        (e.currentTarget as HTMLButtonElement).style.background =
          "var(--bg-card)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border-default)";
        (e.currentTarget as HTMLButtonElement).style.color =
          "var(--text-muted)";
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <i className="fas fa-shopping-basket text-[0.78rem]" />

      {/* Badge */}
      {totalItems > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center font-mono text-[0.55rem] font-semibold"
          style={{
            background: "var(--coffee-latte)",
            color: "#1a0f0a",
          }}
        >
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </button>
  );
}
