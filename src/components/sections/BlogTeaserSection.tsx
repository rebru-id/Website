import Link from "next/link";

interface BlogPost {
  href:     string;
  tag:      string;
  title:    string;
  excerpt?: string;
  featured: boolean;
}

const POSTS: BlogPost[] = [
  {
    href:     "/blog",
    tag:      "Featured · Coffee Waste",
    title:    "Sisa Hari Ini, Solusi Untuk Esok: Fakta Tersembunyi di Balik Secangkir Kopi",
    excerpt:  "Setiap tahun, dunia menghasilkan lebih dari 18 juta ton ampas kopi. Dari rumah tangga hingga restoran besar — potensi yang selama ini terabaikan.",
    featured: true,
  },
  {
    href:     "#",
    tag:      "Tips · Sustainability",
    title:    "5 Tips Mengelola Limbah Kopi di Rumah",
    featured: false,
  },
  {
    href:     "#",
    tag:      "Education · Circular Economy",
    title:    "Apa Itu Ekonomi Sirkular?",
    featured: false,
  },
];

export default function BlogTeaserSection() {
  const featured    = POSTS.find((p) => p.featured)!;
  const secondaries = POSTS.filter((p) => !p.featured);

  return (
    <section id="blog-teaser" className="max-w-[1280px] mx-auto px-12 py-24">
      <span className="section-label mb-3">Insights</span>
      <h2 className="section-title mb-12">From Our Blog</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-7">

        {/* Featured card */}
        <Link
          href={featured.href}
          className="group rounded-lg overflow-hidden border border-coffee-latte/10 p-12 flex flex-col justify-end min-h-[360px] relative transition-transform duration-300 hover:-translate-y-1"
          style={{
            background: "linear-gradient(135deg, #2d1810 0%, #0d1f0e 100%)",
          }}
        >
          {/* Decorative quote mark */}
          <span
            className="absolute top-6 left-9 font-display text-[6rem] text-coffee-latte/15 leading-none pointer-events-none select-none"
            aria-hidden
          >
            &ldquo;
          </span>

          <span className="font-mono text-[0.68rem] tracking-[0.18em] uppercase text-forest-sage mb-3.5">
            {featured.tag}
          </span>
          <h3 className="font-display text-[1.6rem] font-semibold text-coffee-foam leading-[1.3] mb-4">
            {featured.title}
          </h3>
          {featured.excerpt && (
            <p className="text-[0.88rem] text-ink-dim leading-[1.7] mb-6">
              {featured.excerpt}
            </p>
          )}
          <span className="inline-flex items-center gap-2 text-[0.8rem] tracking-[0.1em] uppercase text-coffee-latte group-hover:gap-3.5 transition-all duration-300">
            Baca Selengkapnya <i className="fas fa-arrow-right" />
          </span>
        </Link>

        {/* Secondary cards */}
        <div className="flex flex-col gap-4">
          {secondaries.map((post) => (
            <Link
              key={post.title}
              href={post.href}
              className="flex-1 p-7 rounded-md border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-coffee-latte/12 transition-all duration-300"
            >
              <span className="font-mono text-[0.68rem] tracking-[0.18em] uppercase text-forest-sage block mb-3">
                {post.tag}
              </span>
              <h3 className="font-display text-[1.05rem] font-semibold text-coffee-foam leading-[1.3] mb-2">
                {post.title}
              </h3>
              <p className="text-[0.82rem] text-ink-ghost">Coming soon</p>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
