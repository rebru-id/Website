import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar            from "@/components/layout/Navbar";
import Footer            from "@/components/layout/Footer";
import AuthModal         from "@/components/dashboard/AuthModal";
import DashboardOverlay  from "@/components/dashboard/DashboardOverlay";
import CtaBannerSection  from "@/components/sections/CtaBannerSection";
import { getPostBySlug, getRelatedPosts, getAllPosts, type ContentBlock } from "@/lib/blog-data";

// ─────────────────────────────────────────────────────────────────────────────
// Static params — pre-render all published slugs
// ─────────────────────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return getAllPosts()
    .filter((p) => p.published)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Article Not Found — Rebru" };
  return {
    title: `${post.title} — Rebru Blog`,
    description: post.excerpt,
  };
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
          style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", color: "var(--text-primary)" }}
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
            <i className="fas fa-leaf text-[1rem]" style={{ color: "var(--forest-sage)" }} />
            <p className="font-mono text-[0.7rem] tracking-[0.2em] uppercase" style={{ color: "var(--forest-sage)" }}>
              Impact Generated
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {block.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[0.9rem]" style={{ color: "var(--text-secondary)" }}>
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
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(196,149,106,0.1)", border: "1px solid rgba(196,149,106,0.2)" }}
                >
                  <i className={`fas ${step.icon} text-[0.78rem]`} style={{ color: "var(--coffee-latte)" }} />
                </div>
                <span
                  className="font-mono text-[0.62rem] tracking-[0.15em] uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  Step {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="font-display font-semibold text-[1.05rem] mb-2" style={{ color: "var(--text-primary)" }}>
                {step.label}
              </p>
              <p className="text-[0.85rem] leading-[1.75]" style={{ color: "var(--text-secondary)" }}>
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
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
            >
              <i className={`fas ${item.icon} text-[1.1rem]`} style={{ color: "var(--forest-sage)" }} />
              <p className="font-display font-semibold text-[1rem]" style={{ color: "var(--text-primary)" }}>
                {item.name}
              </p>
              <p className="text-[0.8rem] leading-[1.7]" style={{ color: "var(--text-secondary)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      );

    case "divider":
      return (
        <div className="my-10 h-px" style={{ background: "var(--border-subtle)" }} />
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Related Post Card
// ─────────────────────────────────────────────────────────────────────────────
function RelatedCard({ post }: { post: ReturnType<typeof getRelatedPosts>[number] }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <div
        className="group flex flex-col rounded-lg overflow-hidden h-full transition-all duration-300 hover:-translate-y-1"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
      >
        <div className="w-full aspect-[16/9] flex items-center justify-center"
          style={{ background: "var(--about-img-bg)" }}>
          <i className="fas fa-newspaper text-[1.5rem] opacity-20" style={{ color: "var(--coffee-latte)" }} />
        </div>
        <div className="p-5">
          <p className="font-mono text-[0.6rem] tracking-[0.12em] uppercase mb-2" style={{ color: "var(--forest-sage)" }}>
            {post.categoryLabel}
          </p>
          <h4
            className="font-display font-semibold text-[1rem] leading-[1.3] mb-2 group-hover:text-coffee-latte transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {post.title}
          </h4>
          <p className="font-mono text-[0.6rem] tracking-[0.1em] uppercase" style={{ color: "var(--text-muted)" }}>
            {post.readTime} read
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post || !post.published) notFound();

  const related = getRelatedPosts(params.slug, 3);

  return (
    <>
      <AuthModal />
      <DashboardOverlay />
      <Navbar />
      <main>
        {/* ── Article header ── */}
        <article>
          <header
            className="relative pt-36 pb-16 px-12 overflow-hidden"
            style={{ background: "var(--hero-gradient)" }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, var(--coffee-latte) 0px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, var(--coffee-latte) 0px, transparent 1px, transparent 80px)",
              }} />

            <div className="relative z-10 max-w-[760px] mx-auto">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 mb-8">
                <Link href="/blog"
                  className="font-mono text-[0.65rem] tracking-[0.15em] uppercase transition-colors duration-200"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--coffee-latte)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  Blog
                </Link>
                <i className="fas fa-chevron-right text-[0.5rem]" style={{ color: "var(--border-strong)" }} />
                <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase" style={{ color: "var(--forest-sage)" }}>
                  {post.categoryLabel}
                </span>
              </div>

              {/* Category + meta */}
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="font-mono text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1.5 rounded-pill"
                  style={{ background: "rgba(122,171,126,0.15)", color: "var(--forest-sage)", border: "1px solid rgba(122,171,126,0.25)" }}
                >
                  {post.categoryLabel}
                </span>
                <span className="font-mono text-[0.62rem] tracking-[0.1em] uppercase" style={{ color: "var(--text-muted)" }}>
                  {post.date}
                </span>
                <span className="w-1 h-1 rounded-full" style={{ background: "var(--border-strong)" }} />
                <span className="font-mono text-[0.62rem] tracking-[0.1em] uppercase" style={{ color: "var(--text-muted)" }}>
                  {post.readTime} read
                </span>
              </div>

              {/* Title */}
              <h1
                className="font-display font-semibold leading-[1.1] mb-6"
                style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", color: "var(--text-primary)" }}
              >
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-[1rem] leading-[1.9]" style={{ color: "var(--text-secondary)" }}>
                {post.excerpt}
              </p>

              {/* Author strip */}
              <div className="flex items-center gap-3 mt-8 pt-8" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(196,149,106,0.15)", border: "1px solid rgba(196,149,106,0.25)" }}
                >
                  <i className="fas fa-leaf text-[0.75rem]" style={{ color: "var(--coffee-latte)" }} />
                </div>
                <div>
                  <p className="text-[0.85rem] font-medium" style={{ color: "var(--text-primary)" }}>Rebru</p>
                  <p className="font-mono text-[0.6rem] tracking-[0.1em] uppercase" style={{ color: "var(--text-muted)" }}>
                    Makassar · South Sulawesi
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* ── Hero image ── */}
          <div className="w-full px-12 -mt-1" style={{ background: "var(--bg-primary)" }}>
            <div className="max-w-[760px] mx-auto">
              <div
                className="w-full aspect-[16/7] rounded-lg flex items-center justify-center"
                style={{ background: "var(--about-img-bg)", border: "1px solid var(--border-default)" }}
              >
                <div className="flex flex-col items-center gap-3 opacity-20">
                  <i className="fas fa-image text-[2.5rem]" style={{ color: "var(--coffee-latte)" }} />
                  <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                    Article Hero Image
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Article body ── */}
          <div
            className="px-12 py-16"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="max-w-[760px] mx-auto">

              {/* Render content blocks */}
              {post.content && post.content.length > 0 ? (
                post.content.map((block, i) => (
                  <RenderBlock key={i} block={block} />
                ))
              ) : (
                <div className="flex flex-col items-center py-20 text-center">
                  <i className="fas fa-pencil-alt text-[2rem] mb-4 opacity-20" style={{ color: "var(--text-muted)" }} />
                  <p className="font-mono text-[0.72rem] tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                    Full content coming soon
                  </p>
                </div>
              )}

              {/* Inline CTA */}
              <div
                className="mt-16 rounded-lg p-8 text-center"
                style={{ background: "rgba(45,90,46,0.1)", border: "1px solid rgba(122,171,126,0.2)" }}
              >
                <p className="font-mono text-[0.7rem] tracking-[0.2em] uppercase mb-3" style={{ color: "var(--forest-sage)" }}>
                  Want to turn your coffee waste into impact?
                </p>
                <h3 className="font-display font-semibold text-[1.4rem] mb-6" style={{ color: "var(--text-primary)" }}>
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
        </article>

        {/* ── Related posts ── */}
        {related.length > 0 && (
          <section className="px-12 py-16" style={{ background: "var(--bg-primary)" }}>
            <div
              className="max-w-[1280px] mx-auto pt-12"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <p className="section-label mb-4">Continue Reading</p>
              <h2 className="section-title mb-10">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((p) => <RelatedCard key={p.slug} post={p} />)}
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
