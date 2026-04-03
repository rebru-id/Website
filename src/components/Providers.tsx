"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { AuthModalProvider } from "@/components/dashboard/AuthModalContext";
import { ToastProvider } from "@/components/ui/Toast";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    // attribute="class" → next-themes tambahkan class "dark" atau "light" ke <html>
    // defaultTheme="dark" → default dark sesuai desain awal
    // enableSystem={false} → tidak ikut system preference, user yang pilih
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ToastProvider>
        <AuthModalProvider>{children}</AuthModalProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
