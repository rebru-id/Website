// src/components/sections/BlogGridSection.tsx
// Sprint 1 changes:
//   - Category filter buttons now show article count badges
//   - ArticleCard shows author initials + name
//   - Sort dropdown: Terbaru / Terpendek / Terpanjang
//   - Load-more button (shows 6 initially, +3 each click)
//   - Excluded featured post from "all" count in badges
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useMemo } from "react";
import { useInView } from "@/hooks/useInView";
import Link from "next/link";
import {
  CATEGORIES,
  getAllPosts,
  getPostsByCategory,
  getAuthor,
  getCategoryCounts,
  type BlogCategory,
  type BlogPost,
} from "@/lib/blog-data";

const INITIAL_COUNT = 6;
const LOAD_MORE_STEP = 3;

// ─── Category accent colors ───────────────────────────────────────────────────
const CATEGORY_COLORS: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  "coffee-waste": {
    color: "var(--coffee-latte)",
    bg: "rgba(196,149,106,0.1)",
    border: "rgba(196,149,106,0.2)",
  },
  "climate-impact": {
    color: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.1)",
    border: "rgba(122,171,126,0.2)",
  },
  "behind-the-process": {
    color: "var(--gold)",
    bg: "rgba(200,168,75,0.1)",
    border: "rgba(200,168,75,0.2)",
  },
  "esg-partnership": {
    color: "var(--forest-mist)",
    bg: "rgba(200,223,201,0.08)",
    border: "rgba(200,223,201,0.18)",
  },
  "product-insights": {
    color: "var(--amber)",
    bg: "rgba(212,120,58,0.08)",
    border: "rgba(212,120,58,0.18)",
  },
};

type SortKey = "newest" | "shortest" | "longest";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Terbaru" },
  { id: "shortest", label: "Terpendek" },
  { id: "longest", label: "Terpanjang" },
];

function parseReadTime(t: string): number {
  return parseInt(t.replace(/\D/g, ""), 10) || 0;
}

// ─── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({
  post,
  index,
  inView,
}: {
  post: BlogPost;
  index: number;
  inView: boolean;
}) {
  const c = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS["climate-impact"];
  const isComingSoon = !post.published;
  const author = getAuthor(post);

  const CardContent = (
    <div
      className={`group flex flex-col rounded-lg overflow-hidden h-full transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${isComingSoon ? "cursor-default" : "cursor-pointer"}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        transitionDelay: `${120 + index * 80}ms`,
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: "var(--about-img-bg)" }}
      >
        {/* Sprint 3+: replace with <Image src={post.image} fill alt={post.title} /> */}
        <i
          className="fas fa-newspaper text-[2rem] opacity-20"
          style={{ color: c.color }}
        />

        {/* Category pill */}
        <div className="absolute top-4 left-4">
          <span
            className="font-mono text-[0.58rem] tracking-[0.12em] uppercase px-2.5 py-1 rounded-pill"
            style={{
              background: c.bg,
              color: c.color,
              border: `1px solid ${c.border}`,
            }}
          >
            {post.categoryLabel}
          </span>
        </div>

        {/* Coming soon overlay */}
        {isComingSoon && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "rgba(26,15,10,0.55)",
              backdropFilter: "blur(2px)",
            }}
          >
            <span
              className="font-mono text-[0.65rem] tracking-[0.18em] uppercase px-4 py-2 rounded-pill"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-muted)",
              }}
            >
              Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span
            className="font-mono text-[0.6rem] tracking-[0.1em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            {post.date}
          </span>
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: "var(--border-strong)" }}
          />
          <span
            className="font-mono text-[0.6rem] tracking-[0.1em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            {post.readTime} read
          </span>
        </div>

        <h3
          className={`font-display font-semibold text-[1.15rem] leading-[1.3] mb-3 transition-colors duration-300 ${
            !isComingSoon ? "group-hover:text-coffee-latte" : ""
          }`}
          style={{
            color: isComingSoon ? "var(--text-muted)" : "var(--text-primary)",
          }}
        >
          {post.title}
        </h3>

        <p
          className="text-[0.86rem] leading-[1.8] flex-1 mb-5"
          style={{
            color: isComingSoon ? "var(--text-muted)" : "var(--text-secondary)",
          }}
        >
          {post.excerpt}
        </p>

        {/* Author + CTA row */}
        <div
          className="flex items-center justify-between mt-auto pt-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {/* Author */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-mono font-bold text-[0.55rem] tracking-wide"
              style={{
                background: "rgba(196,149,106,0.12)",
                border: "1px solid rgba(196,149,106,0.2)",
                color: "var(--coffee-latte)",
              }}
            >
              {author.initials}
            </div>
            <span
              className="font-mono text-[0.58rem] tracking-[0.08em] uppercase"
              style={{
                color: isComingSoon ? "var(--text-muted)" : "var(--text-muted)",
              }}
            >
              {author.name}
            </span>
          </div>

          {!isComingSoon && (
            <div
              className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.1em] uppercase transition-all duration-300 group-hover:gap-3"
              style={{ color: c.color }}
            >
              Baca <i className="fas fa-arrow-right text-[0.55rem]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isComingSoon) return <div className="h-full">{CardContent}</div>;
  return (
    <Link href={`/blog/${post.slug}`} className="h-full">
      {CardContent}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function BlogGridSection() {
  const { ref, inView } = useInView(0.06);
  const [activeCategory, setActiveCategory] = useState<BlogCategory>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const allPosts = getAllPosts();
  const counts = useMemo(() => getCategoryCounts(), []);

  // Filter — exclude featured from grid
  const filtered = useMemo(() => {
    const base = getPostsByCategory(activeCategory).filter((p) => !p.featured);

    const sorted = [...base].sort((a, b) => {
      if (sort === "shortest")
        return parseReadTime(a.readTime) - parseReadTime(b.readTime);
      if (sort === "longest")
        return parseReadTime(b.readTime) - parseReadTime(a.readTime);
      // "newest" — sort by date string descending (works for "Month YYYY" format)
      return b.date.localeCompare(a.date);
    });

    return sorted;
  }, [activeCategory, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset visible count when category/sort changes
  const handleCategoryChange = (cat: BlogCategory) => {
    setActiveCategory(cat);
    setVisibleCount(INITIAL_COUNT);
  };
  const handleSortChange = (s: SortKey) => {
    setSort(s);
    setVisibleCount(INITIAL_COUNT);
  };

  return (
    <section
      className="relative py-[var(--section-py)] px-6 md:px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="absolute top-0 left-6 right-6 md:left-12 md:right-12 h-px"
        style={{ background: "var(--impact-bottom-line)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 70% 30%, rgba(45,90,46,0.06) 0%, transparent 70%)",
        }}
      />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        {/* Header */}
        <div
          className={`mb-12 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="section-label mb-4">All Articles</p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="section-title">Stories Worth Reading</h2>
            <p
              className="font-mono text-[0.68rem] tracking-[0.15em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {allPosts.filter((p) => p.published).length} published ·{" "}
              {allPosts.filter((p) => !p.published).length} coming soon
            </p>
          </div>
        </div>

        {/* Filter + Sort row */}
        <div
          className={`flex flex-wrap items-center justify-between gap-4 mb-10 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const count = counts[cat.id] ?? 0;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className="flex items-center gap-1.5 font-mono text-[0.68rem] tracking-[0.12em] uppercase px-3.5 py-1.5 rounded-pill transition-all duration-250"
                  style={{
                    border: isActive
                      ? "1px solid var(--coffee-latte)"
                      : "1px solid var(--border-default)",
                    background: isActive
                      ? "rgba(196,149,106,0.12)"
                      : "transparent",
                    color: isActive
                      ? "var(--coffee-latte)"
                      : "var(--text-muted)",
                  }}
                >
                  {cat.label}
                  {/* Count badge — only show for non-"all" categories with articles */}
                  {cat.id !== "all" && count > 0 && (
                    <span
                      className="text-[0.56rem] px-1.5 py-0.5 rounded-full leading-none"
                      style={{
                        background: isActive
                          ? "rgba(196,149,106,0.25)"
                          : "var(--border-default)",
                        color: isActive
                          ? "var(--coffee-latte)"
                          : "var(--text-muted)",
                        minWidth: "16px",
                        textAlign: "center",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[0.6rem] tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Sort:
            </span>
            <div className="flex gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSortChange(opt.id)}
                  className="font-mono text-[0.62rem] tracking-[0.08em] px-3 py-1.5 rounded-pill transition-all duration-200"
                  style={{
                    border:
                      sort === opt.id
                        ? "1px solid var(--border-strong)"
                        : "1px solid var(--border-subtle)",
                    background:
                      sort === opt.id ? "var(--bg-card)" : "transparent",
                    color:
                      sort === opt.id
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((post, i) => (
            <ArticleCard
              key={post.slug}
              post={post}
              index={i}
              inView={inView}
            />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <i
              className="fas fa-newspaper text-[2.5rem] mb-4 opacity-20"
              style={{ color: "var(--text-muted)" }}
            />
            <p
              className="font-mono text-[0.72rem] tracking-[0.15em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              No articles in this category yet
            </p>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setVisibleCount((v) => v + LOAD_MORE_STEP)}
              className="flex items-center gap-2.5 font-mono text-[0.72rem] tracking-[0.15em] uppercase px-8 py-3 rounded-pill transition-all duration-300 hover:gap-4"
              style={{
                border: "1px solid var(--border-default)",
                color: "var(--text-muted)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--coffee-latte)";
                e.currentTarget.style.color = "var(--coffee-latte)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              Load more
              <i className="fas fa-chevron-down text-[0.6rem]" />
              <span
                className="font-mono text-[0.58rem]"
                style={{ color: "var(--text-muted)", opacity: 0.7 }}
              >
                ({filtered.length - visibleCount} remaining)
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
