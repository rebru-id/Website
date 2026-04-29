// src/components/sections/BlogFeaturedSection.tsx
// Sprint 1 changes:
//   - Author strip resolved via getAuthor() — no longer hardcoded "Rebru"
//   - Image slot annotated for Sprint 3 next/image swap
//   - px-6 md:px-12 for mobile padding consistency
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useInView } from "@/hooks/useInView";
import Link from "next/link";
import { getFeaturedPost, getAuthor } from "@/lib/blog-data";

export default function BlogFeaturedSection() {
  const { ref, inView } = useInView(0.1);
  const post = getFeaturedPost();
  if (!post) return null;

  const author = getAuthor(post);

  return (
    <section
      id="articles"
      className="relative py-[var(--section-py)] px-6 md:px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="absolute top-0 left-6 right-6 md:left-12 md:right-12 h-px"
        style={{ background: "var(--impact-top-line)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 50%, rgba(74,44,26,0.1) 0%, transparent 65%)",
        }}
      />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        {/* Label */}
        <div
          className={`flex items-center gap-3 mb-12 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="section-label">Featured Story</span>
          <div
            className="h-px flex-1 max-w-[60px]"
            style={{ background: "var(--border-default)" }}
          />
          <span
            className="font-mono text-[0.6rem] tracking-[0.12em] uppercase px-3 py-1 rounded-pill"
            style={{
              background: "rgba(196,149,106,0.1)",
              color: "var(--coffee-latte)",
              border: "1px solid rgba(196,149,106,0.2)",
            }}
          >
            Editor's Pick
          </span>
        </div>

        {/* Featured card */}
        <Link href={`/blog/${post.slug}`}>
          <div
            className={`group grid grid-cols-1 lg:grid-cols-2 rounded-lg overflow-hidden transition-all duration-700 cursor-pointer ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{
              border: "1px solid var(--border-default)",
              transitionDelay: "180ms",
            }}
          >
            {/* Image side */}
            <div
              className="relative min-h-[320px] lg:min-h-[440px] flex items-center justify-center overflow-hidden"
              style={{ background: "var(--about-img-bg)" }}
            >
              {/*
                Sprint 3+: replace inner div with:
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              */}
              <div className="flex flex-col items-center gap-4 opacity-20 pointer-events-none select-none">
                <i
                  className="fas fa-newspaper text-[3.5rem]"
                  style={{ color: "var(--coffee-latte)" }}
                />
                <span
                  className="font-mono text-[0.65rem] tracking-[0.15em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  Featured Image
                </span>
              </div>

              {/* Category badge */}
              <div className="absolute top-5 left-5">
                <span
                  className="font-mono text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1.5 rounded-pill"
                  style={{
                    background: "rgba(122,171,126,0.25)",
                    color: "var(--forest-sage)",
                    border: "1px solid rgba(122,171,126,0.3)",
                  }}
                >
                  {post.categoryLabel}
                </span>
              </div>
            </div>

            {/* Content side */}
            <div
              className="flex flex-col justify-between p-10 lg:p-14"
              style={{ background: "var(--bg-card)" }}
            >
              <div>
                {/* Meta */}
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="font-mono text-[0.62rem] tracking-[0.12em] uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {post.date}
                  </span>
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: "var(--text-muted)" }}
                  />
                  <span
                    className="font-mono text-[0.62rem] tracking-[0.12em] uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {post.readTime} read
                  </span>
                </div>

                {/* Title */}
                <h2
                  className="font-display font-semibold leading-[1.15] mb-6 group-hover:text-coffee-latte transition-colors duration-300"
                  style={{
                    fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
                    color: "var(--text-primary)",
                  }}
                >
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p
                  className="text-[0.92rem] leading-[1.85] mb-8"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {post.excerpt}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-8">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[0.56rem] tracking-[0.1em] uppercase px-2 py-0.5 rounded-pill"
                        style={{
                          background: "rgba(196,149,106,0.08)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Author + CTA */}
              <div
                className="flex items-center justify-between pt-6"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                {/* Author */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-mono font-bold text-[0.62rem] tracking-wide"
                    style={{
                      background: "rgba(196,149,106,0.15)",
                      border: "1px solid rgba(196,149,106,0.3)",
                      color: "var(--coffee-latte)",
                    }}
                  >
                    {author.initials}
                  </div>
                  <div>
                    <p
                      className="text-[0.82rem] font-medium leading-none mb-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {author.name}
                    </p>
                    <p
                      className="font-mono text-[0.58rem] tracking-[0.08em] uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {author.role}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div
                  className="flex items-center gap-2.5 font-mono text-[0.72rem] tracking-[0.1em] uppercase transition-all duration-300 group-hover:gap-4"
                  style={{ color: "var(--coffee-latte)" }}
                >
                  Read Full Story
                  <i className="fas fa-arrow-right text-[0.65rem]" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
