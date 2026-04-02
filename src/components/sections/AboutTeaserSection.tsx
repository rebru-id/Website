import Link from "next/link";
import Image from "next/image";

export default function AboutTeaserSection() {
  return (
    <section
      id="about-teaser"
      className="max-w-[1280px] mx-auto px-12 py-28 grid grid-cols-1 md:grid-cols-2 gap-20 items-center"
    >
      {/* Text */}
      <div className="flex flex-col">
        <span className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-coffee-latte mb-5">
          // Who we are
        </span>

        <h2
          className="font-display font-semibold text-coffee-foam leading-[1.1] mb-7"
          style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}
        >
          From Residue<br />
          to <em className="italic text-forest-sage">Ritual</em>
        </h2>

        <p className="text-[1rem] text-ink-dim leading-[1.9] mb-9">
          Rebru is one of South Sulawesi&apos;s first startups dedicated to
          transforming spent coffee grounds into high-impact climate products.
          We collect, process, and upgrade waste into biochar, compost, and
          bio-briquettes that restore soil and reduce emissions.
        </p>

        <Link href="/about" className="btn-primary self-start">
          Read Our Story <i className="fas fa-arrow-right ml-1" />
        </Link>

        {/* Mini stats */}
        <div className="flex gap-8 pt-8 mt-2 border-t border-white/6">
          {[
            { value: "2024", label: "Founded"  },
            { value: "4+",   label: "Products" },
            { value: "100%", label: "Organic"  },
          ].map(({ value, label }) => (
            <div key={label}>
              <strong className="block font-display text-[2rem] font-bold text-coffee-latte">
                {value}
              </strong>
              <span className="text-[0.75rem] tracking-[0.08em] uppercase text-ink-ghost">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual */}
      <div className="relative">
        <div
          className="rounded-lg overflow-hidden relative"
          style={{ aspectRatio: "4/5", background: "linear-gradient(135deg, #4a2c1a 0%, #1a3a1b 100%)" }}
        >
          <Image
            src="/assets/img/intro-image.png"
            alt="Rebru Process"
            fill
            className="object-cover opacity-80 mix-blend-luminosity"
            onError={() => {}}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(26,15,10,0.7))" }}
          />
        </div>

        {/* Badge */}
        <div className="absolute -bottom-5 -left-5 bg-forest-dark border border-forest-sage/20 rounded-md px-6 py-5 z-10">
          <strong className="block font-display text-[1.6rem] text-forest-sage">SCG</strong>
          <span className="text-[0.72rem] text-ink-ghost tracking-[0.1em] uppercase">
            Spent Coffee Grounds
          </span>
        </div>
      </div>
    </section>
  );
}
