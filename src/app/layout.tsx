import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Space_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Rebru — Brewing Scalable Impact From Coffee Waste",
    template: "%s | Rebru",
  },
  description:
    "Rebru transforms spent coffee grounds into biochar, compost, and sustainable materials. Based in Makassar, South Sulawesi — leading circular economy solutions in Indonesia.",
  keywords: [
    "biochar",
    "coffee waste",
    "circular economy",
    "Makassar",
    "sustainability",
    "kompos",
  ],
  openGraph: {
    title: "Rebru — Brewing Scalable Impact From Coffee Waste",
    description:
      "Transforming spent coffee grounds into high-value climate products and regenerative materials.",
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
    // suppressHydrationWarning wajib ada agar next-themes tidak throw warning
    // saat server render "dark" tapi client belum tahu theme preference
    <html lang="id" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body
        className={`
          ${cormorant.variable}
          ${dmSans.variable}
          ${spaceMono.variable}
          font-body antialiased
        `}
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
