import Link from "next/link";

const POSTS = [
  {
    href: "/blog",
    tag: "Featured · Coffee Waste",
    title:
      "Sisa Hari Ini, Solusi Untuk Esok: Fakta Tersembunyi di Balik Secangkir Kopi",
    excerpt:
      "Setiap tahun, dunia menghasilkan lebih dari 18 juta ton ampas kopi. Dari rumah tangga hingga restoran besar — potensi yang selama ini terabaikan.",
    featured: true,
  },
  {
    href: "#",
    tag: "Tips · Sustainability",
    title: "5 Tips Mengelola Limbah Kopi di Rumah",
    excerpt: null,
    featured: false,
  },
  {
    href: "#",
    tag: "Education · Circular Economy",
    title: "Apa Itu Ekonomi Sirkular?",
    excerpt: null,
    featured: false,
  },
] as const;

export default function BlogTeaserSection() {
  const featured = POSTS[0];
  const secondaries = POSTS.slice(1);

  return (
    <section id="blog-teaser" className="max-w-[1280px] mx-auto px-12 py-24">
      <span className="section-label mb-3">Insights</span>
      <h2 className="section-title mb-12">From Our Blog</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-7">
        {/* Featured */}
        <Link
          href={featured.href}
          className="group rounded-lg overflow-hidden p-12 flex flex-col justify-end min-h-[380px] relative transition-transform duration-300 hover:-translate-y-1"
          style={{
            background: "var(--blog-card-bg)",
            border: "1px solid var(--blog-card-border)",
          }}
        >
          <span
            className="absolute top-6 left-9 font-display text-[6rem] leading-none pointer-events-none select-none"
            style={{ color: "var(--blog-card-quote)" }}
            aria-hidden
          >
            &ldquo;
          </span>
          <div className="relative z-10">
            <span
              className="font-mono text-[0.68rem] tracking-[0.18em] uppercase block mb-3.5"
              style={{ color: "var(--blog-card-tag)" }}
            >
              {featured.tag}
            </span>
            <h3
              className="font-display text-[1.6rem] font-semibold leading-[1.3] mb-4"
              style={{ color: "var(--blog-card-title)" }}
            >
              {featured.title}
            </h3>
            {featured.excerpt && (
              <p
                className="text-[0.88rem] leading-[1.7] mb-6"
                style={{ color: "var(--blog-card-text)" }}
              >
                {featured.excerpt}
              </p>
            )}
            <span
              className="inline-flex items-center gap-2 text-[0.8rem] tracking-[0.1em] uppercase group-hover:gap-3.5 transition-all duration-300"
              style={{ color: "var(--blog-card-cta)" }}
            >
              Baca Selengkapnya <i className="fas fa-arrow-right" />
            </span>
          </div>
        </Link>

        {/* Secondary */}
        <div className="flex flex-col gap-4">
          {secondaries.map((post) => (
            <Link
              key={post.title}
              href={post.href}
              className="flex-1 p-7 rounded-md transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "var(--blog-small-bg)",
                border: "1px solid var(--blog-small-border)",
              }}
            >
              <span
                className="font-mono text-[0.68rem] tracking-[0.18em] uppercase block mb-3"
                style={{ color: "var(--blog-card-tag)" }}
              >
                {post.tag}
              </span>
              <h3
                className="font-display text-[1.05rem] font-semibold leading-[1.3] mb-2"
                style={{ color: "var(--blog-card-title)" }}
              >
                {post.title}
              </h3>
              <p className="text-[0.82rem] text-text-muted">Coming soon</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
