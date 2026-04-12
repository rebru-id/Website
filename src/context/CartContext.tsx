// src/context/CartContext.tsx

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types — Sprint 4: CartItem.product_id maps ke products.id di Supabase
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string; // unique key: product_id + variant
  product_id: string; // → products.id (Supabase Sprint 4)
  name: string;
  variant: string;
  price: number;
  qty: number;
  subtotal: number;
  accent: string; // warna accent untuk UI
}

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
        // Update qty jika item sudah ada
        return prev.map((i) =>
          i.id === id
            ? {
                ...i,
                qty: i.qty + incoming.qty,
                subtotal: (i.qty + incoming.qty) * i.price,
              }
            : i,
        );
      }
      return [
        ...prev,
        { ...incoming, id, subtotal: incoming.qty * incoming.price },
      ];
    });
    setIsOpen(true); // auto-buka drawer saat add
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty, subtotal: qty * i.price } : i,
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
