// src/app/blog/[slug]/page.tsx
// Sprint 1 changes:
//   - ReadingProgressBar (client) — scroll-tracked progress indicator
//   - ShareButtons (client) — LinkedIn, X/Twitter, WhatsApp, copy link
//   - Author resolved from AUTHORS registry via getAuthor()
//   - Tags rendered below excerpt
//   - JSON-LD Article structured data (SEO)
//   - Related posts now filled via cross-category fallback
//   - Image slot ready for next/image (placeholder preserved)
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthModal from "@/components/dashboard/AuthModal";
import DashboardOverlay from "@/components/dashboard/DashboardOverlay";
import CtaBannerSection from "@/components/sections/CtaBannerSection";
import ReadingProgressBar from "@/app/blog/ReadingProgressBar";
import ShareButtons from "@/app/blog/ShareButtons";
import {
  getPostBySlug,
  getRelatedPosts,
  getAllPosts,
  getAuthor,
  type ContentBlock,
  type BlogPost,
} from "@/lib/blog-data";

// ─────────────────────────────────────────────────────────────────────────────
// Static params + metadata
// ─────────────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getAllPosts()
    .filter((p) => p.published)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Article Not Found — Rebru" };
  return {
    title: `${post.title} — Rebru Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD structured data (Article schema for Google rich results)
// ─────────────────────────────────────────────────────────────────────────────

function ArticleJsonLd({ post }: { post: BlogPost }) {
  const author = getAuthor(post);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: {
      "@type": "Organization",
      name: author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Rebru",
      url: "https://rebru.id",
    },
    datePublished: post.date,
    keywords: post.tags?.join(", "),
    inLanguage: "en",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content block renderer
// ─────────────────────────────────────────────────────────────────────────────

function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2
          className="font-display font-semibold leading-tight mt-14 mb-5"
          style={{
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            color: "var(--text-primary)",
          }}
        >
          {block.text}
        </h2>
      );

    case "paragraph":
      return (
        <p
          className="text-[1rem] leading-[1.95] mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          {block.text}
        </p>
      );

    case "quote":
      return (
        <blockquote
          className="relative my-10 px-8 py-7 rounded-lg"
          style={{
            background: "rgba(196,149,106,0.07)",
            borderLeft: "3px solid var(--coffee-latte)",
          }}
        >
          <i
            className="fas fa-quote-left text-[1.5rem] mb-3 block"
            style={{ color: "rgba(196,149,106,0.3)" }}
          />
          <p
            className="font-display italic text-[1.2rem] leading-[1.6]"
            style={{ color: "var(--text-primary)" }}
          >
            {block.text}
          </p>
        </blockquote>
      );

    case "impact-box":
      return (
        <div
          className="my-10 rounded-lg p-8"
          style={{
            background: "rgba(45,90,46,0.1)",
            border: "1px solid rgba(122,171,126,0.25)",
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <i
              className="fas fa-leaf text-[1rem]"
              style={{ color: "var(--forest-sage)" }}
            />
            <p
              className="font-mono text-[0.7rem] tracking-[0.2em] uppercase"
              style={{ color: "var(--forest-sage)" }}
            >
              Impact Generated
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {block.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[0.9rem]"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "var(--forest-sage)" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case "process-steps":
      return (
        <div className="my-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {block.steps.map((step, i) => (
            <div
              key={step.label}
              className="rounded-lg p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(196,149,106,0.1)",
                    border: "1px solid rgba(196,149,106,0.2)",
                  }}
                >
                  <i
                    className={`fas ${step.icon} text-[0.78rem]`}
                    style={{ color: "var(--coffee-latte)" }}
                  />
                </div>
                <span
                  className="font-mono text-[0.62rem] tracking-[0.15em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  Step {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p
                className="font-display font-semibold text-[1.05rem] mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {step.label}
              </p>
              <p
                className="text-[0.85rem] leading-[1.75]"
                style={{ color: "var(--text-secondary)" }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      );

    case "product-list":
      return (
        <div className="my-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {block.items.map((item) => (
            <div
              key={item.name}
              className="flex flex-col gap-3 p-5 rounded-lg"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <i
                className={`fas ${item.icon} text-[1.1rem]`}
                style={{ color: "var(--forest-sage)" }}
              />
              <p
                className="font-display font-semibold text-[1rem]"
                style={{ color: "var(--text-primary)" }}
              >
                {item.name}
              </p>
              <p
                className="text-[0.8rem] leading-[1.7]"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      );

    case "divider":
      return (
        <div
          className="my-10 h-px"
          style={{ background: "var(--border-subtle)" }}
        />
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Related Post Card
// ─────────────────────────────────────────────────────────────────────────────

function RelatedCard({
  post,
}: {
  post: ReturnType<typeof getRelatedPosts>[number];
}) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <div
        className="group flex flex-col rounded-lg overflow-hidden h-full transition-all duration-300 hover:-translate-y-1"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Thumbnail */}
        <div
          className="w-full aspect-[16/9] flex items-center justify-center overflow-hidden"
          style={{ background: "var(--about-img-bg)" }}
        >
          {/* Sprint 3+: replace with <Image src={post.image} fill alt={post.title} /> */}
          <i
            className="fas fa-newspaper text-[1.5rem] opacity-20"
            style={{ color: "var(--coffee-latte)" }}
          />
        </div>

        <div className="p-5 flex flex-col flex-1">
          <p
            className="font-mono text-[0.6rem] tracking-[0.12em] uppercase mb-2"
            style={{ color: "var(--forest-sage)" }}
          >
            {post.categoryLabel}
          </p>
          <h4
            className="font-display font-semibold text-[1rem] leading-[1.3] mb-3 group-hover:text-coffee-latte transition-colors flex-1"
            style={{ color: "var(--text-primary)" }}
          >
            {post.title}
          </h4>
          <div className="flex items-center justify-between mt-auto">
            <span
              className="font-mono text-[0.6rem] tracking-[0.1em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {post.readTime} read
            </span>
            <span
              className="font-mono text-[0.62rem] tracking-[0.08em] uppercase transition-all duration-300 group-hover:gap-2"
              style={{ color: "var(--coffee-latte)" }}
            >
              Read <i className="fas fa-arrow-right text-[0.55rem]" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Article wrapper — client component bridge for ReadingProgressBar
// We need a ref pointing at the article element; since the page is a Server
// Component, we isolate the ref + progress bar in a tiny Client Component.
// ─────────────────────────────────────────────────────────────────────────────

import ArticleWrapper from "@/app/blog/ArticleWrapper";

// ─────────────────────────────────────────────────────────────────────────────
// Page (Server Component)
// ─────────────────────────────────────────────────────────────────────────────

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post || !post.published) notFound();

  const related = getRelatedPosts(params.slug, 3);
  const author = getAuthor(post);

  return (
    <>
      <ArticleJsonLd post={post} />
      <AuthModal />
      <DashboardOverlay />
      <Navbar />

      <main>
        <ArticleWrapper>
          {/* ── Article header ─────────────────────────────────────────── */}
          <header
            className="relative pt-36 pb-16 px-6 md:px-12 overflow-hidden"
            style={{ background: "var(--hero-gradient)" }}
          >
            {/* Grid texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, var(--coffee-latte) 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, var(--coffee-latte) 0px, transparent 1px, transparent 80px)",
              }}
            />

            <div className="relative z-10 max-w-[760px] mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-8">
                <Link
                  href="/blog"
                  className="font-mono text-[0.65rem] tracking-[0.15em] uppercase transition-colors duration-200"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--coffee-latte)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  Blog
                </Link>
                <i
                  className="fas fa-chevron-right text-[0.5rem]"
                  style={{ color: "var(--border-strong)" }}
                />
                <span
                  className="font-mono text-[0.65rem] tracking-[0.15em] uppercase"
                  style={{ color: "var(--forest-sage)" }}
                >
                  {post.categoryLabel}
                </span>
              </div>

              {/* Category pill + meta */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span
                  className="font-mono text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1.5 rounded-pill"
                  style={{
                    background: "rgba(122,171,126,0.15)",
                    color: "var(--forest-sage)",
                    border: "1px solid rgba(122,171,126,0.25)",
                  }}
                >
                  {post.categoryLabel}
                </span>
                <span
                  className="font-mono text-[0.62rem] tracking-[0.1em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {post.date}
                </span>
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: "var(--border-strong)" }}
                />
                <span
                  className="font-mono text-[0.62rem] tracking-[0.1em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {post.readTime} read
                </span>
              </div>

              {/* Title */}
              <h1
                className="font-display font-semibold leading-[1.1] mb-6"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.2rem)",
                  color: "var(--text-primary)",
                }}
              >
                {post.title}
              </h1>

              {/* Excerpt */}
              <p
                className="text-[1rem] leading-[1.9] mb-6"
                style={{ color: "var(--text-secondary)" }}
              >
                {post.excerpt}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[0.58rem] tracking-[0.1em] uppercase px-2.5 py-1 rounded-pill"
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

              {/* Author strip */}
              <div
                className="flex items-center justify-between gap-4 flex-wrap pt-8"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-mono font-bold text-[0.72rem] tracking-wide"
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
                      className="text-[0.9rem] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {author.name}
                    </p>
                    <p
                      className="font-mono text-[0.6rem] tracking-[0.1em] uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {author.role}
                    </p>
                  </div>
                </div>

                {/* Share buttons in header */}
                <ShareButtons title={post.title} />
              </div>
            </div>
          </header>

          {/* ── Hero image ─────────────────────────────────────────────── */}
          <div
            className="w-full px-6 md:px-12 -mt-1"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="max-w-[760px] mx-auto">
              <div
                className="w-full aspect-[16/7] rounded-lg flex items-center justify-center overflow-hidden"
                style={{
                  background: "var(--about-img-bg)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {/* Sprint 3+: replace div below with:
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                */}
                <div className="flex flex-col items-center gap-3 opacity-20">
                  <i
                    className="fas fa-image text-[2.5rem]"
                    style={{ color: "var(--coffee-latte)" }}
                  />
                  <span
                    className="font-mono text-[0.65rem] tracking-[0.15em] uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Article Hero Image
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Article body ───────────────────────────────────────────── */}
          <div
            className="px-6 md:px-12 py-16"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="max-w-[760px] mx-auto">
              {/* Content blocks */}
              {post.content && post.content.length > 0 ? (
                post.content.map((block, i) => (
                  <RenderBlock key={i} block={block} />
                ))
              ) : (
                <div className="flex flex-col items-center py-20 text-center">
                  <i
                    className="fas fa-pencil-alt text-[2rem] mb-4 opacity-20"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <p
                    className="font-mono text-[0.72rem] tracking-[0.15em] uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Full content coming soon
                  </p>
                </div>
              )}

              {/* ── Share bar at end of article ── */}
              <div
                className="mt-14 pt-8 flex flex-col gap-4"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <p
                  className="font-mono text-[0.65rem] tracking-[0.2em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  Found this useful? Share it.
                </p>
                <ShareButtons title={post.title} />
              </div>

              {/* ── Inline CTA ── */}
              <div
                className="mt-16 rounded-lg p-8 text-center"
                style={{
                  background: "rgba(45,90,46,0.1)",
                  border: "1px solid rgba(122,171,126,0.2)",
                }}
              >
                <p
                  className="font-mono text-[0.7rem] tracking-[0.2em] uppercase mb-3"
                  style={{ color: "var(--forest-sage)" }}
                >
                  Want to turn your coffee waste into impact?
                </p>
                <h3
                  className="font-display font-semibold text-[1.4rem] mb-6"
                  style={{ color: "var(--text-primary)" }}
                >
                  Join the Circular Movement
                </h3>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/contact" className="btn-primary">
                    <i className="fas fa-handshake" /> Join as Partner
                  </Link>
                  <Link href="/contact" className="btn-ghost">
                    <i className="fas fa-envelope" /> Contact Rebru
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ArticleWrapper>

        {/* ── Related posts ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section
            className="px-6 md:px-12 py-16"
            style={{ background: "var(--bg-primary)" }}
          >
            <div
              className="max-w-[1280px] mx-auto pt-12"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <p className="section-label mb-4">Continue Reading</p>
              <h2 className="section-title mb-10">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((p) => (
                  <RelatedCard key={p.slug} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        <CtaBannerSection />
      </main>

      <Footer />
    </>
  );
}
