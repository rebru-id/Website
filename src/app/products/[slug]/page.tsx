// src/app/products/[slug]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Sprint 4A: Semua product functions sekarang async — perlu di-await
//
// PERUBAHAN dari versi sebelumnya:
//   - generateStaticParams: await getAllProductSlugs()
//   - generateMetadata: await getProductBySlug()
//   - Page component: async + await getProductBySlug + getRelatedProducts
//   - JSON-LD: pakai product.slug langsung (bukan slugify)
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

// ─────────────────────────────────────────────────────────────────────────────
// Static Generation — pre-render semua slug saat build
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Produk Tidak Ditemukan — Rebru" };

  const baseUrl = "https://rebru.id";
  const productUrl = `${baseUrl}/products/${product.slug}`;

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
// Page Component — async
// ─────────────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // Fetch paralel — product + related sekaligus
  const [product, related] = await Promise.all([
    getProductBySlug(params.slug),
    getRelatedProducts(params.slug).catch(() => []),
  ]);

  if (!product) notFound();

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
      <ErrorBoundary>
        <FloatingCartButton />
        <CartDrawer />
      </ErrorBoundary>
    </>
  );
}
