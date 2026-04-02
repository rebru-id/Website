import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProductCard {
  icon:      string;
  iconStyle: string;
  title:     string;
  desc:      string;
  badge?:    string;
}

const PRODUCTS: ProductCard[] = [
  {
    icon:      "fa-leaf",
    iconStyle: "bg-forest-moss/25 text-forest-sage",
    title:     "Biochar",
    desc:      "Improves soil health, increases water retention, and locks carbon for centuries. The cornerstone of our circular system.",
  },
  {
    icon:      "fa-seedling",
    iconStyle: "bg-coffee-mid/40 text-coffee-latte",
    title:     "Compost",
    desc:      "Organic fertilizer made from coffee grounds blended with restaurant waste. Nutrient-rich and ready to use.",
  },
  {
    icon:      "fa-fire",
    iconStyle: "bg-gold/15 text-gold",
    title:     "Bio-briquettes",
    desc:      "Cleaner-burning fuel briquettes using spent coffee grounds as the primary ingredient. Low-smoke, high-efficiency.",
  },
  {
    icon:      "fa-flask",
    iconStyle: "bg-amber/15 text-amber",
    title:     "Raw Materials",
    desc:      "Biodegradable cups, blocks, and sustainable packaging prototypes. Pioneering the next frontier.",
    badge:     "In R&D",
  },
];

export default function ProductsTeaserSection() {
  return (
    <section
      id="products-teaser"
      className="px-12 py-24"
      style={{
        background: "linear-gradient(180deg, transparent, rgba(13,31,14,0.4), transparent)",
      }}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <span className="section-label mb-3">What We Make</span>
            <h2 className="section-title">Circular Innovations</h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[0.82rem] tracking-[0.12em] uppercase text-ink-dim border-b border-white/15 pb-1 hover:text-coffee-latte hover:border-coffee-latte transition-all duration-300 self-start md:self-auto"
          >
            View All Products <i className="fas fa-arrow-right" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRODUCTS.map((p) => (
            <Link
              key={p.title}
              href="/products"
              className={cn(
                "group card-base rounded-lg p-9 flex flex-col cursor-pointer relative overflow-hidden",
                "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5",
                "before:bg-gradient-to-r before:from-coffee-warm before:to-forest-moss",
                "before:scale-x-0 before:transition-transform before:duration-400",
                "hover:before:scale-x-100 hover:-translate-y-1.5"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-[52px] h-[52px] rounded-md flex items-center justify-center text-[1.4rem] mb-6",
                  p.iconStyle
                )}
              >
                <i className={cn("fas", p.icon)} />
              </div>

              <h4 className="font-display text-[1.3rem] font-semibold text-coffee-foam mb-2.5">
                {p.title}
              </h4>
              <p className="text-[0.88rem] text-ink-dim leading-[1.7]">{p.desc}</p>

              {p.badge && (
                <span className="inline-block mt-4 px-3 py-1 rounded-pill text-[0.68rem] tracking-[0.1em] uppercase bg-amber/15 text-amber border border-amber/25 self-start">
                  {p.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
