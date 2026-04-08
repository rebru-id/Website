import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Space_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";
import CartDrawer from "@/components/cart/CartDrawer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rebru — Brewing Scalable Impact From Coffee Waste",
    template: "%s | Rebru",
  },
  description:
    "Rebru transforms spent coffee grounds into biochar, compost, and sustainable materials. Based in Makassar, South Sulawesi.",
  keywords: [
    "biochar",
    "coffee waste",
    "circular economy",
    "Makassar",
    "sustainability",
  ],
  openGraph: {
    title: "Rebru — Brewing Scalable Impact From Coffee Waste",
    description:
      "Transforming spent coffee grounds into high-value climate products.",
    url: "https://rebru.id",
    siteName: "Rebru",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning wajib — next-themes inject data-theme setelah hydration
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      {/* Tidak ada inline style — bg & color diatur oleh body { } di globals.css */}
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${spaceMono.variable}`}
      >
        <Providers>
          {children} <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
