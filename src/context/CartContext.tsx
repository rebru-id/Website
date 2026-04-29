// src/context/CartContext.tsx

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";

// Re-export agar komponen yang sudah import CartItem dari context tidak perlu ubah path
// Sprint 4: hapus re-export ini dan import langsung dari "@/types"
export type { CartItem } from "@/types";

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  grandTotal: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "id" | "subtotal">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Batas maksimum qty per item di cart — Sprint 4: bisa diganti dari stock Supabase */
const QTY_MAX = 99;

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const grandTotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((incoming: Omit<CartItem, "id" | "subtotal">) => {
    const id = `${incoming.product_id}-${incoming.variant}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        // Clamp agar tidak melebihi QTY_MAX saat item sudah ada
        const newQty = Math.min(existing.qty + incoming.qty, QTY_MAX);
        return prev.map((i) =>
          i.id === id ? { ...i, qty: newQty, subtotal: newQty * i.price } : i,
        );
      }
      // Clamp qty item baru
      const clampedQty = Math.min(incoming.qty, QTY_MAX);
      return [
        ...prev,
        {
          ...incoming,
          id,
          qty: clampedQty,
          subtotal: clampedQty * incoming.price,
        },
      ];
    });
    // Drawer tidak auto-buka — feedback via Toast + FloatingCartButton animation
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    // Batas bawah: 1 | Batas atas: QTY_MAX
    if (qty < 1) return;
    const clampedQty = Math.min(qty, QTY_MAX);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, qty: clampedQty, subtotal: clampedQty * i.price }
          : i,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalItems,
        grandTotal,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
