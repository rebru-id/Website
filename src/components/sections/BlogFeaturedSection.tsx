"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getFeaturedPost } from "@/lib/blog-data";

function useInView(threshold = 0.1) {
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

export default function BlogFeaturedSection() {
  const { ref, inView } = useInView(0.1);
  const post = getFeaturedPost();
  if (!post) return null;

  return (
    <section
      id="articles"
      className="relative py-24 px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="absolute top-0 left-12 right-12 h-px" style={{ background: "var(--impact-top-line)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 30% 50%, rgba(74,44,26,0.1) 0%, transparent 65%)" }} />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">

        {/* Label */}
        <div className={`flex items-center gap-3 mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="section-label">Featured Story</span>
          <div className="h-px flex-1 max-w-[60px]" style={{ background: "var(--border-default)" }} />
          <span
            className="font-mono text-[0.6rem] tracking-[0.12em] uppercase px-3 py-1 rounded-pill"
            style={{ background: "rgba(196,149,106,0.1)", color: "var(--coffee-latte)", border: "1px solid rgba(196,149,106,0.2)" }}
          >
            Editor's Pick
          </span>
        </div>

        {/* Featured card */}
        <Link href={`/blog/${post.slug}`}>
          <div
            className={`group grid grid-cols-1 lg:grid-cols-2 rounded-lg overflow-hidden transition-all duration-700 cursor-pointer ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
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
              {/* Placeholder */}
              <div className="flex flex-col items-center gap-4 opacity-20 pointer-events-none select-none">
                <i className="fas fa-newspaper text-[3.5rem]" style={{ color: "var(--coffee-latte)" }} />
                <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                  Featured Image
                </span>
              </div>

              {/* Category badge */}
              <div className="absolute top-5 left-5">
                <span
                  className="font-mono text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1.5 rounded-pill"
                  style={{ background: "rgba(122,171,126,0.25)", color: "var(--forest-sage)", border: "1px solid rgba(122,171,126,0.3)" }}
                >
                  {post.categoryLabel}
                </span>
              </div>
            </div>

            {/* Content side */}
            <div
              className="flex flex-col justify-center p-10 lg:p-14"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="font-mono text-[0.62rem] tracking-[0.12em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {post.date}
                </span>
                <span className="w-1 h-1 rounded-full" style={{ background: "var(--text-muted)" }} />
                <span className="font-mono text-[0.62rem] tracking-[0.12em] uppercase" style={{ color: "var(--text-muted)" }}>
                  {post.readTime} read
                </span>
              </div>

              <h2
                className="font-display font-semibold leading-[1.15] mb-6 group-hover:text-coffee-latte transition-colors duration-300"
                style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", color: "var(--text-primary)" }}
              >
                {post.title}
              </h2>

              <p
                className="text-[0.92rem] leading-[1.85] mb-8"
                style={{ color: "var(--text-secondary)" }}
              >
                {post.excerpt}
              </p>

              <div className="flex items-center gap-2.5 font-mono text-[0.72rem] tracking-[0.1em] uppercase transition-all duration-300 group-hover:gap-4"
                style={{ color: "var(--coffee-latte)" }}>
                Read Full Story
                <i className="fas fa-arrow-right text-[0.65rem]" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
