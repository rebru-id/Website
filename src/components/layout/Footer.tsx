"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuthModal } from "@/components/dashboard/AuthModalContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  const { openModal } = useAuthModal();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isLight = mounted && resolvedTheme === "light";
  const logoSrc = isLight ? "/assets/img/Glogo.png" : "/assets/img/logo.png";

  return (
    <footer
      className="pt-16 pb-10 px-12"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Main grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
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
              <span
                className="font-display text-[1.4rem] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                rebru
              </span>
            </div>
            <p
              className="text-[0.88rem] leading-relaxed max-w-[260px] italic"
              style={{ color: "var(--text-muted)" }}
            >
              &ldquo;Every cup of coffee becomes a catalyst for climate
              resilience.&rdquo;
            </p>
            <div className="flex gap-3.5 mt-5">
              <a
                href="https://www.instagram.com/rebru.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-pill text-[0.8rem] transition-all duration-300"
                style={{
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                <i className="fab fa-instagram" />
                Instagram
              </a>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h5
              className="font-mono text-[0.7rem] tracking-[0.2em] uppercase mb-5"
              style={{ color: "var(--text-muted)" }}
            >
              Navigate
            </h5>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[0.9rem] transition-colors duration-300"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5
              className="font-mono text-[0.7rem] tracking-[0.2em] uppercase mb-5"
              style={{ color: "var(--text-muted)" }}
            >
              Contact
            </h5>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="mailto:rebruid@gmail.com"
                  className="text-[0.9rem] transition-colors duration-300"
                  style={{ color: "var(--text-secondary)" }}
                >
                  rebruid@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/6285237390994"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.9rem] transition-colors duration-300"
                  style={{ color: "var(--text-secondary)" }}
                >
                  WhatsApp
                </a>
              </li>
              <li
                className="text-[0.9rem] leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                Jl. Toddopuli 18 No.17,
                <br />
                Makassar
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-7">
          <p className="text-[0.78rem]" style={{ color: "var(--text-muted)" }}>
            &copy; 2025 Rebru. All Rights Reserved.
          </p>

          {/* Dashboard lock icon — subtle */}
          <div className="relative group">
            <button
              onClick={openModal}
              aria-label="Dashboard Access"
              className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
              style={{
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                background: "transparent",
              }}
            >
              <i className="fas fa-lock text-[0.75rem]" />
            </button>

            {/* Tooltip */}
            <div
              className="absolute bottom-[calc(100%+10px)] right-0 rounded-sm px-3 py-1.5 text-[0.7rem] whitespace-nowrap tracking-[0.08em] opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              Dashboard Access
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
