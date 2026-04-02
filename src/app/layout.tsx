import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rebru — Brewing Scalable Impact From Coffee Waste",
    template: "%s | Rebru",
  },
  description:
    "Rebru transforms spent coffee grounds into biochar, compost, and sustainable materials. Based in Makassar, South Sulawesi — leading circular economy solutions in Indonesia.",
  keywords: ["biochar", "coffee waste", "circular economy", "Makassar", "sustainability", "kompos"],
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
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="bg-coffee-deep text-ink font-body antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
