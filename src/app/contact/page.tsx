import Navbar            from "@/components/layout/Navbar";
import Footer            from "@/components/layout/Footer";
import AuthModal         from "@/components/dashboard/AuthModal";
import DashboardOverlay  from "@/components/dashboard/DashboardOverlay";

import ContactHeroSection     from "@/components/sections/ContactHeroSection";
import ContactPackagesSection from "@/components/sections/ContactPackagesSection";
import ContactFormSection     from "@/components/sections/ContactFormSection";

export const metadata = {
  title: "Get in Touch — Rebru",
  description:
    "Bergabunglah sebagai Mitra Rebru atau kirimkan pesan kepada kami. Tiga skema kemitraan tersedia untuk kafe dan bisnis F&B di Makassar.",
};

export default function ContactPage() {
  return (
    <>
      <AuthModal />
      <DashboardOverlay />
      <Navbar />
      <main>
        <ContactHeroSection />
        <ContactPackagesSection />
        <ContactFormSection />
      </main>
      <Footer />
    </>
  );
}
