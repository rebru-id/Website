"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-end pt-40 px-12 pb-20"
    >
      {/* Background — pakai CSS variable, otomatis ganti saat mode berubah */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ background: "var(--hero-gradient)" }}
      />

      {/* Decorative ring — warna dari CSS variable */}
      <div
        className="absolute top-[12%] right-[8%] w-[420px] h-[420px] rounded-full animate-ring-float pointer-events-none"
        style={{
          border: "1px solid var(--ring-border)",
          boxShadow: "var(--ring-shadow)",
        }}
      >
        <div
          className="absolute inset-5 rounded-full"
          style={{ border: "1px solid var(--ring-inner-1)" }}
        />
        <div
          className="absolute inset-[50px] rounded-full"
          style={{ border: "1px solid var(--ring-inner-2)" }}
        />
      </div>

      {/* Particles */}
      <Particles />

      {/* Content */}
      <div className="relative z-10 max-w-[780px]">
        <p
          className="inline-flex items-center gap-2.5 font-mono text-[0.72rem] tracking-[0.2em] uppercase mb-7
                     opacity-0 animate-fade-up animation-fill-forwards animation-delay-300"
          style={{ color: "var(--forest-sage)" }}
        >
          <span
            className="block w-8 h-px"
            style={{ background: "var(--forest-sage)" }}
          />
          Makassar · South Sulawesi · Indonesia
        </p>

        <h1
          className="font-display font-semibold leading-[1.0] mb-7
                     opacity-0 animate-fade-up animation-fill-forwards animation-delay-500"
          style={{
            fontSize: "clamp(3.2rem, 7vw, 6.5rem)",
            color: "var(--text-primary)",
          }}
        >
          Brewing
          <br />
          <em className="italic" style={{ color: "var(--coffee-latte)" }}>
            Scalable
          </em>{" "}
          Impact
          <br />
          <span style={{ color: "var(--forest-sage)" }}>From Coffee Waste</span>
        </h1>

        <p
          className="text-[1rem] max-w-[480px] leading-[1.8] mb-11
                     opacity-0 animate-fade-up animation-fill-forwards animation-delay-700"
          style={{ color: "var(--text-secondary)" }}
        >
          We transform spent coffee grounds into biochar, compost, and
          sustainable materials — driving circular economy solutions across
          Indonesia.
        </p>

        <div
          className="flex gap-4 flex-wrap
                     opacity-0 animate-fade-up animation-fill-forwards animation-delay-900"
        >
          <Link href="/products" className="btn-primary">
            <i className="fas fa-leaf" /> Explore Products
          </Link>
          <Link href="/about" className="btn-ghost">
            <i className="fas fa-arrow-right" /> Our Story
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-12 flex flex-col items-center gap-2 opacity-40 pointer-events-none">
        <div
          className="w-px h-16 animate-scroll-pulse"
          style={{ background: "var(--scroll-line)" }}
        />
        <span
          className="font-mono text-[0.6rem] tracking-[0.15em] uppercase"
          style={{
            writingMode: "vertical-rl",
            color: "var(--text-secondary)",
          }}
        >
          Scroll
        </span>
      </div>
    </section>
  );
}

// ── Particles ─────────────────────────────────────────────────────────────────
function Particles() {
  const particles = [
    {
      left: "8%",
      bottom: "15%",
      dur: 14,
      delay: 0,
      drift: 35,
      size: 3,
      green: false,
    },
    {
      left: "15%",
      bottom: "22%",
      dur: 11,
      delay: 2,
      drift: -28,
      size: 2,
      green: true,
    },
    {
      left: "23%",
      bottom: "8%",
      dur: 13,
      delay: 4,
      drift: 42,
      size: 4,
      green: false,
    },
    {
      left: "31%",
      bottom: "30%",
      dur: 16,
      delay: 1,
      drift: -15,
      size: 2.5,
      green: true,
    },
    {
      left: "42%",
      bottom: "5%",
      dur: 10,
      delay: 3,
      drift: 30,
      size: 3,
      green: false,
    },
    {
      left: "55%",
      bottom: "18%",
      dur: 15,
      delay: 5,
      drift: -38,
      size: 2,
      green: true,
    },
    {
      left: "63%",
      bottom: "25%",
      dur: 12,
      delay: 0.5,
      drift: 22,
      size: 3.5,
      green: false,
    },
    {
      left: "72%",
      bottom: "10%",
      dur: 17,
      delay: 2.5,
      drift: -20,
      size: 2,
      green: true,
    },
    {
      left: "80%",
      bottom: "35%",
      dur: 11,
      delay: 4.5,
      drift: 40,
      size: 3,
      green: false,
    },
    {
      left: "88%",
      bottom: "12%",
      dur: 14,
      delay: 1.5,
      drift: -32,
      size: 2.5,
      green: true,
    },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-0 animate-particle animation-fill-forwards"
          style={
            {
              left: p.left,
              bottom: p.bottom,
              width: p.size,
              height: p.size,
              // Particles ikut CSS variable warna accent
              background: p.green
                ? "var(--forest-sage)"
                : "var(--coffee-latte)",
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
