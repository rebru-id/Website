// src/app/products/page.tsx
// FIX: buildJsonLd() — getAllProducts() sekarang async, wajib await

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/dashboard/AuthModal";
import DashboardOverlay from "@/components/dashboard/DashboardOverlay";
import ProductsHeroSection from "@/components/sections/ProductsHeroSection";
import ProductsFeaturedSection from "@/components/sections/ProductsFeaturedSection";
import ProductsCatalogSection from "@/components/sections/ProductsCatalogSection";
import CtaBannerSection from "@/components/sections/CtaBannerSection";
import FloatingCartButton from "@/components/cart/FloatingCartButton";
import CartDrawer from "@/components/cart/CartDrawer";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  getAllProducts,
  getFeaturedProducts,
  getCatalogProducts,
} from "@/lib/products";

export const metadata = {
  title: "Products — Rebru",
  description:
    "Biochar, compost, bio-briquettes, and sustainable raw materials made from spent coffee grounds. Circular economy products from Makassar.",
};

async function buildJsonLd() {
  // FIX: tambah await — getAllProducts() sekarang async
  const products = await getAllProducts();
  const baseUrl = "https://rebru.id";

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Rebru Products",
    description: "Circular economy products made from spent coffee grounds",
    url: `${baseUrl}/products`,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        "@id": `${baseUrl}/products/${product.slug}`,
        name: product.name,
        description: product.tagline,
        url: `${baseUrl}/products/${product.slug}`,
        brand: { "@type": "Brand", name: "Rebru" },
        offers:
          product.variants.length > 0
            ? product.variants.map((v) => ({
                "@type": "Offer",
                name: v.label,
                price: v.price,
                priceCurrency: "IDR",
                availability: "https://schema.org/InStock",
                seller: { "@type": "Organization", name: "Rebru" },
              }))
            : {
                "@type": "Offer",
                availability: "https://schema.org/PreOrder",
                priceCurrency: "IDR",
                seller: { "@type": "Organization", name: "Rebru" },
              },
        ...(product.badge === "Best Seller" && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: "24",
          },
        }),
      },
    })),
  };
}

export default async function ProductsPage() {
  const [featured, catalog, jsonLd] = await Promise.all([
    getFeaturedProducts(),
    getCatalogProducts(),
    buildJsonLd(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthModal />
      <DashboardOverlay />
      <Navbar />
      <main>
        <ProductsHeroSection />
        <ErrorBoundary
          fallback={
            <div
              className="py-24 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <p className="font-mono text-[0.75rem] tracking-[0.15em] uppercase">
                Produk unggulan tidak dapat dimuat
              </p>
            </div>
          }
        >
          <ProductsFeaturedSection products={featured} />
        </ErrorBoundary>
        <ErrorBoundary
          fallback={
            <div
              className="py-24 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <p className="font-mono text-[0.75rem] tracking-[0.15em] uppercase">
                Katalog produk tidak dapat dimuat
              </p>
            </div>
          }
        >
          <ProductsCatalogSection products={catalog} />
        </ErrorBoundary>
        <CtaBannerSection />
      </main>
      <Footer />
      <ErrorBoundary>
        <FloatingCartButton />
        <CartDrawer />
      </ErrorBoundary>
    </>
  );
}
