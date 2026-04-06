"use client";

import Link from "next/link";
import Image from "next/image";
import { useLogo } from "@/hooks/useLogo";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";
import { FOOTER_LINKS } from "@/constants/navigation";

export default function Footer() {
  const { openModal } = useAuthModal();
  const logoSrc = useLogo();

  return (
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
          <div className="relative group">
            <button
              onClick={openModal}
              aria-label="Dashboard Access"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border-DEFAULT text-text-muted hover:border-border-strong hover:text-coffee-latte hover:bg-bg-card transition-all duration-300"
            >
              <i className="fas fa-lock text-[0.75rem]" />
            </button>
            <div className="absolute bottom-[calc(100%+10px)] right-0 bg-bg-surface border border-border-DEFAULT rounded-sm px-3 py-1.5 text-[0.7rem] whitespace-nowrap text-text-secondary tracking-[0.08em] opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              Dashboard Access
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
