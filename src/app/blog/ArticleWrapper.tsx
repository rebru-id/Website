// src/components/blog/ArticleWrapper.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Client component wrapper for the article body.
// Holds the ref that ReadingProgressBar needs to track scroll progress.
// Keeps BlogPostPage as a Server Component while enabling client-side scroll.
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useRef } from "react";
import ReadingProgressBar from "./ReadingProgressBar";

export default function ArticleWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const articleRef = useRef<HTMLElement>(null);

  return (
    <>
      <ReadingProgressBar articleRef={articleRef} />
      <article ref={articleRef}>{children}</article>
    </>
  );
}
