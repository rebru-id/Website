// src/components/layout/Footer.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useLogo } from "@/hooks/useLogo";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import { FOOTER_LINKS } from "@/constants/navigation";

export default function Footer() {
  const { openModal } = useAuthModal();
  const logoSrc = useLogo();
  // FIX: useLogo() tidak pernah return null — null guard lama dihapus.
  // Sebelumnya: if (!logoSrc) return null — footer hilang sempurna saat hydration.

  return (
    <>
      <style>{`
      @keyframes footer-lock-pulse {
        0%   { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    `}</style>
      <footer className="pt-16 pb-10 px-12 border-t border-border-subtle">
        <div className="max-w-[1280px] mx-auto">
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-border-subtle">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Image
                  src={logoSrc}
                  alt="Rebru"
                  width={30}
                  height={30}
                  className="transition-opacity duration-300"
                />
                <span className="font-display text-[1.4rem] font-semibold text-text-primary">
                  rebru
                </span>
              </div>
              <p className="text-[0.88rem] text-text-muted leading-relaxed max-w-[260px] italic">
                &ldquo;Every cup of coffee becomes a catalyst for climate
                resilience.&rdquo;
              </p>
              <div className="flex gap-3.5 mt-5">
                <a
                  href="https://www.instagram.com/rebru.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-border-DEFAULT text-[0.8rem] text-text-secondary hover:border-border-strong hover:text-coffee-latte transition-all duration-300"
                >
                  <i className="fab fa-instagram" />
                  Instagram
                </a>
              </div>
            </div>

            {/* Navigate */}
            <div>
              <h5 className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-muted mb-5">
                Navigate
              </h5>
              <ul className="flex flex-col gap-3">
                {FOOTER_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[0.9rem] text-text-secondary hover:text-coffee-latte transition-colors duration-300"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h5 className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-muted mb-5">
                Contact
              </h5>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href="mailto:rebruid@gmail.com"
                    className="text-[0.9rem] text-text-secondary hover:text-coffee-latte transition-colors duration-300"
                  >
                    rebruid@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/6285237390994"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.9rem] text-text-secondary hover:text-coffee-latte transition-colors duration-300"
                  >
                    WhatsApp
                  </a>
                </li>
                <li className="text-[0.9rem] text-text-secondary leading-relaxed">
                  Jl. Toddopuli 18 No.17,
                  <br />
                  Makassar
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-7">
            <p className="text-[0.78rem] text-text-muted">
              &copy; 2025 Rebru. All Rights Reserved.
            </p>
            {/* Dashboard lock icon — border-border-DEFAULT menggantikan border-border-subtle */}
            {/* Dashboard lock icon — accent color + hover pulse */}
            <div className="relative group">
              {/* Pulse ring — muncul saat hover, animasi sekali */}
              <span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{
                  border: "1px solid var(--coffee-latte)",
                  animation: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.animation =
                    "footer-lock-pulse 0.6s ease-out forwards";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.animation = "none";
                }}
              />

              <button
                onClick={openModal}
                aria-label="Dashboard Access"
                className="relative flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300"
                style={{
                  borderColor: "var(--coffee-latte)",
                  color: "var(--coffee-latte)",
                  background: "transparent",
                  opacity: 0.55,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.opacity = "1";
                  el.style.background = "var(--bg-card)";
                  // trigger pulse pada sibling span
                  const pulse = el.parentElement?.querySelector("span");
                  if (pulse) {
                    pulse.style.animation = "none";
                    // force reflow agar animasi restart
                    void (pulse as HTMLElement).offsetWidth;
                    pulse.style.animation =
                      "footer-lock-pulse 0.6s ease-out forwards";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.opacity = "0.55";
                  el.style.background = "transparent";
                }}
              >
                <i className="fas fa-lock text-[0.75rem]" />
              </button>

              {/* Tooltip */}
              <div className="absolute bottom-[calc(100%+10px)] right-0 bg-bg-surface border border-border-DEFAULT rounded-sm px-3 py-1.5 text-[0.7rem] whitespace-nowrap text-text-secondary tracking-[0.08em] opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                Dashboard Access
              </div>
            </div>{" "}
          </div>
        </div>
      </footer>
    </>
  );
}
