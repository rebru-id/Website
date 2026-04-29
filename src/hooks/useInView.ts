// src/hooks/useInView.ts
// ─────────────────────────────────────────────────────────────────────────────
// useInView — IntersectionObserver hook untuk animasi scroll-triggered
//
// Sebelumnya didefinisikan ulang di banyak file berbeda:
//   - ProductsHeroSection.tsx
//   - ProductsFeaturedSection.tsx
//   - ProductsCatalogSection.tsx
//   - AboutHeroSection.tsx
//   - AboutMissionSection.tsx
//   - AboutProcessSection.tsx
//   - AboutValuesSection.tsx
//   - BlogFeaturedSection.tsx
//   - BlogGridSection.tsx
//   - BlogHeroSection.tsx
//   - BlogImpactSection.tsx
//   - ContactHeroSection.tsx
//   - ContactPackagesSection.tsx
//   - ContactFormSection.tsx
//
// Sekarang cukup import dari sini:
//   import { useInView } from "@/hooks/useInView";
//
// Sprint 4: bisa diperluas dengan opsi `once: false` untuk animasi berulang
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /**
   * Persentase elemen yang harus terlihat sebelum trigger (0–1).
   * Default: 0.15
   */
  threshold?: number;
  /**
   * Jika true, observer tetap aktif setelah pertama kali trigger.
   * Default: false (trigger sekali lalu disconnect — lebih efisien untuk animasi)
   */
  once?: boolean;
}

export function useInView(
  thresholdOrOptions: number | UseInViewOptions = 0.15,
) {
  // Mendukung pemanggilan lama: useInView(0.1) — tidak breaking change
  const options: UseInViewOptions =
    typeof thresholdOrOptions === "number"
      ? { threshold: thresholdOrOptions }
      : thresholdOrOptions;

  const { threshold = 0.15, once = true } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, once]);

  return { ref, inView };
}
