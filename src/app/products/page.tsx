import Navbar from "@/components/layout/Navbar";
import Footer  from "@/components/layout/Footer";
import AuthModal        from "@/components/dashboard/AuthModal";
import DashboardOverlay from "@/components/dashboard/DashboardOverlay";

export default function Page() {
  return (
    <>
      <AuthModal />
      <DashboardOverlay />
      <Navbar />
      <main className="min-h-screen flex items-center justify-center pt-24 px-12">
        <div className="text-center">
          <span className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-forest-sage block mb-4">
            Coming Soon
          </span>
          <h1 className="font-display text-[3rem] font-semibold text-coffee-foam capitalize">
            Page
          </h1>
          <p className="text-ink-dim mt-4 text-[0.95rem]">
            This page will be built in the next sprint.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
