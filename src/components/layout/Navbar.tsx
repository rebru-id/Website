"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/",        label: "Home"    },
  { href: "/about",   label: "About"   },
  { href: "/products",label: "Product" },
  { href: "/blog",    label: "Blog"    },
] as const;

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
          scrolled
            ? "bg-coffee-deep/92 backdrop-blur-xl border-b border-coffee-latte/15"
            : ""
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-400",
            scrolled ? "px-12 py-3.5" : "px-12 py-6"
          )}
        >
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/assets/img/Glogo.png"
              alt="Rebru"
              width={36}
              height={36}
              className="brightness-110"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="font-display text-[1.6rem] font-bold tracking-[0.05em] text-coffee-cream">
              rebru
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[0.85rem] font-medium tracking-[0.12em] uppercase transition-colors duration-300 relative",
                  "after:absolute after:bottom-[-4px] after:left-0 after:h-px after:bg-coffee-latte after:transition-all after:duration-300",
                  pathname === href
                    ? "text-coffee-latte after:w-full"
                    : "text-ink-dim hover:text-coffee-cream after:w-0 hover:after:w-full"
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/contact"
              className={cn(
                "px-6 py-2.5 rounded-pill border text-[0.82rem] tracking-[0.1em] uppercase transition-all duration-300",
                pathname === "/contact"
                  ? "border-forest-sage text-forest-mist bg-forest-dark"
                  : "border-forest-leaf text-forest-sage hover:bg-forest-dark hover:text-forest-mist hover:border-forest-sage"
              )}
            >
              Get in Touch
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-ink text-xl p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <i className={cn("fas", mobileOpen ? "fa-times" : "fa-bars")} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer */}
        <nav
          className={cn(
            "absolute top-0 right-0 h-full w-72 bg-coffee-dark border-l border-coffee-latte/10",
            "flex flex-col gap-6 pt-24 pb-12 px-9 transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-base font-medium tracking-[0.1em] uppercase transition-colors",
                pathname === href ? "text-coffee-latte" : "text-ink-dim hover:text-coffee-cream"
              )}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-3 px-6 py-3 rounded-pill border border-forest-leaf text-forest-sage text-[0.85rem] tracking-[0.1em] uppercase text-center"
          >
            Get in Touch
          </Link>
        </nav>
      </div>
    </>
  );
}
