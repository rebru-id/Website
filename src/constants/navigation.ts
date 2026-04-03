// ─────────────────────────────────────────────────────────────────────────────
// Navigation constants — digunakan di Navbar dan Footer
// ─────────────────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Product" },
  { href: "/blog", label: "Blog" },
] as const;

export const FOOTER_LINKS = [
  ...NAV_LINKS,
  { href: "/contact", label: "Contact" },
] as const;

export const CONTACT_HREF = "/contact";
export const CONTACT_LABEL = "Get in Touch";
