import Image from "next/image";
import Button from "@/components/ui/Button";

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
          className="font-display font-semibold text-text-primary leading-[1.1] mb-7"
          style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}
        >
          From Residue
          <br />
          to <em className="italic text-forest-sage">Ritual</em>
        </h2>
        <p className="text-[1rem] text-text-secondary leading-[1.9] mb-9">
          Rebru is one of South Sulawesi&apos;s first startups dedicated to
          transforming spent coffee grounds into high-impact climate products.
          We collect, process, and upgrade waste into biochar, compost, and
          bio-briquettes that restore soil and reduce emissions.
        </p>
        <Button href="/about" variant="primary" className="self-start">
          Read Our Story <i className="fas fa-arrow-right ml-1" />
        </Button>
        <div className="flex gap-8 pt-8 mt-2 border-t border-border-subtle">
          {[
            { value: "2024", label: "Founded" },
            { value: "4+", label: "Products" },
            { value: "100%", label: "Organic" },
          ].map(({ value, label }) => (
            <div key={label}>
              <strong className="block font-display text-[2rem] font-bold text-coffee-latte">
                {value}
              </strong>
              <span className="text-[0.75rem] tracking-[0.08em] uppercase text-text-muted">
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
          style={{ aspectRatio: "4/5", background: "var(--about-img-bg)" }}
        >
          <Image
            src="/assets/img/intro-image.png"
            alt="Rebru Process"
            fill
            className="object-cover opacity-80 mix-blend-luminosity"
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--about-img-overlay)" }}
          />
        </div>
        <div className="absolute -bottom-5 -left-5 rounded-md px-6 py-5 z-10 bg-forest-dark border border-border-DEFAULT">
          <strong className="block font-display text-[1.6rem] text-forest-sage">
            SCG
          </strong>
          <span className="text-[0.72rem] text-text-muted tracking-[0.1em] uppercase">
            Spent Coffee Grounds
          </span>
        </div>
      </div>
    </section>
  );
}
