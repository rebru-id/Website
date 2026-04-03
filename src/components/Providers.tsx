"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { AuthModalProvider } from "@/components/dashboard/AuthModalContext";
import { ToastProvider } from "@/components/ui/Toast";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    // attribute="data-theme" → next-themes set data-theme="dark"|"light" pada <html>
    // CSS di globals.css target [data-theme="light"] untuk light tokens
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
    >
      <ToastProvider>
        <AuthModalProvider>{children}</AuthModalProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
