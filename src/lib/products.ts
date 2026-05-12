// src/lib/products.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sprint 4A — Products fetch dari Supabase
//
// FIX dari versi sebelumnya:
//   1. createClient() di Next.js 16 adalah ASYNC (cookies() dari next/headers
//      sudah async sejak Next.js 15). Wajib: const supabase = await createClient()
//   2. fetchAllFromSupabase didefinisikan ulang secara eksplisit agar tidak
//      hilang saat copy-paste file yang panjang
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import { mapSupabaseToUIProduct } from "@/lib/mappers";
import type { UIProduct } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Static fallback — dipakai jika Supabase gagal / tidak tersedia
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK: UIProduct[] = [
  {
    id: "biochar-001",
    slug: "biochar",
    name: "Biochar",
    tagline:
      "Biochar adalah bukti nyata bahwa ampas kopi dapat memberi manfaat jauh melampaui meja café.",
    price: null,
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
    isFeatured: false,
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
    isFeatured: false,
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
    isFeatured: false,
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
    isFeatured: false,
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
    isFeatured: false,
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
    isFeatured: false,
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
// Core fetch function
// FIX: createClient() di Next.js 15+ / 16 adalah ASYNC karena cookies()
//      dari next/headers sudah async. Wajib: await createClient()
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAll(): Promise<UIProduct[]> {
  try {
    // KUNCI: await createClient() — bukan createClient()
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("is_active", true)
      .order("sort_order");

    if (error || !data || data.length === 0) {
      console.warn(
        "[products] Supabase error atau data kosong, pakai fallback:",
        error?.message,
      );
      return FALLBACK;
    }

    return data.map(mapSupabaseToUIProduct);
  } catch (err) {
    console.error("[products] Unexpected error, pakai fallback:", err);
    return FALLBACK;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — semua async, semua call fetchAll() internal
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<UIProduct[]> {
  return fetchAll();
}

export async function getFeaturedProducts(): Promise<UIProduct[]> {
  const all = await fetchAll();
  return all.filter((p) => p.isFeatured === true);
}

export async function getFeaturedProduct(): Promise<UIProduct> {
  const featured = await getFeaturedProducts();
  return featured[0] ?? FALLBACK[0];
}

export async function getCatalogProducts(): Promise<UIProduct[]> {
  const all = await fetchAll();
  return all.filter((p) => !p.isFeatured);
}

export async function getCatalogByCategory(
  category: string,
): Promise<UIProduct[]> {
  const catalog = await getCatalogProducts();
  if (category === "all") return catalog;
  return catalog.filter((p) => p.category === category);
}

export async function getProductBySlug(
  slug: string,
): Promise<UIProduct | null> {
  const all = await fetchAll();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  const all = await fetchAll();
  return all.map((p) => p.slug);
}

export async function getRelatedProducts(
  currentId: string,
): Promise<UIProduct[]> {
  const all = await fetchAll();
  const current = all.find((p) => p.id === currentId);
  if (!current) return all.filter((p) => p.id !== currentId).slice(0, 3);
  return all
    .filter((p) => p.id !== currentId && p.category === current.category)
    .slice(0, 3);
}
