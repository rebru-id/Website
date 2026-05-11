// src/lib/products.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth untuk semua data produk Rebru
//
// SEBELUMNYA data tersebar di:
//   - ProductsFeaturedSection.tsx  → const BIOCHAR
//   - ProductsCatalogSection.tsx   → const CATALOG_PRODUCTS
//
// SEKARANG semua komponen dan halaman import dari sini:
//   import { getFeaturedProduct, getCatalogProducts, getProductBySlug }
//     from "@/lib/products"
//
// Sprint 4: ganti isi fungsi-fungsi di bawah dengan Supabase fetch.
//   Komponen tidak perlu diubah sama sekali — hanya file ini.
//
//   Contoh Sprint 4:
//   export async function getAllProducts() {
//     const { data } = await supabase
//       .from("products")
//       .select("*, product_variants(*)")
//       .eq("is_active", true)
//     return data.map(mapSupabaseToUIProduct)
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { slugify } from "@/utils";
import type { UIProduct } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Data — semua produk Rebru
// Untuk tambah produk: tambah object baru di array ALL_PRODUCTS
// Untuk edit harga: ubah di variants[].price
// ─────────────────────────────────────────────────────────────────────────────

const ALL_PRODUCTS: UIProduct[] = [
  // ── 1. Biochar — Featured product ────────────────────────────────────────
  {
    id: "biochar-001",
    slug: "biochar",
    name: "Biochar",
    tagline:
      "Biochar adalah bukti nyata bahwa ampas kopi dapat memberi manfaat jauh melampaui meja café.",
    price: null, // tidak ada harga flat — harga per-varian
    unit: "kg",
    category: "soil-amendment",
    icon: "fa-seedling",
    accent: "var(--coffee-latte)",
    accentBg: "rgba(196,149,106,0.08)",
    accentBorder: "rgba(196,149,106,0.2)",
    badge: "Best Seller",
    isFeatured: true,
    variants: [
      { label: "1 Kg", price: 35000 },
      { label: "5 Kg", price: 160000 },
      { label: "10 Kg", price: 300000 },
      { label: "25 Kg", price: 680000 },
    ],
    specs: {
      beratBersih: "1000 gram (1 Kg)",
      bahan:
        "Ampas Kopi (Upcycled, 80%), Biomassa Pilihan Lain (20%), diproses melalui Pirolisis.",
      varian: "1 Kg, 5 Kg, 10 Kg, dan 25 Kg",
      fitur: [
        "Kapasitas Tukar Kation (KTK) Tinggi",
        "Peningkatan Retensi Air",
        "Menyimpan Karbon Jangka Panjang",
        "pH Netral",
      ],
    },
    impact: {
      waste_saved: "800g Ampas Kopi Diselamatkan",
      co2_locked: "1.03 Kg CO₂e",
      description:
        "Biochar memiliki dampak mitigasi iklim terkuat karena secara aktif menyimpan karbon dalam bentuk stabil di dalam tanah.",
      stat: "1 Kg Biochar",
      value: "menyimpan 1.03 Kg CO₂e dalam tanah",
      icon: "fa-seedling",
    },
  },

  // ── 2. Compost ────────────────────────────────────────────────────────────
  {
    id: "compost-001",
    slug: "compost",
    name: "Compost",
    tagline:
      "Ampas kopi yang biasanya terbuang bisa menjadi sumber nutrisi berharga bagi tanah.",
    price: 25000,
    unit: "kg",
    category: "soil-amendment",
    icon: "fa-leaf",
    accent: "var(--forest-sage)",
    accentBg: "rgba(122,171,126,0.08)",
    accentBorder: "rgba(122,171,126,0.2)",
    badge: null,
    isFeatured: true,
    variants: [
      { label: "1 Kg", price: 25000 },
      { label: "5 Kg", price: 110000 },
      { label: "10 Kg", price: 200000 },
    ],
    specs: {
      beratBersih: "1000 gram (1 Kg)",
      bahan:
        "Ampas kopi terfermentasi, dicampur sisa organik restoran dan bahan pendukung kompos.",
      fitur: [
        "Kaya Nitrogen & Mikroba Tanah",
        "Memperbaiki Struktur Tanah",
        "100% Organik",
      ],
    },
    impact: {
      stat: "1 Kg Compost",
      value: "menyelamatkan ~600g ampas kopi dari TPA",
      icon: "fa-seedling",
    },
  },

  // ── 3. Bio-briquettes ─────────────────────────────────────────────────────
  {
    id: "briquette-001",
    slug: "bio-briquettes",
    name: "Bio-briquettes",
    tagline:
      "Rebru menghadirkan briket ramah lingkungan sebagai alternatif energi terbarukan.",
    price: 20000,
    unit: "kg",
    category: "energy",
    icon: "fa-fire",
    accent: "#d4783a",
    accentBg: "rgba(212,120,58,0.08)",
    accentBorder: "rgba(212,120,58,0.2)",
    badge: null,
    isFeatured: true,
    variants: [
      { label: "1 Kg", price: 20000 },
      { label: "5 Kg", price: 90000 },
    ],
    specs: {
      beratBersih: "1000 gram (1 Kg)",
      bahan:
        "Ampas kopi dipadatkan dengan pengikat alami, bebas bahan kimia sintetis.",
      fitur: [
        "Pembakaran Lebih Bersih",
        "Kalori Tinggi",
        "Asap Minimal",
        "Pengganti Arang Kayu",
      ],
    },
    impact: {
      stat: "1 Kg Bio-briquettes",
      value: "menggantikan ~0.8 Kg arang kayu konvensional",
      icon: "fa-fire",
    },
  },

  // ── 4. Scented Candle — EcoGoods ─────────────────────────────────────────
  {
    id: "candle-001",
    slug: "scented-candle",
    name: "Scented Candle",
    tagline:
      "Lilin aromaterapi dari ampas kopi — menghadirkan aroma kopi yang hangat sekaligus mengurangi limbah.",
    price: 50000,
    unit: "pcs",
    category: "ecogoods",
    icon: "fa-fire-flame-curved",
    accent: "#b07d56",
    accentBg: "rgba(176,125,86,0.08)",
    accentBorder: "rgba(176,125,86,0.2)",
    badge: null,
    variants: [
      { label: "1 pcs", price: 50000 },
      { label: "3 pcs", price: 135000 },
    ],
    specs: {
      beratBersih: "— (placeholder)",
      bahan:
        "Campuran lilin kedelai dan ampas kopi upcycled dengan aroma kopi alami.",
      fitur: [
        "Aroma Kopi Alami",
        "Bahan Ramah Lingkungan",
        "Kemasan Biodegradable",
      ],
    },
    impact: {
      stat: "1 Scented Candle",
      value: "memanfaatkan ~30g ampas kopi dari TPA",
      icon: "fa-fire-flame-curved",
    },
  },

  // ── 5. Coaster — EcoGoods ────────────────────────────────────────────────
  {
    id: "coaster-001",
    slug: "coaster",
    name: "Coaster",
    tagline:
      "Tatakan meja dari ampas kopi terkompresi — fungsional, estetik, dan ramah lingkungan.",
    price: 20000,
    unit: "pcs",
    category: "ecogoods",
    icon: "fa-circle",
    accent: "#8a6a4a",
    accentBg: "rgba(138,106,74,0.08)",
    accentBorder: "rgba(138,106,74,0.2)",
    badge: null,
    variants: [
      { label: "1 pcs", price: 20000 },
      { label: "4 pcs", price: 72000 },
    ],
    specs: {
      beratBersih: "— (placeholder)",
      bahan: "Ampas kopi terkompresi dengan resin alami, tahan air dan panas.",
      fitur: ["Tahan Air & Panas", "Tekstur Kopi Alami", "Dapat Dicuci"],
    },
    impact: {
      stat: "1 Coaster",
      value: "memanfaatkan ~50g ampas kopi dari TPA",
      icon: "fa-circle",
    },
  },

  // ── 6. Soap — EcoGoods ───────────────────────────────────────────────────
  {
    id: "soap-001",
    slug: "coffee-soap",
    name: "Coffee Soap",
    tagline:
      "Sabun eksfoliasi dari ampas kopi — membersihkan, menghaluskan, dan menghilangkan bau secara alami.",
    price: 15000,
    unit: "pcs",
    category: "ecogoods",
    icon: "fa-soap",
    accent: "#9e7b5a",
    accentBg: "rgba(158,123,90,0.08)",
    accentBorder: "rgba(158,123,90,0.2)",
    badge: null,
    variants: [
      { label: "1 pcs", price: 15000 },
      { label: "3 pcs", price: 40000 },
      { label: "6 pcs", price: 75000 },
    ],
    specs: {
      beratBersih: "— (placeholder)",
      bahan: "Ampas kopi, minyak kelapa, minyak zaitun, dan pewangi alami.",
      fitur: [
        "Eksfoliasi Alami",
        "Menghilangkan Bau",
        "Bebas Bahan Kimia Keras",
        "Cocok untuk Semua Jenis Kulit",
      ],
    },
    impact: {
      stat: "1 Coffee Soap",
      value: "memanfaatkan ~20g ampas kopi dari TPA",
      icon: "fa-soap",
    },
  },

  // ── 7. Diffuser — EcoGoods R&D ───────────────────────────────────────────
  {
    id: "diffuser-001",
    slug: "coffee-diffuser",
    name: "Coffee Diffuser",
    tagline:
      "Diffuser aromaterapi berbasis ekstrak kopi — menghadirkan aroma kopi segar sepanjang hari.",
    price: null,
    unit: null,
    category: "ecogoods",
    icon: "fa-wind",
    accent: "#7a8a6a",
    accentBg: "rgba(122,138,106,0.07)",
    accentBorder: "rgba(122,138,106,0.2)",
    badge: "In R&D",
    variants: [],
    specs: {
      beratBersih: "—",
      bahan:
        "Ekstrak kopi dan bahan alami. Masih dalam tahap pengembangan formulasi.",
      fitur: ["Aroma Kopi Tahan Lama", "Tanpa Alkohol", "Refillable"],
    },
    impact: {
      stat: "Target",
      value: "memanfaatkan ekstrak limbah cair dari produksi kopi",
      icon: "fa-wind",
    },
  },

  // ── 8. Car Fragrance — EcoGoods R&D ─────────────────────────────────────
  {
    id: "carfrag-001",
    slug: "car-fragrance",
    name: "Car Fragrance",
    tagline:
      "Pengharum mobil dari ampas kopi — aroma kopi natural yang menyegarkan kabin kendaraanmu.",
    price: null,
    unit: null,
    category: "ecogoods",
    icon: "fa-car",
    accent: "#6a7a8a",
    accentBg: "rgba(106,122,138,0.07)",
    accentBorder: "rgba(106,122,138,0.2)",
    badge: "In R&D",
    variants: [],
    specs: {
      beratBersih: "—",
      bahan:
        "Ampas kopi terproses dan minyak esensial alami. Dalam tahap uji ketahanan aroma.",
      fitur: [
        "Aroma Kopi Alami",
        "Tidak Mengandung Bahan Kimia Berbahaya",
        "Bentuk Compact",
      ],
    },
    impact: {
      stat: "Target",
      value: "memanfaatkan ampas kopi yang tidak lolos quality control",
      icon: "fa-car",
    },
  },

  // ── 9. Raw Materials — R&D ────────────────────────────────────────────────
  {
    id: "rawmat-001",
    slug: "raw-materials",
    name: "Raw Materials",
    tagline:
      "Biodegradable cups, blocks, and sustainable packaging prototypes from compressed coffee waste.",
    price: null,
    unit: null,
    category: "raw-materials",
    icon: "fa-flask",
    accent: "#c8a84b",
    accentBg: "rgba(200,168,75,0.07)",
    accentBorder: "rgba(200,168,75,0.2)",
    badge: "In R&D",
    variants: [],
    specs: {
      beratBersih: "—",
      bahan:
        "Ampas kopi terkompresi dengan polimer biodegradable. Masih dalam tahap pengembangan dan uji material.",
      fitur: [
        "Gelas Biodegradable",
        "Blok Bangunan Ringan",
        "Packaging Sustainable",
      ],
    },
    impact: {
      stat: "Target",
      value: "mengalihkan 100% sisa padat dari produksi biochar",
      icon: "fa-flask",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// Sprint 4: ubah fungsi-fungsi ini menjadi async + Supabase fetch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Semua produk — dipakai untuk JSON-LD, sitemap, dan generateStaticParams
 */
export function getAllProducts(): UIProduct[] {
  return ALL_PRODUCTS;
}

/**
 * Produk featured — semua yang isFeatured: true (Biochar, Compost, Bio-briquettes)
 * Dipakai oleh Featured carousel di ProductsFeaturedSection
 * Sprint 4: query products WHERE is_featured = true ORDER BY sort_order
 */
export function getFeaturedProducts(): UIProduct[] {
  return ALL_PRODUCTS.filter((p) => p.isFeatured === true);
}

/**
 * Backward compatible — masih dipakai jika ada kode lama yang import ini
 * Sprint 4: hapus dan ganti dengan getFeaturedProducts()
 */
export function getFeaturedProduct(): UIProduct {
  return ALL_PRODUCTS.find((p) => p.isFeatured) ?? ALL_PRODUCTS[0];
}

/**
 * Produk untuk catalog grid — semua yang tidak featured
 * Sprint 4: query products WHERE is_featured = false AND is_active = true
 */
export function getCatalogProducts(): UIProduct[] {
  return ALL_PRODUCTS.filter((p) => !p.isFeatured);
}

/**
 * Produk catalog berdasarkan kategori — dipakai oleh tab filter
 * category: "all" | "soil-amendment" | "energy" | "ecogoods" | "raw-materials"
 * Sprint 4: query products WHERE category = category AND is_featured = false
 */
export function getCatalogByCategory(category: string): UIProduct[] {
  const catalog = getCatalogProducts();
  if (category === "all") return catalog;
  return catalog.filter((p) => p.category === category);
}

/**
 * Produk berdasarkan slug URL
 * Sprint 4: query products WHERE slug = slug
 */
export function getProductBySlug(slug: string): UIProduct | null {
  return ALL_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

/**
 * Semua slug yang valid — dipakai oleh generateStaticParams di [slug]/page.tsx
 */
export function getAllProductSlugs(): string[] {
  return ALL_PRODUCTS.map((p) => slugify(p.name));
}

/**
 * Produk terkait — produk dari kategori yang sama, kecuali yang sedang dilihat
 * Sprint 4: query produk dengan category yang sama
 */
export function getRelatedProducts(currentId: string): UIProduct[] {
  const current = ALL_PRODUCTS.find((p) => p.id === currentId);
  if (!current)
    return ALL_PRODUCTS.filter((p) => p.id !== currentId).slice(0, 3);
  return ALL_PRODUCTS.filter(
    (p) => p.id !== currentId && p.category === current.category,
  ).slice(0, 3);
}
