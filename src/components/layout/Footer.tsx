"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";

const NAV_LINKS = [
  { href: "/",         label: "Home"    },
  { href: "/about",    label: "About"   },
  { href: "/products", label: "Products"},
  { href: "/blog",     label: "Blog"    },
  { href: "/contact",  label: "Contact" },
];

export default function Footer() {
  const { openModal } = useAuthModal();

  return (
    <footer className="pt-16 pb-10 px-12 border-t border-white/5">
      <div className="max-w-[1280px] mx-auto">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/5">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/assets/img/Glogo.png"
                alt="Rebru"
                width={30}
                height={30}
                className="brightness-75"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="font-display text-[1.4rem] font-semibold text-coffee-cream">
                rebru
              </span>
            </div>
            <p className="text-[0.88rem] text-ink-ghost leading-relaxed max-w-[260px] italic">
              &ldquo;Every cup of coffee becomes a catalyst for climate resilience.&rdquo;
            </p>
            <div className="flex gap-3.5 mt-5">
              <a
                href="https://www.instagram.com/rebru.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-pill border border-white/8 text-[0.8rem] text-ink-dim hover:border-coffee-latte/30 hover:text-coffee-latte hover:bg-coffee-latte/5 transition-all duration-300"
              >
                <i className="fab fa-instagram" />
                Instagram
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h5 className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-ink-ghost mb-5">
              Navigate
            </h5>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[0.9rem] text-ink-dim hover:text-coffee-latte transition-colors duration-300"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-ink-ghost mb-5">
              Contact
            </h5>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="mailto:rebruid@gmail.com"
                  className="text-[0.9rem] text-ink-dim hover:text-coffee-latte transition-colors duration-300"
                >
                  rebruid@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/6285237390994"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.9rem] text-ink-dim hover:text-coffee-latte transition-colors duration-300"
                >
                  WhatsApp
                </a>
              </li>
              <li className="text-[0.9rem] text-ink-dim leading-relaxed">
                Jl. Toddopuli 18 No.17,<br />Makassar
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-7">
          <p className="text-[0.78rem] text-ink-ghost">
            &copy; 2025 Rebru. All Rights Reserved.
          </p>

          {/* Dashboard lock icon — subtle, hanya yang tahu */}
          <div className="relative group">
            <button
              onClick={openModal}
              aria-label="Dashboard Access"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-white/6 text-white/18 text-[0.85rem] hover:text-coffee-latte hover:border-coffee-latte/30 hover:bg-coffee-latte/6 transition-all duration-300"
            >
              <i className="fas fa-lock" />
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-[calc(100%+10px)] right-0 bg-coffee-dark border border-coffee-latte/15 rounded-sm px-3 py-1.5 text-[0.7rem] whitespace-nowrap text-ink-dim tracking-[0.08em] opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
              Dashboard Access
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
