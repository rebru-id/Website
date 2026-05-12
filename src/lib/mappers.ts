// src/lib/mappers.ts
// ─────────────────────────────────────────────────────────────────────────────
// Mapper: Supabase DB row → UIProduct (UI type)
//
// Mengapa mapper dibutuhkan:
//   - Supabase menggunakan snake_case  : accent_bg, accent_border, is_featured
//   - UIProduct menggunakan camelCase  : accentBg, accentBorder, isFeatured
//   - Mapper adalah jembatan konversinya — komponen tidak perlu tahu struktur DB
//
// Dipakai oleh: lib/products.ts (semua fungsi async)
// ─────────────────────────────────────────────────────────────────────────────

import type { UIProduct } from "@/types";

export function mapSupabaseToUIProduct(row: any): UIProduct {
  return {
    // ── Identitas ──
    id: row.id,
    slug: row.slug,

    // ── Konten ──
    name: row.name,
    tagline: row.tagline,
    category: row.category,

    // ── Harga ──
    price: row.price, // null untuk produk R&D
    unit: row.unit,

    // ── Visual ──
    icon: row.icon,
    accent: row.accent,
    accentBg: row.accent_bg, // snake_case → camelCase
    accentBorder: row.accent_border,
    badge: row.badge,
    isFeatured: row.is_featured, // snake_case → camelCase

    // ── Variants — dari JOIN product_variants(*) ──
    variants: (row.product_variants ?? [])
      .filter((v: any) => v.is_active)
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((v: any) => ({
        label: v.label,
        price: v.price,
      })),

    // ── JSONB fields — Supabase langsung kembalikan sebagai object ──
    specs: row.specs ?? {},
    impact: row.impact ?? {},
  };
}
