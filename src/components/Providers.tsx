"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { AuthModalProvider } from "@/components/dashboard/AuthModalContext";
import { ToastProvider } from "@/components/ui/Toast";
import { CartProvider } from "@/context/CartContext"; // ← tambah import

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <CartProvider>
        {" "}
        {/* ← wrap di sini */}
        <ToastProvider>
          <AuthModalProvider>{children}</AuthModalProvider>
        </ToastProvider>
      </CartProvider>{" "}
      {/* ← tutup di sini */}
    </ThemeProvider>
  );
}
