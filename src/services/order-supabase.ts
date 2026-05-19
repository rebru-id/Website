// src/services/order-supabase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sprint 4B — Pencatatan order ke Supabase sebelum redirect ke WhatsApp
//
// FIX dari versi sebelumnya:
//   SEBELUM: .insert({...}).select("id").single()
//     → Supabase melakukan INSERT lalu SELECT kembali row tersebut
//     → SELECT butuh SELECT RLS policy yang tidak ada
//     → Error: "new row violates row-level security policy"
//
//   SESUDAH: crypto.randomUUID() + .insert({ id: orderId, ... })
//     → UUID di-generate di browser (tidak perlu baca balik dari DB)
//     → Hanya butuh INSERT policy (sudah ada: anon_insert_orders)
//     → Tidak ada RLS conflict
//
// Pola ini identik dengan supabase-contact.ts yang sudah bekerja:
//   insertContactMessage() → .insert({...}) tanpa .select() → works ✅
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type OrderSource = "/products" | "/ig";

export interface InsertOrderResult {
  orderId: string | null;
  error: Error | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// insertOrder
// ─────────────────────────────────────────────────────────────────────────────

export async function insertOrder(
  items: CartItem[],
  total: number,
  source: OrderSource = "/products",
): Promise<InsertOrderResult> {
  if (!items || items.length === 0) {
    return { orderId: null, error: new Error("Cart kosong") };
  }

  try {
    const supabase = createClient();

    // ── Step 1: Generate UUID di browser ──────────────────────────────────────
    // crypto.randomUUID() tersedia di semua browser modern + Node.js 14.17+
    // Dengan set id eksplisit, tidak perlu .select() setelah insert
    // → tidak butuh SELECT RLS policy → tidak ada RLS conflict
    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase.from("orders").insert({
      id: orderId,
      total_amount: total,
      source,
      channel: "whatsapp",
      status: "pending",
    });

    if (orderError) {
      console.error("[order-supabase] insert orders:", orderError.message);
      return {
        orderId: null,
        error: new Error(orderError.message),
      };
    }

    // ── Step 2: Bulk insert order_items ───────────────────────────────────────
    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      variant: item.variant,
      quantity: item.qty,
      price: item.price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("[order-supabase] insert order_items:", itemsError.message);
      return { orderId, error: new Error(itemsError.message) };
    }

    return { orderId, error: null };
  } catch (err) {
    console.error("[order-supabase] unexpected error:", err);
    return {
      orderId: null,
      error: err instanceof Error ? err : new Error("Unknown error"),
    };
  }
}
