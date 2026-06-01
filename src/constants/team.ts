// src/constants/team.ts

import type { TeamMember } from "@/types/team";

export const SHOW_ADVISORS = false;

// ─────────────────────────────────────────────────────────────────────────────
// Color presets
// Gunakan spread operator pada object anggota: ...COLOR_PRESETS.coffee
// Pilihan: coffee | sage | amber | gold
// ─────────────────────────────────────────────────────────────────────────────
export const COLOR_PRESETS = {
  coffee: {
    accent: "var(--coffee-latte)",
    bg: "rgba(196,149,106,0.07)",
    border: "rgba(196,149,106,0.2)",
    tagBg: "rgba(74,44,26,0.3)",
  },
  sage: {
    accent: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.07)",
    border: "rgba(122,171,126,0.2)",
    tagBg: "rgba(45,90,46,0.25)",
  },
  amber: {
    accent: "var(--amber)",
    bg: "rgba(212,120,58,0.07)",
    border: "rgba(212,120,58,0.2)",
    tagBg: "rgba(74,44,26,0.22)",
  },
  gold: {
    accent: "var(--gold)",
    bg: "rgba(200,168,75,0.07)",
    border: "rgba(200,168,75,0.2)",
    tagBg: "rgba(74,44,26,0.18)",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FOUNDERS
// Tampilan: 3-col grid — card paling detail (1 diatas dan dua 2 bawah)
// ─────────────────────────────────────────────────────────────────────────────
export const FOUNDERS: TeamMember[] = [
  {
    id: "founder-musawwir",
    name: "Musawwir Muhtar",
    role: "CEO",
    location: "Makassar, ID",
    photo: "/team/awir.png", // ganti dengan "/team/musawwir.jpg"
    initials: "MM",
    tagline:
      "10+ years across climate-focused sectors — waste management, economic empowerment, and agri-tech.",
    bio: "Sustainable development professional with 10+ years of experience across climate-focused sectors including waste management, economic empowerment, and agri-tech. Experienced in startups, NGOs, and CSOs, with a proven track record of scaling ventures from inception to securing $5M in investment while leading operations, growth, government relations, grants, and business development.",
    expertise: [
      "Sustainable Development & Circular Economy",
      "Climate & Waste Management Systems",
      "Startup Growth & Scaling Strategy",
      "Business Development & Gov. Relations",
    ],
    tags: ["Sustainable Dev", "Climate & Waste", "Startup Growth", "Biz Dev"],
    linkedin: "https://id.linkedin.com/in/musawwirmuhtar",
    badge: "Founder",
    ...COLOR_PRESETS.gold,
  },
  // ── Tambah co-founder di sini ──────────────────────────────────────────────
  {
    id: "founder-alam",
    name: "Rinto Alam Nuari",
    role: "CTO",
    location: "Makassar, ID",
    photo: "/team/alam.png",
    initials: "RAN",
    tagline:
      "Connecting operational execution with sustainable system development.",
    bio: "Sustainability-focused professional with experience in waste management operations and circular economy systems. Skilled in coordinating operational workflows, partner engagement, and digital process integration to support scalable and impact-driven sustainability initiatives. Passionate about building practical systems that connect environmental responsibility with efficient operational execution.",
    expertise: [
      "Waste Management Operations",
      "Circular Economy Systems",
      "Operational Workflow Coordination",
      "Digital Process Integration",
    ],
    tags: ["Operations", "Sustainability", "Waste Management", "Systems"],
    linkedin: "",
    badge: "Co-Founder",
    ...COLOR_PRESETS.gold,
  },

  {
    id: "founder-didit",
    name: "Mohammad Dwika Maharditya",
    role: "Head of Strategic Partnerships",
    location: "Makassar, ID",
    photo: "/team/didit.png",
    initials: "MDM",
    tagline:
      "Building strategic collaborations through partnerships and stakeholder engagement.",
    bio: "Founder’s Associate–level professional with experience supporting partnerships, expansion initiatives, and stakeholder engagement in growth-oriented environments. Skilled in market coordination, partner onboarding, and cross-cultural communication, with exposure to leadership discussions and regional field execution. Fluent in English and conversational Mandarin, with a strong interest in building collaborative and impact-driven initiatives across diverse communities.",
    expertise: [
      "Partnership Development",
      "Stakeholder Engagement",
      "Market Expansion Coordination",
      "Cross-Cultural Communication",
    ],
    tags: ["Partnerships", "Expansion", "Communication", "Collaboration"],
    linkedin: "",
    badge: "Co-Founder",
    ...COLOR_PRESETS.gold,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CORE TEAM
// Tampilan: 3-col grid (lg) — card kompak
// ─────────────────────────────────────────────────────────────────────────────
export const CORE_TEAM: TeamMember[] = [
  {
    id: "founder-zulfadli",
    name: "Zulfadli Ibrahim",
    role: "Head of Operations",
    location: "Makassar, ID",
    photo: "/team/fadli.png",
    initials: "ZI",
    tagline:
      "Coordinating operational systems and execution to support scalable sustainability initiatives.",
    bio: "Engineering professional and academic with experience in operational coordination, technical systems, and project execution across engineering and research environments. Skilled in analytical problem solving, workflow management, and system-oriented approaches to support efficient and scalable sustainability initiatives. Actively contributes to operational development through collaborative execution, process coordination, and practical implementation strategies.",
    expertise: [
      "Operational Systems Coordination",
      "Engineering & Technical Planning",
      "Workflow & Process Management",
      "Research & Project Execution",
    ],
    tags: ["Operations", "Systems", "Execution", "Engineering"],
    linkedin: "#",
    badge: "Operations Team",
    ...COLOR_PRESETS.sage,
  },
  {
    id: "team-ainun",
    name: "Ainun Rezkiva Arif",
    role: "Research Associate & Social Media",
    location: "Makassar, ID",
    photo: "/team/ainun.png",
    initials: "ARA",
    tagline:
      "Bridging sustainable material research with science-driven environmental communication.",
    bio: "Chemistry researcher with a focus on biomass-based carbon materials, energy storage systems, and circular economy innovation. Experienced in developing sustainable material solutions from organic waste for environmental and energy-related applications, with current research centered on environmentally friendly energy storage materials. Actively contributes to REBRU through research and development initiatives while supporting science-based social media and educational content to strengthen environmental awareness and public engagement.",
    expertise: [
      "Biomass-Based Carbon Materials",
      "Sustainable Material Research",
      "Circular Economy Innovation",
      "Science Communication & Educational Content",
    ],
    tags: [
      "Research",
      "Sustainability",
      "Carbon Materials",
      "Science Communication",
    ],
    linkedin: "",
    badge: "Research Team",
    ...COLOR_PRESETS.sage,
  },

  {
    id: "team-lisa",
    name: "Lisa Wulandari",
    role: "Research & Development Associate",
    location: "Makassar, ID",
    photo: "/team/lisa.png",
    initials: "LW",
    tagline:
      "Advancing sustainable product development through research and collaborative innovation.",
    bio: "Chemistry postgraduate with a research focus on biomass-based carbon materials, sustainable energy systems, and circular economy innovation. Experienced in supporting research and product development initiatives for environmentally driven solutions derived from organic waste materials. Passionate about collaborative innovation, science communication, and public engagement, with strong confidence in presenting ideas, leading discussions, and translating research into impactful development initiatives.",
    expertise: [
      "Sustainable Product Development",
      "Biomass-Based Carbon Materials",
      "Circular Economy Innovation",
      "Research Presentation & Public Communication",
    ],
    tags: ["Research", "Development", "Sustainability", "Communication"],
    linkedin: "",
    badge: "Research Team",
    ...COLOR_PRESETS.sage,
  }, // ── Tambah core team member baru di sini ──────────────────────────────────
  // {
  //   id: "core-namaslug",
  //   name: "Nama Lengkap",
  //   role: "Role / Posisi",
  //   location: "Kota, ID",
  //   photo: null,
  //   initials: "XX",
  //   tagline: "Satu kalimat deskripsi singkat.",
  //   bio: "Bio lengkap...",
  //   expertise: ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
  //   tags: ["Tag 1", "Tag 2", "Tag 3"],
  //   ...COLOR_PRESETS.coffee, // pilih: coffee | sage | amber | gold
  // },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADVISORS
// Tampilan: 2-col grid — detail hampir setara founder
// ─────────────────────────────────────────────────────────────────────────────
export const ADVISORS: TeamMember[] = [
  {
    id: "adv-maharditya",
    name: "Maharditya",
    role: "Advisor — Growth & Expansion",
    location: "Indonesia / Regional",
    photo: null,
    initials: "MD",
    tagline:
      "Market entry, partnerships, and stakeholder engagement in high-growth environments.",
    bio: "Founder's Associate–level professional with experience driving expansion, partnerships, and stakeholder engagement in high-growth environments. Skilled in market entry, partner onboarding, and cross-cultural communication, with exposure to CEO-level strategy discussions and regional field execution. Fluent in English and conversational Mandarin.",
    expertise: [
      "Market Expansion & Entry Strategy",
      "Partnership Development & Onboarding",
      "Stakeholder & External Relations",
      "Cross-Cultural Communication (EN / ZH)",
    ],
    tags: ["Growth", "Partnerships", "Market Entry", "EN / ZH"],
    linkedin: "#",
    ...COLOR_PRESETS.amber,
  },

  {
    id: "adv-wahyudi",
    name: "Prof. Wahyudi Saputra",
    role: "Advisor — Climate & Soil Science",
    location: "Universitas Hasanuddin",
    photo: null,
    initials: "WS",
    tagline: "Academic guidance on biochar agronomy and soil restoration.",
    bio: "Senior researcher and faculty member at Universitas Hasanuddin's Agriculture Department. Provides technical advisory on Rebru's biochar product line, including soil application protocols and carbon sequestration measurement. Author of 20+ peer-reviewed publications on tropical soil carbon.",
    expertise: [
      "Biochar Agronomy & Soil Carbon",
      "Tropical Soil Restoration",
      "Climate Research & Carbon Measurement",
      "Academic & Institutional Partnerships",
    ],
    tags: ["Biochar", "Soil Science", "Academic", "Carbon"],
    ...COLOR_PRESETS.amber,
  },
  // ── Tambah advisor baru di sini ────────────────────────────────────────────
];
