// src/constants/navigation.ts
// ─────────────────────────────────────────────────────────────────────────────
// Konstanta navigasi terpusat — dikonsumsi oleh Navbar (desktop + mobile drawer)
//
// Pemisahan Contact dari NAV_LINKS disengaja:
//   - NAV_LINKS  → link biasa dengan underline active indicator
//   - CONTACT_*  → tombol CTA dengan style pill/border terpisah
//
// Jika perlu menambah halaman baru, cukup tambahkan entry di NAV_LINKS.
// Navbar tidak perlu diubah sama sekali.
// ─────────────────────────────────────────────────────────────────────────────

export interface NavLink {
  href: string;
  label: string;
}

/**
 * Link navigasi utama — ditampilkan sebagai text link dengan underline indicator.
 * Urutan array = urutan tampil di navbar.
 * Contact sengaja TIDAK dimasukkan di sini — ia punya slot CTA tersendiri.
 */
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Blog" },
];

/**
 * Href dan label untuk tombol CTA Contact di navbar.
 * Dipisah sebagai konstanta agar perubahan URL cukup di satu tempat.
 */
export const CONTACT_HREF = "/contact";
export const CONTACT_LABEL = "Get in Touch";

/**
 * Link navigasi untuk Footer — mencakup semua halaman utama.
 * Dipisah dari NAV_LINKS karena Footer dapat menampilkan link tambahan
 * di masa depan (Privacy Policy, Terms) tanpa memengaruhi Navbar.
 */
export const FOOTER_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];
