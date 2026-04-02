"use client";

import { type ReactNode } from "react";
import { AuthModalProvider } from "@/components/dashboard/AuthModalContext";
import { ToastProvider }     from "@/components/ui/Toast";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthModalProvider>
        {children}
      </AuthModalProvider>
    </ToastProvider>
  );
}
