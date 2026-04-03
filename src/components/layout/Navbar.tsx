"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Product" },
  { href: "/blog", label: "Blog" },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isLight = mounted && resolvedTheme === "light";

  // Logo: dark mode → logo.png (putih), light mode → Glogo.png (hijau)
  const logoSrc = isLight ? "/assets/img/Glogo.png" : "/assets/img/logo.png";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-400",
          scrolled ? "backdrop-blur-xl border-b" : "",
        )}
        style={
          scrolled
            ? {
                backgroundColor: "var(--nav-scrolled-bg)",
                borderColor: "var(--border-default)",
              }
            : {}
        }
      >
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-400",
            scrolled ? "px-12 py-3.5" : "px-12 py-6",
          )}
        >
          {/* ── Brand ── */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src={logoSrc}
              alt="Rebru"
              width={36}
              height={36}
              className="transition-opacity duration-300"
              priority
            />
            <span
              className="font-display text-[1.6rem] font-bold tracking-[0.05em] transition-colors duration-300"
              style={{ color: "var(--text-primary)" }}
            >
              rebru
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-[0.85rem] font-medium tracking-[0.12em] uppercase transition-colors duration-300 relative",
                  "after:absolute after:bottom-[-4px] after:left-0 after:h-px after:transition-all after:duration-300",
                  pathname === href
                    ? "after:w-full"
                    : "after:w-0 hover:after:w-full",
                )}
                style={{
                  color:
                    pathname === href
                      ? "var(--coffee-latte)"
                      : "var(--text-secondary)",
                  // after pseudo via CSS variable tidak bisa langsung —
                  // pakai style trick via data attribute
                }}
              >
                {label}
              </Link>
            ))}

            <Link
              href="/contact"
              className={cn(
                "px-6 py-2.5 rounded-pill text-[0.82rem] tracking-[0.1em] uppercase transition-all duration-300",
                pathname === "/contact" ? "opacity-100" : "",
              )}
              style={{
                border: "1px solid var(--forest-leaf)",
                color: "var(--forest-sage)",
              }}
            >
              Get in Touch
            </Link>

            {/* ── Theme Toggle — mini circle, ujung kanan nav ── */}
            <ThemeToggle />
          </nav>

          {/* ── Mobile: hamburger + toggle ── */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              className="text-xl p-2 transition-colors"
              style={{ color: "var(--text-primary)" }}
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
            "absolute top-0 right-0 h-full w-72",
            "flex flex-col gap-6 pt-24 pb-12 px-9 transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
          style={{
            backgroundColor: "var(--bg-surface)",
            borderLeft: "1px solid var(--border-default)",
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-base font-medium tracking-[0.1em] uppercase transition-colors"
              style={{
                color:
                  pathname === href
                    ? "var(--coffee-latte)"
                    : "var(--text-secondary)",
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-3 px-6 py-3 rounded-pill text-[0.85rem] tracking-[0.1em] uppercase text-center transition-colors"
            style={{
              border: "1px solid var(--forest-leaf)",
              color: "var(--forest-sage)",
            }}
          >
            Get in Touch
          </Link>
        </nav>
      </div>
    </>
  );
}
