import type { Metadata } from "next";
import Navbar              from "@/components/layout/Navbar";
import Footer              from "@/components/layout/Footer";
import AuthModal           from "@/components/dashboard/AuthModal";
import DashboardOverlay    from "@/components/dashboard/DashboardOverlay";
import HeroSection         from "@/components/sections/HeroSection";
import ImpactSection       from "@/components/sections/ImpactSection";
import AboutTeaserSection  from "@/components/sections/AboutTeaserSection";
import ProductsTeaserSection from "@/components/sections/ProductsTeaserSection";
import BlogTeaserSection   from "@/components/sections/BlogTeaserSection";
import CtaBannerSection    from "@/components/sections/CtaBannerSection";

export const metadata: Metadata = {
  title: "Rebru — Brewing Scalable Impact From Coffee Waste",
};

export default function HomePage() {
  return (
    <>
      {/* ── Modals & overlays (client components) ── */}
      <AuthModal />
      <DashboardOverlay />

      {/* ── Navigation ── */}
      <Navbar />

      {/* ── Main page content ── */}
      <main>
        <HeroSection />
        <ImpactSection />
        <AboutTeaserSection />
        <ProductsTeaserSection />
        <BlogTeaserSection />
        <CtaBannerSection />
      </main>

      {/* ── Footer with dashboard lock icon ── */}
      <Footer />
    </>
  );
}
