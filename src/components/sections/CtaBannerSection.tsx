import Link from "next/link";

export default function CtaBannerSection() {
  return (
    <section
      id="cta-banner"
      className="mx-12 mb-16 rounded-lg px-16 py-20 text-center relative overflow-hidden border border-forest-sage/10"
      style={{
        background: `
          radial-gradient(ellipse 80% 100% at 50% 100%, rgba(45,90,46,0.3) 0%, transparent 70%),
          linear-gradient(135deg, #2d1810 0%, #0d1f0e 100%)
        `,
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-px"
        style={{ background: "linear-gradient(90deg, transparent, #7aab7e, transparent)" }}
      />

      <h2
        className="font-display font-semibold text-coffee-foam leading-[1.2] mb-4"
        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        Every Cup of Coffee<br />
        Becomes a Catalyst for<br />
        <em className="italic text-forest-sage">Climate Resilience</em>
      </h2>

      <p className="text-[1rem] text-ink-dim max-w-[480px] mx-auto leading-[1.8] mb-10">
        Partner with us to redirect waste from landfills and create measurable
        environmental impact across Indonesia.
      </p>

      <div className="flex gap-4 justify-center flex-wrap">
        <Link href="/contact" className="btn-green">
          <i className="fas fa-handshake" /> Become a Partner
        </Link>
        <Link href="/products" className="btn-ghost">
          <i className="fas fa-shopping-bag" /> Shop Products
        </Link>
      </div>
    </section>
  );
}
