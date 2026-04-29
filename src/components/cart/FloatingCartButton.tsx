// src/components/cart/FloatingCartButton.tsx
// components/cart/FloatingCartButton.tsx
// Floating cart button — hanya render di /products
// Behavior: tersembunyi saat cart kosong, slide-up saat ada item, pulse saat item baru ditambah

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";

// ─────────────────────────────────────────────────────────────────────────────
// FloatingCartButton
// ─────────────────────────────────────────────────────────────────────────────

export default function FloatingCartButton() {
  const pathname = usePathname();
  const { openCart, totalItems } = useCart();

  // Track apakah button sedang dalam state "pulse" (saat item baru ditambah)
  const [isPulsing, setIsPulsing] = useState(false);
  const prevTotalRef = useRef(totalItems);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger pulse setiap kali totalItems bertambah
  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      // Bersihkan timer sebelumnya jika ada (rapid add)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);

      setIsPulsing(true);
      pulseTimerRef.current = setTimeout(() => {
        setIsPulsing(false);
      }, 400);
    }
    prevTotalRef.current = totalItems;

    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [totalItems]);

  // Hanya tampil di halaman /products
  if (pathname !== "/products") return null;

  const isVisible = totalItems > 0;

  return (
    <button
      onClick={openCart}
      aria-label="Buka keranjang belanja"
      aria-hidden={!isVisible}
      className="fixed bottom-8 right-8 z-[45] flex items-center justify-center w-14 h-14 rounded-full"
      style={{
        // ── Visibility: slide-up / slide-down ──
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? isPulsing
            ? "translateY(0) scale(1.18)" // pulse: membesar saat item ditambah
            : "translateY(0) scale(1)"
          : "translateY(24px) scale(0.9)", // tersembunyi: geser bawah + mengecil
        pointerEvents: isVisible ? "auto" : "none",
        transition: isPulsing
          ? "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease" // spring bounce
          : "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease",

        // ── Visual ──
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        color: "var(--text-muted)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
      }}
      onMouseEnter={(e) => {
        if (!isVisible) return;
        const btn = e.currentTarget as HTMLButtonElement;
        btn.style.borderColor = "var(--border-strong)";
        btn.style.color = "var(--coffee-latte)";
        btn.style.background = "var(--bg-card)";
        btn.style.boxShadow = "0 12px 40px rgba(0,0,0,0.38)";
        btn.style.transform = "translateY(0) scale(1.08)";
      }}
      onMouseLeave={(e) => {
        if (!isVisible) return;
        const btn = e.currentTarget as HTMLButtonElement;
        btn.style.borderColor = "var(--border-default)";
        btn.style.color = "var(--text-muted)";
        btn.style.background = "var(--bg-surface)";
        btn.style.boxShadow = "0 8px 32px rgba(0,0,0,0.28)";
        btn.style.transform = "translateY(0) scale(1)";
      }}
    >
      <i className="fas fa-shopping-basket text-[1rem]" />

      {/* Badge — jumlah item, muncul dengan animasi scale */}
      <span
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[0.6rem] font-semibold"
        style={{
          background: "var(--coffee-latte)",
          color: "#1a0f0a",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0)",
          transition:
            "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
          transitionDelay: isVisible ? "0.15s" : "0s", // badge muncul sedikit setelah button
        }}
      >
        {totalItems > 9 ? "9+" : totalItems}
      </span>
    </button>
  );
}
