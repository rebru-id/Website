// src/types/team.ts

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  location: string;
  /** Path ke /public/team/namafile.jpg  |  null = tampilkan initials */
  photo: string | null;
  initials: string;
  /** Satu kalimat — tampil di card yang belum di-expand */
  tagline: string;
  /** Paragraf lengkap — tampil setelah expand */
  bio: string;
  /** Maksimal 4 item untuk tampilan terbaik */
  expertise: string[];
  /** Maksimal 4 tag untuk tampilan terbaik */
  tags: string[];
  linkedin?: string;
  /** Label kecil di pojok kanan card (opsional) */
  badge?: string;
  /** Sembunyikan dari halaman tanpa hapus data */
  hidden?: boolean;
  // ── Design tokens ──────────────────────────────────────────────────────────
  accent: string;
  bg: string;
  border: string;
  tagBg: string;
}
