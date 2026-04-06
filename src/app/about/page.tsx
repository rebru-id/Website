import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/dashboard/AuthModal";
import DashboardOverlay from "@/components/dashboard/DashboardOverlay";

import AboutHeroSection from "@/components/sections/AboutHeroSection";
import AboutMissionSection from "@/components/sections/AboutMissionSection";
import AboutProcessSection from "@/components/sections/AboutProcessSection";
import AboutValuesSection from "@/components/sections/AboutValuesSection";
import CtaBannerSection from "@/components/sections/CtaBannerSection";

export const metadata = {
  title: "About — Rebru",
  description:
    "Rebru transforms spent coffee grounds into biochar, compost, and sustainable materials — leading circular economy innovation from Makassar, South Sulawesi.",
};

export default function AboutPage() {
  return (
    <>
      <AuthModal />
      <DashboardOverlay />
      <Navbar />
      <main>
        <AboutHeroSection />
        <AboutMissionSection />
        <AboutProcessSection />
        <AboutValuesSection />
        <CtaBannerSection />
      </main>
      <Footer />
    </>
  );
}
