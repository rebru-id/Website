// src/types/cart.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tipe terpusat untuk cart system
//
// Sebelumnya CartItem didefinisikan di dalam CartContext.tsx.
// Dipindah ke sini agar bisa diimport di komponen lain
// (misal: order.ts, CartDrawer.tsx, future checkout page)
// tanpa harus import dari context — menghindari circular dependency.
//
// Sprint 4: CartItem.product_id maps ke products.id di Supabase
//           CartItem.variant maps ke product_variants.label
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string; // unique key: `${product_id}-${variant}`
  product_id: string; // → products.id (Supabase Sprint 4)
  name: string;
  variant: string; // label varian yang dipilih, e.g. "5 Kg"
  price: number; // harga aktual varian saat ditambahkan ke cart
  qty: number;
  subtotal: number; // price × qty — dihitung ulang saat qty berubah
  accent: string; // warna accent untuk UI cart item
}
