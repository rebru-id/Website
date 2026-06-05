// src/components/layout/Navbar.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { useLogo } from "@/hooks/useLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { NAV_LINKS, CONTACT_HREF, CONTACT_LABEL } from "@/constants/navigation";
// useLogo() sekarang selalu return string — tidak ada null check diperlukan

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const logoSrc = useLogo();
  // FIX: useLogo() tidak pernah return null lagi.
  // Null guard lama: if (!logoSrc) return <header ... h-[72px]" />
  // menyebabkan navbar tampil sebagai placeholder kosong/transparan
  // selama ~100–400ms di setiap page load (ketika next-themes resolve theme).
  const tickingRef = useRef(false);

  // Scroll listener — throttled via requestAnimationFrame (performance fix)
  useEffect(() => {
    // FIX: cek posisi scroll saat pertama mount.
    // Tanpa ini: jika user refresh saat halaman sudah di-scroll,
    // navbar tampil transparan (tanpa background) sampai scroll event pertama.
    setScrolled(window.scrollY > 50);

    const onScroll = () => {
      if (!tickingRef.current) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ── Header ── */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
          scrolled && "backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]",
        )}
        style={
          scrolled ? { backgroundColor: "var(--nav-scrolled-bg)" } : undefined
        }
      >
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-400",
            scrolled ? "px-12 py-3.5" : "px-12 py-6",
          )}
        >
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={logoSrc}
              alt="Rebru"
              width={36}
              height={36}
              className="transition-opacity duration-300"
              priority
            />
            <span className="font-display text-[1.6rem] font-bold tracking-[0.05em] text-text-primary transition-colors duration-300">
              rebru
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[0.85rem] font-medium tracking-[0.12em] uppercase transition-colors duration-300 relative",
                  "after:absolute after:bottom-[-4px] after:left-0 after:h-px after:transition-all after:duration-300",
                  "after:bg-[var(--nav-link-underline)]",
                  pathname === href
                    ? "after:w-full"
                    : "after:w-0 hover:after:w-full",
                )}
                style={{
                  color:
                    pathname === href
                      ? "var(--nav-link-active)"
                      : "var(--nav-link-default)",
                }}
              >
                {label}
              </Link>
            ))}

            <Link
              href={CONTACT_HREF}
              className="px-6 py-2.5 rounded-pill text-[0.82rem] tracking-[0.1em] uppercase transition-all duration-300 border"
              style={{
                borderColor: "var(--nav-contact-border)",
                color:
                  pathname === CONTACT_HREF
                    ? "var(--nav-contact-active-text)"
                    : "var(--nav-contact-text)",
                backgroundColor:
                  pathname === CONTACT_HREF
                    ? "var(--nav-contact-active-bg)"
                    : "transparent",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.backgroundColor = "var(--nav-contact-hover-bg)";
                el.style.color = "var(--nav-contact-hover-text)";
                el.style.borderColor = "var(--nav-contact-hover-border)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.backgroundColor =
                  pathname === CONTACT_HREF
                    ? "var(--nav-contact-active-bg)"
                    : "transparent";
                el.style.color =
                  pathname === CONTACT_HREF
                    ? "var(--nav-contact-active-text)"
                    : "var(--nav-contact-text)";
                el.style.borderColor = "var(--nav-contact-border)";
              }}
            >
              {" "}
              {CONTACT_LABEL}
            </Link>

            {/* Theme toggle — mini, ujung kanan nav */}
            <ThemeToggle />
          </nav>

          {/* Mobile: toggle + hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              className="text-text-primary text-xl p-2 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <i className={cn("fas", mobileOpen ? "fa-times" : "fa-bars")} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer */}
        <nav
          className={cn(
            "absolute top-0 right-0 h-full w-72 bg-bg-surface border-l border-border-subtle",
            "flex flex-col gap-6 pt-24 pb-12 px-9 transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-base font-medium tracking-[0.1em] uppercase transition-colors"
              style={{
                color:
                  pathname === href
                    ? "var(--nav-mobile-link-active)"
                    : "var(--nav-mobile-link-default)",
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href={CONTACT_HREF}
            className="mt-3 px-6 py-3 rounded-pill border text-[0.85rem] tracking-[0.1em] uppercase text-center"
            style={{
              borderColor: "var(--nav-contact-border)",
              color:
                pathname === CONTACT_HREF
                  ? "var(--nav-contact-active-text)"
                  : "var(--nav-contact-text)",
              backgroundColor:
                pathname === CONTACT_HREF
                  ? "var(--nav-contact-active-bg)"
                  : "transparent",
            }}
          >
            {CONTACT_LABEL}
          </Link>
        </nav>
      </div>
    </>
  );
}
