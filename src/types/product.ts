// src/types/product.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tipe terpusat untuk semua data produk di UI products page
//
// CATATAN PENAMAAN:
// `UIProduct` digunakan (bukan `Product`) karena src/types/index.ts sudah
// memiliki `interface Product` yang merefleksikan schema Supabase (minimalis).
// UIProduct adalah representasi lengkap untuk kebutuhan komponen UI —
// termasuk variants, accent, badge, specs, impact yang tidak ada di DB schema.
//
// Sprint 4: saat fetch dari Supabase, map response ke UIProduct di data layer,
// bukan langsung di komponen — komponen tetap menerima UIProduct.
// ─────────────────────────────────────────────────────────────────────────────

// ── Sub-types ────────────────────────────────────────────────────────────────

/**
 * Satu varian produk dengan harga spesifik.
 * Sprint 4: maps ke tabel `product_variants` (id, product_id, label, price, stock)
 */
export interface ProductVariant {
  label: string; // e.g. "1 Kg", "5 Kg"
  price: number; // harga untuk varian ini — bukan harga flat produk
}

/**
 * Spesifikasi teknis produk — ditampilkan di accordion "Spesifikasi".
 *
 * Dua set field yang dipakai saat ini:
 * - Featured (Biochar) : beratBersih, bahan, varian, fitur
 * - Catalog cards      : beratBersih, bahan, fitur
 *
 * Semua field opsional karena tiap produk punya specs berbeda.
 * Sprint 4: bisa disimpan sebagai JSONB di kolom `products.specs`
 */
export interface ProductSpecs {
  beratBersih?: string; // e.g. "1000 gram (1 Kg)"
  bahan?: string; // deskripsi bahan — dipakai di Featured dan Catalog
  varian?: string; // e.g. "1 Kg, 5 Kg, 10 Kg" — dipakai di Featured
  fitur?: string[]; // list fitur produk
  [key: string]: string | string[] | undefined; // extensible untuk produk baru
}

/**
 * Data dampak lingkungan produk.
 *
 * Dua format yang dipakai saat ini:
 * - Featured (Biochar) : waste_saved + co2_locked + description (format panjang)
 * - Catalog cards      : stat + value (format ringkas untuk card kecil)
 *
 * Semua field kecuali `icon` dibuat opsional karena formatnya berbeda per produk.
 * Sprint 4: bisa disimpan sebagai JSONB di kolom `products.impact`
 */
export interface ProductImpact {
  // Format Featured — Biochar
  waste_saved?: string; // e.g. "800g Ampas Kopi Diselamatkan"
  co2_locked?: string; // e.g. "1.03 Kg CO₂e"
  description?: string; // paragraf dampak panjang

  // Format Catalog cards — Compost, Bio-briquettes, Raw Materials
  stat?: string; // e.g. "1 Kg Compost"
  value?: string; // e.g. "menyelamatkan ~600g ampas kopi dari TPA"

  // Shared — wajib ada di semua produk yang punya impact
  icon: string; // Font Awesome class, e.g. "fa-seedling"
}

// ── Main UIProduct interface ──────────────────────────────────────────────────

/**
 * Interface utama produk untuk UI products page — dipakai di semua komponen.
 * Berbeda dari `Product` (Supabase schema) yang hanya berisi field database.
 *
 * Field opsional (?) menandai data yang:
 * - Belum ada di semua produk (e.g. kategori hanya di Featured)
 * - Null untuk produk R&D (e.g. price, unit, variants)
 * - Spesifik section tertentu (e.g. accentBg hanya di Catalog cards)
 */
export interface UIProduct {
  // ── Identitas ──
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category?: string;

  // ── Harga & unit ──
  price: number | null;
  unit: string | null;
  variants: ProductVariant[];

  // ── Visual ──
  icon?: string;
  accent: string;
  accentBg?: string;
  accentBorder?: string;
  badge: string | null;

  isFeatured?: boolean;

  // ── Konten detail ──
  specs?: ProductSpecs;
  impact?: ProductImpact;
}
