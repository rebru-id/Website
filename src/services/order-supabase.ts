// src/services/order-supabase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sprint 4B — Pencatatan order ke Supabase sebelum redirect ke WhatsApp
//
// POLA: lazy singleton dari @supabase/supabase-js — identik dengan
//       partnership.ts dan supabase-contact.ts yang sudah terbukti bekerja.
//
// MENGAPA tidak pakai @/lib/supabase/client:
//   File client.ts di Website menggunakan createServerClient + next/headers
//   yang HANYA boleh dipakai di Server Component. CartDrawer adalah
//   "use client" → import chain-nya tidak boleh menyentuh next/headers.
//
// MENGAPA lazy singleton:
//   createClient() dari @supabase/supabase-js aman dipanggil di module level
//   HANYA jika process.env sudah tersedia saat itu. Lazy singleton memastikan
//   client dibuat saat fungsi pertama kali dipanggil (runtime browser),
//   bukan saat module di-evaluate oleh bundler (build time).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CartItem } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Client — Lazy Singleton
// Hardcode fallback aman karena NEXT_PUBLIC_ anon key memang publik by design
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://mubzwqkhhhittibstugh.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Ynp3cWtoaGhpdHRpYnN0dWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTA5NjYsImV4cCI6MjA5MDY4Njk2Nn0.C_YqDM0OFAVc9zww5afq9S0po2n7KzZGW9HhzNsMcrE";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? SUPABASE_ANON;
  _supabase = createClient(url, key);
  return _supabase;
}

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
    const supabase = getSupabase(); // sync — tidak perlu await

    // ── Step 1: Generate UUID di browser, insert tanpa .select() ─────────────
    // crypto.randomUUID() tersedia di semua browser modern + Node.js 14.17+
    // Tidak chain .select() → tidak butuh SELECT RLS policy
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
      return { orderId: null, error: new Error(orderError.message) };
    }

    // ── Step 2: Bulk insert order_items ──────────────────────────────────────
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
