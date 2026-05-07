// src/lib/supabase-contact.ts
// ─────────────────────────────────────────────────────────────────────────────
// REBRU Website — Supabase Contact Integration (Sprint 4 — FINAL)
//
// PERBAIKAN: fungsi fetch lokasi mengembalikan format objek
//   { value: string, label: string, aktif?: boolean }
//   — identik dengan format yang dihasilkan location-data.ts lama
//   sehingga ContactFormSection.tsx tidak perlu diubah sama sekali.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase client — lazy singleton + hardcode fallback
//
// KENAPA TIDAK MODULE LEVEL:
//   createClient() di module level menyebabkan env vars belum terbaca
//   saat Next.js mengevaluasi module (terutama di SSR/build time).
//   Hasilnya: supabase client terbentuk dengan URL undefined → semua
//   operasi diam-diam gagal tanpa error yang terlihat di UI.
//
// SOLUSI — lazy singleton:
//   Client dibuat pertama kali saat fungsi dipanggil (runtime browser),
//   bukan saat module di-import (build time).
//
// HARDCODE FALLBACK:
//   NEXT_PUBLIC_ anon key aman di-hardcode karena by design sudah
//   ter-bundle ke client JS bundle. Keamanan dijaga RLS di Supabase.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://mubzwqkhhhittibstugh.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Ynp3cWtoaGhpdHRpYnN0dWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTA5NjYsImV4cCI6MjA5MDY4Njk2Nn0.C_YqDM0OFAVc9zww5afq9S0po2n7KzZGW9HhzNsMcrE";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? SUPABASE_ANON;
  _client = createClient(url, key);
  return _client;
}

// Backward-compat export — masih bisa dipakai komponen lain yang sudah
// import { supabase } from "@/lib/supabase-contact"
export const supabase = {
  from: (...args: Parameters<SupabaseClient["from"]>) =>
    getClient().from(...args),
  auth: new Proxy({} as SupabaseClient["auth"], {
    get:
      (_t, prop) =>
      (...a: unknown[]) =>
        (
          getClient().auth as unknown as Record<
            string,
            (...args: unknown[]) => unknown
          >
        )[prop as string](...a),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — format lokasi sesuai ContactFormSection.tsx (opt.value, opt.label, opt.aktif)
// ─────────────────────────────────────────────────────────────────────────────

export interface LokasiOption {
  value: string; // slug / nama lowercase (dipakai sebagai key dan form value)
  label: string; // nama tampil di dropdown
  aktif?: boolean; // false = disabled di dropdown (tampil "(segera)")
}

export type PackageType = "kontributor" | "dampak" | "strategis";
export type JenisUsaha =
  | "Cafe / Coffee Shop"
  | "Restoran"
  | "Hotel / Penginapan"
  | "Catering"
  | "Kantor / Perusahaan"
  | "Lainnya";
export type VolumeLimbah =
  | "< 1 kg / hari"
  | "1 – 5 kg / hari"
  | "5 – 10 kg / hari"
  | "> 10 kg / hari";

interface PartnerFormState {
  type: string;
  pic: string;
  organization: string;
  phone: string;
  email: string;
  jenisUsaha: string;
  volumeLimbah: string;
  kota: string; // value (slug/label) dari dropdown
  kotaCustom: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  message: string;
}

interface GeneralFormState {
  name: string;
  phone: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOKASI DROPDOWN
// Return type: LokasiOption[] — IDENTIK dengan format location-data.ts
// ContactFormSection.tsx tidak perlu diubah sama sekali.
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchKotaList(): Promise<LokasiOption[]> {
  const { data, error } = await getClient()
    .from("ref_kota")
    .select("nama, aktif")
    .order("aktif", { ascending: false }) // aktif = true muncul duluan
    .order("nama");

  if (error) {
    console.error("[supabase-contact] fetchKotaList:", error.message);
    return [];
  }

  return data.map((r) => ({
    value: r.nama, // pakai nama sebagai value (konsisten dengan kota_nama di DB)
    label: r.nama,
    aktif: r.aktif,
  }));
}

export async function fetchKecamatanByKota(
  kotaNama: string,
): Promise<LokasiOption[]> {
  if (!kotaNama || kotaNama === "Lainnya" || kotaNama === "Kota / Kab. Lain")
    return [];

  const { data, error } = await getClient()
    .from("ref_kecamatan")
    .select("nama, ref_kota!inner(nama)")
    .eq("ref_kota.nama", kotaNama)
    .order("nama");

  if (error) {
    console.error("[supabase-contact] fetchKecamatanByKota:", error.message);
    return [];
  }

  return data.map((r) => ({
    value: r.nama,
    label: r.nama,
    aktif: true,
  }));
}

export async function fetchKelurahanByKecamatan(
  kecamatanNama: string,
  kotaNama: string,
): Promise<LokasiOption[]> {
  if (!kecamatanNama || !kotaNama) return [];

  const { data, error } = await getClient()
    .from("ref_kelurahan")
    .select("nama, ref_kecamatan!inner(nama, ref_kota!inner(nama))")
    .eq("ref_kecamatan.nama", kecamatanNama)
    .eq("ref_kecamatan.ref_kota.nama", kotaNama)
    .order("nama");

  if (error) {
    console.error(
      "[supabase-contact] fetchKelurahanByKecamatan:",
      error.message,
    );
    return [];
  }

  return data.map((r) => ({
    value: r.nama,
    label: r.nama,
    aktif: true,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// insertPartnerApplication
// ─────────────────────────────────────────────────────────────────────────────

export async function insertPartnerApplication(
  form: PartnerFormState,
): Promise<{ error: Error | null }> {
  try {
    const isCustomKota =
      form.kota === "Kota / Kab. Lain" || form.kota === "Lainnya" || !form.kota;

    const { error } = await getClient()
      .from("partner_applications")
      .insert({
        pic_name: form.pic.trim(),
        organization: form.organization.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        package_type: form.type as PackageType,
        jenis_usaha: form.jenisUsaha as JenisUsaha,
        volume_limbah: form.volumeLimbah as VolumeLimbah,
        kota_nama: isCustomKota
          ? form.kotaCustom?.trim() || "Lainnya"
          : form.kota,
        kota_custom: isCustomKota ? form.kotaCustom?.trim() || null : null,
        kecamatan_nama: form.kecamatan.trim(),
        kelurahan_nama: form.kelurahan.trim() || null,
        alamat_detail: form.alamat.trim(),
        message: form.message.trim() || null,
        source_platform: "website",
      });

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error("Unknown error") };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// insertContactMessage
// ─────────────────────────────────────────────────────────────────────────────

export async function insertContactMessage(
  form: GeneralFormState,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await getClient()
      .from("contact_messages")
      .insert({
        sender_name: form.name.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim(),
      });

    if (error) throw new Error(error.message);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error("Unknown error") };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS & PACKAGES
// ─────────────────────────────────────────────────────────────────────────────

export async function getProducts() {
  const { data, error } = await getClient()
    .from("products")
    .select("*, product_variants(*)")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    console.error("[supabase-contact] getProducts:", error.message);
    return [];
  }
  return data;
}

export async function getFeaturedProducts() {
  const { data, error } = await getClient()
    .from("products")
    .select("*, product_variants(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order");
  if (error) return [];
  return data;
}

export async function getPackages() {
  const { data, error } = await getClient()
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) {
    console.error("[supabase-contact] getPackages:", error.message);
    return [];
  }
  return data;
}
