"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES, getAllPosts, getPostsByCategory, type BlogCategory, type BlogPost } from "@/lib/blog-data";

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Category accent colors ───────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "coffee-waste":       { color: "var(--coffee-latte)",  bg: "rgba(196,149,106,0.1)",   border: "rgba(196,149,106,0.2)" },
  "climate-impact":     { color: "var(--forest-sage)",   bg: "rgba(122,171,126,0.1)",   border: "rgba(122,171,126,0.2)" },
  "behind-the-process": { color: "#c8a84b",               bg: "rgba(200,168,75,0.1)",    border: "rgba(200,168,75,0.2)" },
  "esg-partnership":    { color: "var(--forest-mist)",   bg: "rgba(200,223,201,0.08)",  border: "rgba(200,223,201,0.18)" },
  "product-insights":   { color: "#d4783a",               bg: "rgba(212,120,58,0.08)",   border: "rgba(212,120,58,0.18)" },
};

// ─── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ post, index, inView }: { post: BlogPost; index: number; inView: boolean }) {
  const c = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS["climate-impact"];
  const isComingSoon = !post.published;

  const CardContent = (
    <div
      className={`group flex flex-col rounded-lg overflow-hidden h-full transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${isComingSoon ? "cursor-default" : "cursor-pointer"}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        transitionDelay: `${120 + index * 100}ms`,
      }}
    >
      {/* Image */}
      <div
        className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: "var(--about-img-bg)" }}
      >
        <i className="fas fa-newspaper text-[2rem] opacity-20" style={{ color: c.color }} />

        {/* Category pill */}
        <div className="absolute top-4 left-4">
          <span
            className="font-mono text-[0.58rem] tracking-[0.12em] uppercase px-2.5 py-1 rounded-pill"
            style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
          >
            {post.categoryLabel}
          </span>
        </div>

        {/* Coming soon overlay */}
        {isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(26,15,10,0.55)", backdropFilter: "blur(2px)" }}>
            <span
              className="font-mono text-[0.65rem] tracking-[0.18em] uppercase px-4 py-2 rounded-pill"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}
            >
              Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase" style={{ color: "var(--text-muted)" }}>
            {post.date}
          </span>
          <span className="w-1 h-1 rounded-full" style={{ background: "var(--border-strong)" }} />
          <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase" style={{ color: "var(--text-muted)" }}>
            {post.readTime} read
          </span>
        </div>

        <h3
          className={`font-display font-semibold text-[1.15rem] leading-[1.3] mb-3 transition-colors duration-300 ${!isComingSoon ? "group-hover:text-coffee-latte" : ""}`}
          style={{ color: isComingSoon ? "var(--text-muted)" : "var(--text-primary)" }}
        >
          {post.title}
        </h3>

        <p
          className="text-[0.86rem] leading-[1.8] flex-1 mb-5"
          style={{ color: isComingSoon ? "var(--text-muted)" : "var(--text-secondary)" }}
        >
          {post.excerpt}
        </p>

        {!isComingSoon && (
          <div
            className="flex items-center gap-2 font-mono text-[0.68rem] tracking-[0.1em] uppercase mt-auto transition-all duration-300 group-hover:gap-3"
            style={{ color: c.color }}
          >
            Read Article <i className="fas fa-arrow-right text-[0.58rem]" />
          </div>
        )}
      </div>
    </div>
  );

  if (isComingSoon) return <div className="h-full">{CardContent}</div>;
  return <Link href={`/blog/${post.slug}`} className="h-full">{CardContent}</Link>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function BlogGridSection() {
  const { ref, inView } = useInView(0.06);
  const [activeCategory, setActiveCategory] = useState<BlogCategory>("all");

  const allPosts = getAllPosts();
  // Exclude featured from grid
  const gridPosts = getPostsByCategory(activeCategory).filter((p) => !p.featured);

  return (
    <section className="relative py-24 px-12 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <div className="absolute top-0 left-12 right-12 h-px" style={{ background: "var(--impact-bottom-line)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 70% 30%, rgba(45,90,46,0.06) 0%, transparent 70%)" }} />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">

        {/* Header */}
        <div className={`mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="section-label mb-4">All Articles</p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="section-title">Stories Worth Reading</h2>
            <p className="font-mono text-[0.68rem] tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
              {allPosts.filter(p => p.published).length} published · {allPosts.filter(p => !p.published).length} coming soon
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div
          className={`flex flex-wrap gap-2 mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "150ms" }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="font-mono text-[0.68rem] tracking-[0.12em] uppercase px-4 py-2 rounded-pill transition-all duration-250"
              style={{
                border: activeCategory === cat.id
                  ? "1px solid var(--coffee-latte)"
                  : "1px solid var(--border-default)",
                background: activeCategory === cat.id
                  ? "rgba(196,149,106,0.12)"
                  : "transparent",
                color: activeCategory === cat.id
                  ? "var(--coffee-latte)"
                  : "var(--text-muted)",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridPosts.map((post, i) => (
            <ArticleCard key={post.slug} post={post} index={i} inView={inView} />
          ))}
        </div>

        {gridPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <i className="fas fa-newspaper text-[2.5rem] mb-4 opacity-20" style={{ color: "var(--text-muted)" }} />
            <p className="font-mono text-[0.72rem] tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
              No articles in this category yet
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
