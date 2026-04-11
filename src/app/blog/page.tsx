import Navbar            from "@/components/layout/Navbar";
import Footer            from "@/components/layout/Footer";
import AuthModal         from "@/components/dashboard/AuthModal";
import DashboardOverlay  from "@/components/dashboard/DashboardOverlay";

import BlogHeroSection     from "@/components/sections/BlogHeroSection";
import BlogFeaturedSection from "@/components/sections/BlogFeaturedSection";
import BlogGridSection     from "@/components/sections/BlogGridSection";
import BlogImpactSection   from "@/components/sections/BlogImpactSection";
import CtaBannerSection    from "@/components/sections/CtaBannerSection";

export const metadata = {
  title: "Blog — Rebru",
  description:
    "Stories, science, and insights from Rebru — Indonesia's circular economy platform built on coffee waste.",
};

export default function BlogPage() {
  return (
    <>
      <AuthModal />
      <DashboardOverlay />
      <Navbar />
      <main>
        <BlogHeroSection />
        <BlogFeaturedSection />
        <BlogGridSection />
        <BlogImpactSection />
        <CtaBannerSection />
      </main>
      <Footer />
    </>
  );
}
