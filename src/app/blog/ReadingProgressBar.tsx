// src/components/blog/ReadingProgressBar.tsx
"use client";

import { useEffect, useState, useRef } from "react";

/**
 * ReadingProgressBar
 * Sticky thin bar at top of viewport that tracks scroll progress
 * within the article body element (articleRef).
 *
 * Usage:
 *   const articleRef = useRef<HTMLElement>(null);
 *   <ReadingProgressBar articleRef={articleRef} />
 *   <article ref={articleRef}>...</article>
 */
export default function ReadingProgressBar({
  articleRef,
}: {
  articleRef: React.RefObject<HTMLElement>;
}) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const calculate = () => {
      const el = articleRef.current;
      if (!el) return;

      const { top, height } = el.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Start counting when article enters viewport, finish when it exits
      const scrolled = windowH - top;
      const total = height + windowH;
      const pct = Math.min(Math.max((scrolled / total) * 100, 0), 100);
      setProgress(pct);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(calculate);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    calculate(); // initial call

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [articleRef]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none"
      style={{ background: "transparent" }}
    >
      <div
        className="h-full transition-none"
        style={{
          width: `${progress}%`,
          background:
            "linear-gradient(90deg, var(--forest-sage), var(--coffee-latte))",
          // Subtle glow at the leading edge
          boxShadow: progress > 2 ? "2px 0 8px rgba(196,149,106,0.5)" : "none",
        }}
      />
    </div>
  );
}
