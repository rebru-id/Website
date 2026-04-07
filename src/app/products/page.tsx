import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/dashboard/AuthModal";
import DashboardOverlay from "@/components/dashboard/DashboardOverlay";

import ProductsHeroSection from "@/components/sections/ProductsHeroSection";
import ProductsFeaturedSection from "@/components/sections/ProductsFeaturedSection";
import ProductsCatalogSection from "@/components/sections/ProductsCatalogSection";
import CtaBannerSection from "@/components/sections/CtaBannerSection";

export const metadata = {
  title: "Products — Rebru",
  description:
    "Biochar, compost, bio-briquettes, and sustainable raw materials made from spent coffee grounds. Circular economy products from Makassar.",
};

export default function ProductsPage() {
  return (
    <>
      <AuthModal />
      <DashboardOverlay />
      <Navbar />
      <main>
        <ProductsHeroSection />
        <ProductsFeaturedSection />
        <ProductsCatalogSection />
        <CtaBannerSection />
      </main>
      <Footer />
    </>
  );
}
