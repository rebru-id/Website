// src/app/products/page.tsx
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
import { getAllProducts } from "@/lib/products";
import { slugify } from "@/utils";

export const metadata = {
  title: "Products — Rebru",
  description:
    "Biochar, compost, bio-briquettes, and sustainable raw materials made from spent coffee grounds. Circular economy products from Makassar.",
};

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD Structured Data
// Format: ItemList → setiap produk sebagai ListItem berisi Product schema
// Membuka kemungkinan rich results di Google Search dan Google Shopping
// ─────────────────────────────────────────────────────────────────────────────

function buildJsonLd() {
  const products = getAllProducts();
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
        "@id": `${baseUrl}/products/${slugify(product.name)}`,
        name: product.name,
        description: product.tagline,
        url: `${baseUrl}/products/${slugify(product.name)}`,
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

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  return (
    <>
      {/* JSON-LD Structured Data — dibaca Google untuk rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      <AuthModal />
      <DashboardOverlay />
      <Navbar />
      <main>
        {/* Hero tidak di-wrap — kalau crash, lebih baik terlihat daripada halaman kosong */}
        <ProductsHeroSection />

        {/* Featured dan Catalog di-wrap terpisah — crash satu tidak mematikan yang lain */}
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
          <ProductsFeaturedSection />
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
          <ProductsCatalogSection />
        </ErrorBoundary>

        <CtaBannerSection />
      </main>
      <Footer />

      {/* Cart UI — hanya di halaman Products */}
      <ErrorBoundary>
        <FloatingCartButton />
        <CartDrawer />
      </ErrorBoundary>
    </>
  );
}
