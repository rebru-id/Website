import Link from "next/link";

export default function CtaBannerSection() {
  return (
    <section
      id="cta-banner"
      className="mx-12 mb-16 rounded-lg px-16 py-20 text-center relative overflow-hidden"
      style={{
        background: "var(--cta-gradient)",
        border: "1px solid rgba(122, 171, 126, 0.15)",
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-px"
        style={{ background: "var(--cta-top-line)" }}
      />

      <h2
        className="font-display font-semibold leading-[1.2] mb-4"
        style={{
          fontSize: "clamp(2rem, 4vw, 3.5rem)",
          color: "var(--cta-text)" /* selalu terang — bg selalu dark */,
        }}
      >
        Every Cup of Coffee
        <br />
        Becomes a Catalyst for
        <br />
        <em className="italic" style={{ color: "var(--cta-text-em)" }}>
          Climate Resilience
        </em>
      </h2>

      <p
        className="text-[1rem] max-w-[480px] mx-auto leading-[1.8] mb-10"
        style={{ color: "var(--cta-text-sub)" }}
      >
        Partner with us to redirect waste from landfills and create measurable
        environmental impact across Indonesia.
      </p>

      <div className="flex gap-4 justify-center flex-wrap">
        <Link href="/contact" className="btn-green">
          <i className="fas fa-handshake" /> Become a Partner
        </Link>
        {/* Ghost button override — light text di atas dark bg */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2.5 px-9 py-4 text-[0.88rem] font-medium tracking-[0.08em] uppercase rounded-pill transition-all duration-300 cursor-pointer"
          style={{
            color: "var(--cta-text-sub)",
            border: "1px solid rgba(200,223,201,0.25)",
          }}
        >
          <i className="fas fa-shopping-bag" /> Shop Products
        </Link>
      </div>
    </section>
  );
}
