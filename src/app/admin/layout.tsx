// src/app/admin/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Layout khusus /admin — TIDAK menggunakan Navbar atau Footer publik.
// Halaman ini sepenuhnya standalone, terpisah dari website publik.
//
// Kenapa tidak ada Providers di sini?
//   Providers (ThemeProvider, AuthModalProvider, CartProvider) sudah
//   didefinisikan di src/app/layout.tsx (root layout) yang menjadi
//   parent dari semua route — termasuk /admin.
//   Tidak perlu didefinisikan ulang.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel | Rebru",
  // robots: noindex agar halaman admin tidak diindeks oleh search engine
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout minimal — hanya render children.
  // Sidebar, topbar, dan semua chrome UI admin
  // dirender oleh AdminDashboard di page.tsx — bukan di sini.
  // Ini agar AdminDashboard punya kontrol penuh atas layout-nya sendiri.
  return <>{children}</>;
}
