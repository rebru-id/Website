# Rebru — Next.js App

Rebru adalah platform circular economy berbasis coffee waste.  
Stack: **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase**

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
Salin file `.env.local` dan isi dengan kredensial Supabase kamu:
```bash
cp .env.local .env.local
```

Isi nilai berikut (dapatkan dari https://supabase.com → Project Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Jalankan development server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📁 Struktur Folder

```
src/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout (font, metadata, providers)
│   ├── page.tsx             # Homepage
│   ├── globals.css          # Tailwind + global styles
│   ├── about/page.tsx       # Stub — sprint berikutnya
│   ├── products/page.tsx    # Stub — sprint berikutnya
│   ├── blog/page.tsx        # Stub — sprint berikutnya
│   └── contact/page.tsx     # Stub — sprint berikutnya
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx       # Header navigasi (sticky, mobile hamburger)
│   │   └── Footer.tsx       # Footer + dashboard lock icon
│   │
│   ├── sections/            # Homepage sections
│   │   ├── HeroSection.tsx
│   │   ├── ImpactSection.tsx       ← connect ke Supabase global_stats
│   │   ├── AboutTeaserSection.tsx
│   │   ├── ProductsTeaserSection.tsx
│   │   ├── BlogTeaserSection.tsx
│   │   └── CtaBannerSection.tsx
│   │
│   ├── dashboard/
│   │   ├── AuthModalContext.tsx    # React Context (session state)
│   │   ├── AuthModal.tsx           # Login modal (email + password)
│   │   └── DashboardOverlay.tsx    # Full-screen dashboard (3 roles)
│   │
│   ├── ui/
│   │   └── Toast.tsx        # Toast notification system
│   │
│   └── Providers.tsx        # Wraps semua context providers
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client (untuk Client Components)
│   │   └── server.ts        # Server client (untuk Server Components)
│   └── utils.ts             # cn(), formatNumber(), buildWhatsAppOrderURL()
│
└── types/
    └── index.ts             # Semua TypeScript types (maps ke Supabase schema)
```

---

## 🔐 Dashboard Login (Mock — sebelum Supabase terhubung)

| Email            | Password   | Role              |
|-----------------|------------|-------------------|
| admin@rebru.id  | rebru2025  | Admin             |
| mitra@rebru.id  | mitra123   | Mitra             |
| gov@rebru.id    | gov123     | Government        |
| multi@rebru.id  | multi123   | Admin + Mitra     |

Dashboard diakses via **icon kunci (🔒)** di pojok kanan footer.

---

## 🗄️ Supabase Integration

### Tables yang perlu dibuat:
- `user_profiles` — role, name, phone
- `partner_applications` — dari form Get in Touch
- `mitra` — partner aktif
- `waste_collections` — input limbah
- `bioconversions` — proses konversi
- `products` — katalog produk
- `orders` + `order_items` — transaksi
- `impact_logs` — data CO₂
- `contact_messages` — pesan kontak

### Views yang perlu dibuat:
- `global_stats` — aggregasi untuk impact counter homepage
- `monthly_recap` — untuk dashboard chart

### Cara connect:
1. Uncomment kode di `src/components/sections/ImpactSection.tsx`
2. Ganti mock login di `src/components/dashboard/AuthModal.tsx` dengan Supabase Auth
3. Isi `.env.local` dengan kredensial project kamu

---

## 🌐 Deploy ke Vercel

```bash
# Push ke GitHub dulu
git init
git add .
git commit -m "feat: initial Rebru Next.js setup"
git remote add origin https://github.com/username/rebru.git
git push -u origin main

# Lalu connect repo di vercel.com
# Set environment variables di Vercel dashboard
```

---

## ✅ Sprint Roadmap

| Sprint | Scope |
|--------|-------|
| ✅ Sprint 1 | Homepage + Layout + Dashboard (mock) |
| 🔜 Sprint 2 | About, Products, Blog, Contact pages |
| 🔜 Sprint 3 | Supabase Auth + real login + user_profiles |
| 🔜 Sprint 4 | Commerce (cart + WA checkout) |
| 🔜 Sprint 5 | Supply flow (waste_collections + bioconversions) |
| 🔜 Sprint 6 | Live impact data + monthly_recap charts |
