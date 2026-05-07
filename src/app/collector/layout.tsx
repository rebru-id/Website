// src/app/collector/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Layout khusus halaman /collector
//
// MENGAPA FILE INI DIPERLUKAN:
// page.tsx menggunakan "use client" (karena butuh useAuthModal hook).
// Di Next.js App Router, Client Components tidak bisa export `metadata`.
// Solusi standar: buat layout.tsx sebagai Server Component yang export metadata,
// sementara page.tsx tetap sebagai Client Component yang handle interaksi.
//
// Hasilnya:
//   - Tab browser menampilkan: "Collector Log | Rebru" (dari template di root layout)
//   - page.tsx tetap "use client" tanpa konflik
//   - Tidak perlu mengubah root layout.tsx sama sekali
//
// Hierarki render:
//   RootLayout (src/app/layout.tsx)
//     └── CollectorLayout (src/app/collector/layout.tsx)  ← Server Component
//           └── CollectorPage (src/app/collector/page.tsx) ← Client Component
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";

// Menggunakan title template dari root layout: "%s | Rebru"
// Hasil: "Collector Log | Rebru"
export const metadata: Metadata = {
  title: "Collector Log",
  description:
    "Halaman operasional tim collector Rebru — pencatatan pengambilan ampas kopi harian.",
  // Collector page tidak perlu diindex oleh search engine
  robots: {
    index: false,
    follow: false,
  },
};

export default function CollectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout ini tidak menambahkan wrapper apapun —
  // CollectorNavbar dan Footer sudah dirender langsung di page.tsx
  // agar collector page bisa mengontrol penuh layoutnya sendiri.
  return <>{children}</>;
}
