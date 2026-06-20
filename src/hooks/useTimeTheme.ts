// src/hooks/useTimeTheme.ts
"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const STORAGE_KEY = "rebru-theme-manual";

// Jam 06:00–17:59 waktu lokal user → light, selainnya → dark
function getThemeByTime(): "light" | "dark" {
  const hour = new Date().getHours(); // waktu lokal browser user
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

// Tandai bahwa user sudah override manual hari ini
// Simpan tanggal lokal user sebagai string — untuk reset harian
export function markManualOverride() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toLocaleDateString());
  } catch {}
}

export function useTimeTheme() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const today = new Date().toLocaleDateString(); // tanggal lokal user
    let manualDate: string | null = null;

    try {
      manualDate = localStorage.getItem(STORAGE_KEY);
    } catch {}

    // Flag ada dan masih hari ini → hormati pilihan manual user
    if (manualDate === today) return;

    // Flag tidak ada atau sudah expired (hari berbeda) → ikut waktu
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("theme");
    } catch {}

    setTheme(getThemeByTime());
  }, [setTheme]);
}
