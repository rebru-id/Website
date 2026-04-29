// src/app/products/[slug]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Halaman detail produk — /products/[slug]
//
// generateStaticParams: pre-render semua slug saat build (Static Site Generation)
// generateMetadata: metadata dinamis per produk (title, description, OG tags)
//
// Sprint 4: ubah ke dynamic rendering saat data dari Supabase
//   export const dynamic = "force-dynamic"
//   atau gunakan revalidate untuk ISR
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import FloatingCartButton from "@/components/cart/FloatingCartButton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ProductDetailSection from "@/components/sections/ProductsDetailSection";

import {
  getProductBySlug,
  getAllProductSlugs,
  getRelatedProducts,
} from "@/lib/products";
import { slugify } from "@/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Static Generation — pre-render semua halaman detail saat build
// ─────────────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Metadata — title dan description unik per produk
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: "Produk Tidak Ditemukan — Rebru" };

  const baseUrl = "https://rebru.id";
  const productUrl = `${baseUrl}/products/${params.slug}`;

  // Harga terendah untuk meta description
  const lowestPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : null;

  const priceText = lowestPrice
    ? ` Mulai Rp ${lowestPrice.toLocaleString("id-ID")}.`
    : "";

  return {
    title: `${product.name} — Rebru`,
    description: `${product.tagline}${priceText} Produk circular economy dari ampas kopi, Makassar.`,
    openGraph: {
      title: `${product.name} — Rebru`,
      description: product.tagline,
      url: productUrl,
      siteName: "Rebru",
      locale: "id_ID",
      type: "website",
    },
    // JSON-LD untuk halaman detail produk individual
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.tagline,
        url: productUrl,
        brand: { "@type": "Brand", name: "Rebru" },
        offers:
          product.variants.length > 0
            ? product.variants.map((v) => ({
                "@type": "Offer",
                name: v.label,
                price: v.price,
                priceCurrency: "IDR",
                availability: "https://schema.org/InStock",
              }))
            : {
                "@type": "Offer",
                availability: "https://schema.org/PreOrder",
                priceCurrency: "IDR",
              },
      }),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = getProductBySlug(params.slug);

  // Redirect ke 404 jika slug tidak valid
  if (!product) notFound();

  const related = getRelatedProducts(product.id);

  return (
    <>
      <Navbar />
      <main>
        <ErrorBoundary>
          <ProductDetailSection
            product={product}
            related={related}
            slug={params.slug}
          />
        </ErrorBoundary>
      </main>
      <Footer />

      {/* Cart UI — sama seperti /products */}
      <ErrorBoundary>
        <FloatingCartButton />
        <CartDrawer />
      </ErrorBoundary>
    </>
  );
}
