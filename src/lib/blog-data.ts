// ─────────────────────────────────────────────────────────────────────────────
// REBRU BLOG DATA — Mock layer
// Sprint 3+: replace dengan Supabase query ke tabel `blog_posts`
// ─────────────────────────────────────────────────────────────────────────────

export type BlogCategory =
  | "all"
  | "coffee-waste"
  | "climate-impact"
  | "behind-the-process"
  | "esg-partnership"
  | "product-insights";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: Exclude<BlogCategory, "all">;
  categoryLabel: string;
  readTime: string;
  date: string;
  featured: boolean;
  published: boolean;
  // Article body — array of content blocks
  content?: ContentBlock[];
}

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "impact-box"; items: string[] }
  | { type: "process-steps"; steps: { icon: string; label: string; desc: string }[] }
  | { type: "product-list"; items: { name: string; icon: string; desc: string }[] }
  | { type: "divider" };

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIES: { id: BlogCategory; label: string }[] = [
  { id: "all",                label: "All" },
  { id: "coffee-waste",       label: "Coffee Waste" },
  { id: "climate-impact",     label: "Climate Impact" },
  { id: "behind-the-process", label: "Behind The Process" },
  { id: "esg-partnership",    label: "ESG & Partnership" },
  { id: "product-insights",   label: "Product Insights" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES
// ─────────────────────────────────────────────────────────────────────────────

export const BLOG_POSTS: BlogPost[] = [
  // ── 1. FEATURED — full content ──────────────────────────────────────────
  {
    slug: "coffee-waste-to-climate-impact",
    title: "How 1300+ kg of Coffee Waste is Transformed into Climate-Positive Solutions",
    excerpt:
      "What happens after your coffee is finished? At Rebru, it doesn't end as waste. We collect, process, and transform it into sustainable materials that reduce carbon impact and support circular economy systems.",
    category: "climate-impact",
    categoryLabel: "Climate Impact",
    readTime: "5 min",
    date: "April 2025",
    featured: true,
    published: true,
    content: [
      {
        type: "heading",
        text: "The Hidden Problem Behind Coffee",
      },
      {
        type: "paragraph",
        text: "Every day, millions of cups of coffee are consumed across Indonesia — the country with the highest coffee consumption in Southeast Asia. But what happens after the last sip? Used coffee grounds are often discarded without a second thought, ending up in landfills where they decompose and produce methane: a greenhouse gas up to 86 times more potent than CO₂ over a 20-year period.",
      },
      {
        type: "paragraph",
        text: "This is the hidden environmental cost of your morning cup — and it's almost entirely invisible in mainstream sustainability conversations. The coffee industry focuses on sourcing, fair trade, and packaging. Almost no one talks about what happens to the grounds.",
      },
      {
        type: "quote",
        text: "Used coffee grounds are one of the most underestimated organic waste streams in Indonesia — rich in carbon, nitrogen, and energy potential, yet almost universally discarded.",
      },
      {
        type: "heading",
        text: "Coffee Waste is Not Waste",
      },
      {
        type: "paragraph",
        text: "Spent coffee grounds (SCG) are remarkably resource-dense. They contain up to 20% lipids, significant nitrogen and phosphorus, and a carbon structure that — when processed correctly — becomes one of the most effective soil amendments on the planet. The problem isn't that coffee waste lacks value. The problem is that most systems aren't built to capture that value.",
      },
      {
        type: "paragraph",
        text: "At Rebru, we built exactly that system — starting in Makassar, South Sulawesi, and designed to scale across Indonesia.",
      },
      {
        type: "heading",
        text: "The Rebru Circular System",
      },
      {
        type: "process-steps",
        steps: [
          {
            icon: "fa-coffee",
            label: "Collect",
            desc: "Our Mitra network — cafes, restaurants, and food businesses — segregates and hands over spent coffee grounds. Every kilogram is weighed, logged, and attributed to the contributing partner.",
          },
          {
            icon: "fa-flask",
            label: "Transform",
            desc: "Through controlled bioconversion — pyrolysis for biochar, composting for organic fertilizer, and compression for bio-briquettes — raw waste becomes traceable, high-quality products with measurable environmental credentials.",
          },
          {
            icon: "fa-chart-line",
            label: "Report",
            desc: "Every batch generates an impact log: kg of waste diverted, CO₂e avoided, and product output. This data flows directly into our ESG dashboard — visible to partners, buyers, and government stakeholders.",
          },
        ],
      },
      {
        type: "heading",
        text: "Real Impact, Measured",
      },
      {
        type: "impact-box",
        items: [
          "1300+ kg coffee waste recycled to date",
          "Estimated 1.6 ton CO₂e avoided from landfill methane",
          "8+ active Mitra partners across Makassar",
          "4 product lines in active production or R&D",
          "Supporting circular economy goals in South Sulawesi",
        ],
      },
      {
        type: "heading",
        text: "Turning Waste into Climate Solutions",
      },
      {
        type: "paragraph",
        text: "The outputs of our circular system aren't just better than waste — they're actively beneficial. Biochar applied to soil locks carbon for centuries while improving water retention and soil biology. Bio-briquettes replace fossil fuels and conventional wood charcoal with a cleaner-burning, carbon-neutral alternative. Compost returns nutrients to the agricultural cycle, reducing reliance on synthetic fertilizers.",
      },
      {
        type: "product-list",
        items: [
          { name: "Biochar", icon: "fa-seedling", desc: "Sequesters carbon for centuries while improving soil health and water retention." },
          { name: "Compost", icon: "fa-leaf", desc: "Returns nutrients to the agricultural cycle, reducing need for synthetic fertilizers." },
          { name: "Bio-briquettes", icon: "fa-fire", desc: "Replaces coal and wood charcoal with a cleaner, carbon-neutral energy source." },
          { name: "Raw Materials", icon: "fa-flask", desc: "Biodegradable packaging and structural materials. Currently in R&D phase." },
        ],
      },
      {
        type: "heading",
        text: "More Than Recycling",
      },
      {
        type: "paragraph",
        text: "Rebru is not a recycling company. We are a circular economy infrastructure builder. The difference matters: recycling captures existing value; circular economy creates new value chains that didn't exist before. Our system bridges waste producers, processors, buyers, and impact verifiers — creating a traceable loop where every cup of coffee becomes an accountable unit of environmental action.",
      },
      {
        type: "paragraph",
        text: "For businesses, this means measurable ESG credentials tied to real, verified waste diversion. For government, it means data-backed sustainability reporting. For Mitra partners, it means recognition and revenue from what was previously a disposal cost.",
      },
      {
        type: "quote",
        text: "Every cup of coffee becomes a catalyst for climate resilience.",
      },
    ],
  },

  // ── 2. Coffee Waste ──────────────────────────────────────────────────────
  {
    slug: "why-coffee-waste-is-a-hidden-environmental-problem",
    title: "Why Coffee Waste is a Hidden Environmental Problem",
    excerpt:
      "Spent coffee grounds decompose into methane — a greenhouse gas 86× more potent than CO₂. Here's why this overlooked waste stream deserves serious attention.",
    category: "coffee-waste",
    categoryLabel: "Coffee Waste",
    readTime: "4 min",
    date: "March 2025",
    featured: false,
    published: true,
    content: [],
  },

  // ── 3. Behind The Process ────────────────────────────────────────────────
  {
    slug: "inside-rebru-from-collection-to-transformation",
    title: "Inside Rebru: From Collection to Transformation",
    excerpt:
      "A behind-the-scenes look at how Rebru's Mitra network operates — from cafe pickup to biochar production in Makassar.",
    category: "behind-the-process",
    categoryLabel: "Behind The Process",
    readTime: "6 min",
    date: "March 2025",
    featured: false,
    published: true,
    content: [],
  },

  // ── 4. Product Insights ──────────────────────────────────────────────────
  {
    slug: "what-is-biochar-and-why-it-matters",
    title: "What is Biochar and Why It Matters for Soil and Climate",
    excerpt:
      "Biochar is one of the few materials that simultaneously improves agricultural productivity and sequesters carbon for centuries. Here's the science behind it.",
    category: "product-insights",
    categoryLabel: "Product Insights",
    readTime: "5 min",
    date: "February 2025",
    featured: false,
    published: true,
    content: [],
  },

  // ── 5. ESG ───────────────────────────────────────────────────────────────
  {
    slug: "how-businesses-can-turn-waste-into-esg-value",
    title: "How Businesses Can Turn Waste into Measurable ESG Value",
    excerpt:
      "ESG reporting is evolving from checkbox compliance to verifiable impact. Rebru's waste diversion program gives businesses the data they need to report real environmental action.",
    category: "esg-partnership",
    categoryLabel: "ESG & Partnership",
    readTime: "5 min",
    date: "February 2025",
    featured: false,
    published: false, // coming soon
    content: [],
  },

  // ── 6. Education ─────────────────────────────────────────────────────────
  {
    slug: "circular-economy-explained-through-coffee-waste",
    title: "Circular Economy Explained Through Coffee Waste",
    excerpt:
      "Abstract economic theory becomes concrete when you follow a single coffee ground from cafe to climate solution. A simple explainer for the circular economy.",
    category: "coffee-waste",
    categoryLabel: "Coffee Waste",
    readTime: "4 min",
    date: "January 2025",
    featured: false,
    published: false, // coming soon
    content: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getAllPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getPostsByCategory(category: BlogCategory): BlogPost[] {
  if (category === "all") return BLOG_POSTS;
  return BLOG_POSTS.filter((p) => p.category === category);
}

export function getFeaturedPost(): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.featured && p.published);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  return BLOG_POSTS.filter(
    (p) => p.slug !== slug && p.category === post.category
  ).slice(0, limit);
}
