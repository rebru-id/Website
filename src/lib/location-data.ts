// src/lib/location-data.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// REBRU LOCATION DATA — Kota · Kecamatan · Kelurahan
//
// ARSITEKTUR SUPABASE-READY:
// Saat ini: data statis di file ini (Sprint 2)
// Sprint 3: ganti fungsi-fungsi di bagian bawah dengan Supabase query
//
// Schema Supabase yang direkomendasikan:
//
//   TABLE: ref_kota
//     id        uuid  PK
//     nama      text
//     aktif     boolean  ← false untuk kota yg di-disable
//
//   TABLE: ref_kecamatan
//     id        uuid  PK
//     kota_id   uuid  FK → ref_kota.id
//     nama      text
//
//   TABLE: ref_kelurahan
//     id        uuid  PK
//     kecamatan_id  uuid  FK → ref_kecamatan.id
//     nama      text
//
// Migration Sprint 3:
//   1. Seed tabel ref_kota, ref_kecamatan, ref_kelurahan dengan data di bawah
//   2. Ganti fungsi getKotaList(), getKecamatanByKota(), getKelurahanByKecamatan()
//      dengan Supabase query (lihat komentar di setiap fungsi)
// ─────────────────────────────────────────────────────────────────────────────

export interface KotaOption {
  value: string;
  label: string;
  aktif: boolean; // false = disabled di dropdown
}

export interface KecamatanOption {
  value: string;
  label: string;
  kota: string;
}

export interface KelurahanOption {
  value: string;
  label: string;
  kecamatan: string;
  kota: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static data — seed ini ke Supabase Sprint 3
// ─────────────────────────────────────────────────────────────────────────────

const KOTA_LIST: KotaOption[] = [
  { value: "makassar", label: "Makassar", aktif: true },
  { value: "gowa", label: "Kab. Gowa", aktif: true },
  { value: "maros", label: "Kab. Maros", aktif: true },
  { value: "takalar", label: "Kab. Takalar", aktif: false },
  { value: "pangkep", label: "Kab. Pangkep", aktif: false },
  { value: "barru", label: "Kab. Barru", aktif: false },
  { value: "bone", label: "Kab. Bone", aktif: false },
  { value: "soppeng", label: "Kab. Soppeng", aktif: false },
  { value: "wajo", label: "Kab. Wajo", aktif: false },
  { value: "sinjai", label: "Kab. Sinjai", aktif: false },
  { value: "bulukumba", label: "Kab. Bulukumba", aktif: false },
  { value: "bantaeng", label: "Kab. Bantaeng", aktif: false },
  { value: "jeneponto", label: "Kab. Jeneponto", aktif: false },
  { value: "selayar", label: "Kab. Selayar", aktif: false },
  { value: "parepare", label: "Parepare", aktif: false },
  { value: "palopo", label: "Palopo", aktif: false },
  { value: "lain", label: "Kota / Kab. Lain (isi manual)", aktif: true },
];

const KECAMATAN_LIST: KecamatanOption[] = [
  // ── Makassar ──────────────────────────────────────────────────────────────
  { value: "biringkanaya", label: "Biringkanaya", kota: "makassar" },
  { value: "tamalanrea", label: "Tamalanrea", kota: "makassar" },
  { value: "tallo", label: "Tallo", kota: "makassar" },
  { value: "panakkukang", label: "Panakkukang", kota: "makassar" },
  { value: "manggala", label: "Manggala", kota: "makassar" },
  { value: "rappocini", label: "Rappocini", kota: "makassar" },
  { value: "makassar_kec", label: "Makassar", kota: "makassar" },
  { value: "ujung_pandang", label: "Ujung Pandang", kota: "makassar" },
  { value: "wajo_kec", label: "Wajo", kota: "makassar" },
  { value: "bontoala", label: "Bontoala", kota: "makassar" },
  { value: "ujung_tanah", label: "Ujung Tanah", kota: "makassar" },
  {
    value: "kep_sangkarrang",
    label: "Kepulauan Sangkarrang",
    kota: "makassar",
  },
  { value: "tamalate", label: "Tamalate", kota: "makassar" },
  { value: "mariso", label: "Mariso", kota: "makassar" },
  { value: "mamajang", label: "Mamajang", kota: "makassar" },
  // ── Gowa ──────────────────────────────────────────────────────────────────
  { value: "somba_opu", label: "Somba Opu", kota: "gowa" },
  { value: "pallangga", label: "Pallangga", kota: "gowa" },
  { value: "bajeng", label: "Bajeng", kota: "gowa" },
  { value: "bajeng_barat", label: "Bajeng Barat", kota: "gowa" },
  { value: "bontonompo", label: "Bontonompo", kota: "gowa" },
  { value: "bontonompo_selatan", label: "Bontonompo Selatan", kota: "gowa" },
  { value: "barombong", label: "Barombong", kota: "gowa" },
  { value: "pattallassang", label: "Pattallassang", kota: "gowa" },
  { value: "parangloe_gowa", label: "Parangloe", kota: "gowa" },
  { value: "manuju", label: "Manuju", kota: "gowa" },
  { value: "tinggimoncong", label: "Tinggimoncong", kota: "gowa" },
  { value: "tombolo_pao", label: "Tombolo Pao", kota: "gowa" },
  { value: "parigi_gowa", label: "Parigi", kota: "gowa" },
  { value: "bungaya", label: "Bungaya", kota: "gowa" },
  { value: "bontolempangan", label: "Bontolempangan", kota: "gowa" },
  { value: "tompobulu_gowa", label: "Tompobulu", kota: "gowa" },
  { value: "biringbulu", label: "Biringbulu", kota: "gowa" },
  { value: "bontomarannu", label: "Bontomarannu", kota: "gowa" },
  // ── Maros ─────────────────────────────────────────────────────────────────
  { value: "turikale", label: "Turikale", kota: "maros" },
  { value: "maros_baru", label: "Maros Baru", kota: "maros" },
  { value: "lau", label: "Lau", kota: "maros" },
  { value: "bontoa", label: "Bontoa", kota: "maros" },
  { value: "mandai", label: "Mandai", kota: "maros" },
  { value: "moncongloe", label: "Moncongloe", kota: "maros" },
  { value: "marusu", label: "Marusu", kota: "maros" },
  { value: "simbang", label: "Simbang", kota: "maros" },
  { value: "tanralili", label: "Tanralili", kota: "maros" },
  { value: "tompobulu_maros", label: "Tompobulu", kota: "maros" },
  { value: "cenrana", label: "Cenrana", kota: "maros" },
  { value: "mallawa", label: "Mallawa", kota: "maros" },
  { value: "bantimurung", label: "Bantimurung", kota: "maros" },
  { value: "camba", label: "Camba", kota: "maros" },
];

const KELURAHAN_LIST: KelurahanOption[] = [
  // ── Makassar — Biringkanaya ───────────────────────────────────────────────
  {
    value: "berua",
    label: "Berua",
    kecamatan: "biringkanaya",
    kota: "makassar",
  },
  {
    value: "paccerakkang",
    label: "Paccerakkang",
    kecamatan: "biringkanaya",
    kota: "makassar",
  },
  {
    value: "sudiang",
    label: "Sudiang",
    kecamatan: "biringkanaya",
    kota: "makassar",
  },
  {
    value: "sudiang_raya",
    label: "Sudiang Raya",
    kecamatan: "biringkanaya",
    kota: "makassar",
  },
  {
    value: "untia",
    label: "Untia",
    kecamatan: "biringkanaya",
    kota: "makassar",
  },
  {
    value: "bulurokeng",
    label: "Bulurokeng",
    kecamatan: "biringkanaya",
    kota: "makassar",
  },
  {
    value: "katimbang",
    label: "Katimbang",
    kecamatan: "biringkanaya",
    kota: "makassar",
  },
  // Tamalanrea
  {
    value: "tamalanrea_kel",
    label: "Tamalanrea",
    kecamatan: "tamalanrea",
    kota: "makassar",
  },
  {
    value: "tamalanrea_indah",
    label: "Tamalanrea Indah",
    kecamatan: "tamalanrea",
    kota: "makassar",
  },
  {
    value: "kapasa",
    label: "Kapasa",
    kecamatan: "tamalanrea",
    kota: "makassar",
  },
  { value: "bira", label: "Bira", kecamatan: "tamalanrea", kota: "makassar" },
  {
    value: "parangloe_mksr",
    label: "Parangloe",
    kecamatan: "tamalanrea",
    kota: "makassar",
  },
  {
    value: "tamalanrea_jaya",
    label: "Tamalanrea Jaya",
    kecamatan: "tamalanrea",
    kota: "makassar",
  },
  // Tallo
  { value: "tallo_kel", label: "Tallo", kecamatan: "tallo", kota: "makassar" },
  {
    value: "kaluku_bodoa",
    label: "Kaluku Bodoa",
    kecamatan: "tallo",
    kota: "makassar",
  },
  { value: "lembo", label: "Lembo", kecamatan: "tallo", kota: "makassar" },
  {
    value: "pannampu",
    label: "Pannampu",
    kecamatan: "tallo",
    kota: "makassar",
  },
  {
    value: "ujung_pandang_baru",
    label: "Ujung Pandang Baru",
    kecamatan: "tallo",
    kota: "makassar",
  },
  {
    value: "wala_walaya",
    label: "Wala-Walaya",
    kecamatan: "tallo",
    kota: "makassar",
  },
  // Panakkukang
  {
    value: "karampuang",
    label: "Karampuang",
    kecamatan: "panakkukang",
    kota: "makassar",
  },
  {
    value: "masale",
    label: "Masale",
    kecamatan: "panakkukang",
    kota: "makassar",
  },
  {
    value: "pandang",
    label: "Pandang",
    kecamatan: "panakkukang",
    kota: "makassar",
  },
  {
    value: "paropo",
    label: "Paropo",
    kecamatan: "panakkukang",
    kota: "makassar",
  },
  {
    value: "panaikang",
    label: "Panaikang",
    kecamatan: "panakkukang",
    kota: "makassar",
  },
  {
    value: "tamamaung",
    label: "Tamamaung",
    kecamatan: "panakkukang",
    kota: "makassar",
  },
  // Manggala
  { value: "antang", label: "Antang", kecamatan: "manggala", kota: "makassar" },
  {
    value: "bangkala",
    label: "Bangkala",
    kecamatan: "manggala",
    kota: "makassar",
  },
  { value: "batua", label: "Batua", kecamatan: "manggala", kota: "makassar" },
  { value: "borong", label: "Borong", kecamatan: "manggala", kota: "makassar" },
  {
    value: "manggala_kel",
    label: "Manggala",
    kecamatan: "manggala",
    kota: "makassar",
  },
  {
    value: "tamangapa",
    label: "Tamangapa",
    kecamatan: "manggala",
    kota: "makassar",
  },
  // Rappocini
  {
    value: "ballaparang",
    label: "Ballaparang",
    kecamatan: "rappocini",
    kota: "makassar",
  },
  {
    value: "banta_bantaeng",
    label: "Banta-Bantaeng",
    kecamatan: "rappocini",
    kota: "makassar",
  },
  {
    value: "buakana",
    label: "Buakana",
    kecamatan: "rappocini",
    kota: "makassar",
  },
  {
    value: "gunung_sari",
    label: "Gunung Sari",
    kecamatan: "rappocini",
    kota: "makassar",
  },
  {
    value: "karunrung",
    label: "Karunrung",
    kecamatan: "rappocini",
    kota: "makassar",
  },
  {
    value: "kassi_kassi",
    label: "Kassi-Kassi",
    kecamatan: "rappocini",
    kota: "makassar",
  },
  // Makassar (kecamatan)
  {
    value: "bara_baraya",
    label: "Bara-Baraya",
    kecamatan: "makassar_kec",
    kota: "makassar",
  },
  {
    value: "bara_baraya_sel",
    label: "Bara-Baraya Selatan",
    kecamatan: "makassar_kec",
    kota: "makassar",
  },
  {
    value: "ende_mksr",
    label: "Ende",
    kecamatan: "makassar_kec",
    kota: "makassar",
  },
  {
    value: "gusung_mksr",
    label: "Gusung",
    kecamatan: "makassar_kec",
    kota: "makassar",
  },
  {
    value: "maradekaya",
    label: "Maradekaya",
    kecamatan: "makassar_kec",
    kota: "makassar",
  },
  {
    value: "maradekaya_sel",
    label: "Maradekaya Selatan",
    kecamatan: "makassar_kec",
    kota: "makassar",
  },
  // Ujung Pandang
  {
    value: "bulogading",
    label: "Bulogading",
    kecamatan: "ujung_pandang",
    kota: "makassar",
  },
  {
    value: "baru_up",
    label: "Baru",
    kecamatan: "ujung_pandang",
    kota: "makassar",
  },
  {
    value: "lae_lae",
    label: "Lae-Lae",
    kecamatan: "ujung_pandang",
    kota: "makassar",
  },
  {
    value: "losari",
    label: "Losari",
    kecamatan: "ujung_pandang",
    kota: "makassar",
  },
  {
    value: "maloku",
    label: "Maloku",
    kecamatan: "ujung_pandang",
    kota: "makassar",
  },
  {
    value: "pisang_selatan",
    label: "Pisang Selatan",
    kecamatan: "ujung_pandang",
    kota: "makassar",
  },
  // Wajo
  { value: "butung", label: "Butung", kecamatan: "wajo_kec", kota: "makassar" },
  {
    value: "ende_wajo",
    label: "Ende",
    kecamatan: "wajo_kec",
    kota: "makassar",
  },
  {
    value: "melayu_baru",
    label: "Melayu Baru",
    kecamatan: "wajo_kec",
    kota: "makassar",
  },
  { value: "melayu", label: "Melayu", kecamatan: "wajo_kec", kota: "makassar" },
  {
    value: "pattunuang",
    label: "Pattunuang",
    kecamatan: "wajo_kec",
    kota: "makassar",
  },
  // Bontoala
  {
    value: "bontoala_kel",
    label: "Bontoala",
    kecamatan: "bontoala",
    kota: "makassar",
  },
  {
    value: "bontoala_parang",
    label: "Bontoala Parang",
    kecamatan: "bontoala",
    kota: "makassar",
  },
  {
    value: "bunga_ejaya",
    label: "Bunga Ejaya",
    kecamatan: "bontoala",
    kota: "makassar",
  },
  {
    value: "gaddong",
    label: "Gaddong",
    kecamatan: "bontoala",
    kota: "makassar",
  },
  { value: "layang", label: "Layang", kecamatan: "bontoala", kota: "makassar" },
  // Ujung Tanah
  {
    value: "gusung_ut",
    label: "Gusung",
    kecamatan: "ujung_tanah",
    kota: "makassar",
  },
  {
    value: "pattingalloang",
    label: "Pattingalloang",
    kecamatan: "ujung_tanah",
    kota: "makassar",
  },
  {
    value: "tabaringan",
    label: "Tabaringan",
    kecamatan: "ujung_tanah",
    kota: "makassar",
  },
  {
    value: "totaka",
    label: "Totaka",
    kecamatan: "ujung_tanah",
    kota: "makassar",
  },
  // Kepulauan Sangkarrang
  {
    value: "barrang_lompo",
    label: "Barrang Lompo",
    kecamatan: "kep_sangkarrang",
    kota: "makassar",
  },
  {
    value: "barrang_caddi",
    label: "Barrang Caddi",
    kecamatan: "kep_sangkarrang",
    kota: "makassar",
  },
  {
    value: "kodingareng",
    label: "Kodingareng",
    kecamatan: "kep_sangkarrang",
    kota: "makassar",
  },
  {
    value: "sapuka",
    label: "Sapuka",
    kecamatan: "kep_sangkarrang",
    kota: "makassar",
  },
  // Tamalate
  {
    value: "balang_baru",
    label: "Balang Baru",
    kecamatan: "tamalate",
    kota: "makassar",
  },
  {
    value: "barombong_mksr",
    label: "Barombong",
    kecamatan: "tamalate",
    kota: "makassar",
  },
  {
    value: "jongaya",
    label: "Jongaya",
    kecamatan: "tamalate",
    kota: "makassar",
  },
  {
    value: "mangasa",
    label: "Mangasa",
    kecamatan: "tamalate",
    kota: "makassar",
  },
  {
    value: "mannuruki",
    label: "Mannuruki",
    kecamatan: "tamalate",
    kota: "makassar",
  },
  // Mariso
  {
    value: "kampung_buyang",
    label: "Kampung Buyang",
    kecamatan: "mariso",
    kota: "makassar",
  },
  { value: "lette", label: "Lette", kecamatan: "mariso", kota: "makassar" },
  {
    value: "mariso_kel",
    label: "Mariso",
    kecamatan: "mariso",
    kota: "makassar",
  },
  {
    value: "tamarunang_mksr",
    label: "Tamarunang",
    kecamatan: "mariso",
    kota: "makassar",
  },
  // Mamajang
  {
    value: "bontorannu",
    label: "Bontorannu",
    kecamatan: "mamajang",
    kota: "makassar",
  },
  {
    value: "karang_anyar",
    label: "Karang Anyar",
    kecamatan: "mamajang",
    kota: "makassar",
  },
  {
    value: "mamajang_dalam",
    label: "Mamajang Dalam",
    kecamatan: "mamajang",
    kota: "makassar",
  },
  {
    value: "mandala",
    label: "Mandala",
    kecamatan: "mamajang",
    kota: "makassar",
  },

  // ── Gowa — Somba Opu ──────────────────────────────────────────────────────
  {
    value: "kalegowa",
    label: "Kalegowa",
    kecamatan: "somba_opu",
    kota: "gowa",
  },
  {
    value: "tamarunang_gowa",
    label: "Tamarunang",
    kecamatan: "somba_opu",
    kota: "gowa",
  },
  {
    value: "romang_polong",
    label: "Romang Polong",
    kecamatan: "somba_opu",
    kota: "gowa",
  },
  { value: "samata", label: "Samata", kecamatan: "somba_opu", kota: "gowa" },
  {
    value: "paccinongang",
    label: "Paccinongang",
    kecamatan: "somba_opu",
    kota: "gowa",
  },
  {
    value: "katangka",
    label: "Katangka",
    kecamatan: "somba_opu",
    kota: "gowa",
  },
  // Pallangga
  {
    value: "pallangga_kel",
    label: "Pallangga",
    kecamatan: "pallangga",
    kota: "gowa",
  },
  {
    value: "bontoala_gowa",
    label: "Bontoala",
    kecamatan: "pallangga",
    kota: "gowa",
  },
  {
    value: "mangalli",
    label: "Mangalli",
    kecamatan: "pallangga",
    kota: "gowa",
  },
  {
    value: "julubori",
    label: "Julubori",
    kecamatan: "pallangga",
    kota: "gowa",
  },
  { value: "taeng", label: "Taeng", kecamatan: "pallangga", kota: "gowa" },
  // Bajeng
  {
    value: "kalebajeng",
    label: "Kalebajeng",
    kecamatan: "bajeng",
    kota: "gowa",
  },
  {
    value: "pabentengang",
    label: "Pabentengang",
    kecamatan: "bajeng",
    kota: "gowa",
  },
  {
    value: "bontosunggu",
    label: "Bontosunggu",
    kecamatan: "bajeng",
    kota: "gowa",
  },
  { value: "bone_gowa", label: "Bone", kecamatan: "bajeng", kota: "gowa" },
  // Bajeng Barat
  {
    value: "gentungan",
    label: "Gentungan",
    kecamatan: "bajeng_barat",
    kota: "gowa",
  },
  {
    value: "tanabangka",
    label: "Tanabangka",
    kecamatan: "bajeng_barat",
    kota: "gowa",
  },
  {
    value: "bontomanai_bb",
    label: "Bontomanai",
    kecamatan: "bajeng_barat",
    kota: "gowa",
  },
  // Bontonompo
  {
    value: "bontonompo_kel",
    label: "Bontonompo",
    kecamatan: "bontonompo",
    kota: "gowa",
  },
  {
    value: "tamallayang",
    label: "Tamallayang",
    kecamatan: "bontonompo",
    kota: "gowa",
  },
  {
    value: "romanglompoa",
    label: "Romanglompoa",
    kecamatan: "bontonompo",
    kota: "gowa",
  },
  // Bontonompo Selatan
  {
    value: "bontobiraeng",
    label: "Bontobiraeng",
    kecamatan: "bontonompo_selatan",
    kota: "gowa",
  },
  {
    value: "salajangki",
    label: "Salajangki",
    kecamatan: "bontonompo_selatan",
    kota: "gowa",
  },
  {
    value: "pabundukang",
    label: "Pa'bundukang",
    kecamatan: "bontonompo_selatan",
    kota: "gowa",
  },
  // Barombong
  {
    value: "biringkassi",
    label: "Biringkassi",
    kecamatan: "barombong",
    kota: "gowa",
  },
  {
    value: "tamanyeleng",
    label: "Tamanyeleng",
    kecamatan: "barombong",
    kota: "gowa",
  },
  { value: "kanjilo", label: "Kanjilo", kecamatan: "barombong", kota: "gowa" },
  // Pattallassang
  {
    value: "pattallassang_kel",
    label: "Pattallassang",
    kecamatan: "pattallassang",
    kota: "gowa",
  },
  {
    value: "panaikang_gowa",
    label: "Panaikang",
    kecamatan: "pattallassang",
    kota: "gowa",
  },
  {
    value: "sungguminasa",
    label: "Sungguminasa",
    kecamatan: "pattallassang",
    kota: "gowa",
  },
  // Parangloe
  { value: "lanna", label: "Lanna", kecamatan: "parangloe_gowa", kota: "gowa" },
  {
    value: "borisallo",
    label: "Borisallo",
    kecamatan: "parangloe_gowa",
    kota: "gowa",
  },
  {
    value: "bontoparang",
    label: "Bontoparang",
    kecamatan: "parangloe_gowa",
    kota: "gowa",
  },
  // Manuju
  { value: "manuju_kel", label: "Manuju", kecamatan: "manuju", kota: "gowa" },
  {
    value: "moncongloe_gowa",
    label: "Moncongloe",
    kecamatan: "manuju",
    kota: "gowa",
  },
  { value: "bilalang", label: "Bilalang", kecamatan: "manuju", kota: "gowa" },
  // Tinggimoncong
  {
    value: "malino",
    label: "Malino",
    kecamatan: "tinggimoncong",
    kota: "gowa",
  },
  {
    value: "pattapang",
    label: "Pattapang",
    kecamatan: "tinggimoncong",
    kota: "gowa",
  },
  {
    value: "bulutana",
    label: "Bulutana",
    kecamatan: "tinggimoncong",
    kota: "gowa",
  },
  // Tombolo Pao
  {
    value: "tamaona",
    label: "Tamaona",
    kecamatan: "tombolo_pao",
    kota: "gowa",
  },
  {
    value: "erelembang",
    label: "Erelembang",
    kecamatan: "tombolo_pao",
    kota: "gowa",
  },
  { value: "tonasa", label: "Tonasa", kecamatan: "tombolo_pao", kota: "gowa" },
  // Parigi
  { value: "sicini", label: "Sicini", kecamatan: "parigi_gowa", kota: "gowa" },
  {
    value: "manimbahoi",
    label: "Manimbahoi",
    kecamatan: "parigi_gowa",
    kota: "gowa",
  },
  // Bungaya
  { value: "sapaya", label: "Sapaya", kecamatan: "bungaya", kota: "gowa" },
  {
    value: "jenetallasa",
    label: "Je'netallasa",
    kecamatan: "bungaya",
    kota: "gowa",
  },
  // Bontolempangan
  {
    value: "bontolempangan_kel",
    label: "Bontolempangan",
    kecamatan: "bontolempangan",
    kota: "gowa",
  },
  {
    value: "ulujangang",
    label: "Ulujangang",
    kecamatan: "bontolempangan",
    kota: "gowa",
  },
  // Tompobulu (Gowa)
  {
    value: "rappolemba",
    label: "Rappolemba",
    kecamatan: "tompobulu_gowa",
    kota: "gowa",
  },
  {
    value: "garing",
    label: "Garing",
    kecamatan: "tompobulu_gowa",
    kota: "gowa",
  },
  // Biringbulu
  { value: "lauwa", label: "Lauwa", kecamatan: "biringbulu", kota: "gowa" },
  { value: "pencong", label: "Pencong", kecamatan: "biringbulu", kota: "gowa" },
  // Bontomarannu
  {
    value: "bontomanai_bm",
    label: "Bontomanai",
    kecamatan: "bontomarannu",
    kota: "gowa",
  },
  {
    value: "pakatto",
    label: "Pakatto",
    kecamatan: "bontomarannu",
    kota: "gowa",
  },
  {
    value: "nirannuang",
    label: "Nirannuang",
    kecamatan: "bontomarannu",
    kota: "gowa",
  },

  // ── Maros — Turikale ──────────────────────────────────────────────────────
  {
    value: "pettuadae",
    label: "Pettuadae",
    kecamatan: "turikale",
    kota: "maros",
  },
  {
    value: "adatongeng",
    label: "Adatongeng",
    kecamatan: "turikale",
    kota: "maros",
  },
  { value: "raya", label: "Raya", kecamatan: "turikale", kota: "maros" },
  { value: "taroada", label: "Taroada", kecamatan: "turikale", kota: "maros" },
  {
    value: "boribellaya",
    label: "Boribellaya",
    kecamatan: "turikale",
    kota: "maros",
  },
  // Maros Baru
  {
    value: "baju_bodoa",
    label: "Baju Bodoa",
    kecamatan: "maros_baru",
    kota: "maros",
  },
  {
    value: "mattirotasi",
    label: "Mattirotasi",
    kecamatan: "maros_baru",
    kota: "maros",
  },
  {
    value: "borimasunggu",
    label: "Borimasunggu",
    kecamatan: "maros_baru",
    kota: "maros",
  },
  // Lau
  {
    value: "bontolebang",
    label: "Bontolebang",
    kecamatan: "lau",
    kota: "maros",
  },
  {
    value: "mattiro_deceng",
    label: "Mattiro Deceng",
    kecamatan: "lau",
    kota: "maros",
  },
  { value: "marannu", label: "Marannu", kecamatan: "lau", kota: "maros" },
  // Bontoa
  {
    value: "tunikamaseang",
    label: "Tunikamaseang",
    kecamatan: "bontoa",
    kota: "maros",
  },
  {
    value: "pajukukang",
    label: "Pajukukang",
    kecamatan: "bontoa",
    kota: "maros",
  },
  {
    value: "bonto_bahari",
    label: "Bonto Bahari",
    kecamatan: "bontoa",
    kota: "maros",
  },
  // Mandai
  {
    value: "bontoa_mandai",
    label: "Bontoa",
    kecamatan: "mandai",
    kota: "maros",
  },
  {
    value: "hasanuddin",
    label: "Hasanuddin",
    kecamatan: "mandai",
    kota: "maros",
  },
  {
    value: "bonto_matene",
    label: "Bonto Matene",
    kecamatan: "mandai",
    kota: "maros",
  },
  // Moncongloe
  {
    value: "moncongloe_bulu",
    label: "Moncongloe Bulu",
    kecamatan: "moncongloe",
    kota: "maros",
  },
  {
    value: "moncongloe_lappara",
    label: "Moncongloe Lappara",
    kecamatan: "moncongloe",
    kota: "maros",
  },
  {
    value: "bonto_bunga",
    label: "Bonto Bunga",
    kecamatan: "moncongloe",
    kota: "maros",
  },
  // Marusu
  {
    value: "nisombalia",
    label: "Nisombalia",
    kecamatan: "marusu",
    kota: "maros",
  },
  {
    value: "temmappaduae",
    label: "Temmappaduae",
    kecamatan: "marusu",
    kota: "maros",
  },
  {
    value: "tellumpoccoe",
    label: "Tellumpoccoe",
    kecamatan: "marusu",
    kota: "maros",
  },
  // Simbang
  { value: "samangki", label: "Samangki", kecamatan: "simbang", kota: "maros" },
  { value: "tanete", label: "Tanete", kecamatan: "simbang", kota: "maros" },
  {
    value: "bonto_tallasa",
    label: "Bonto Tallasa",
    kecamatan: "simbang",
    kota: "maros",
  },
  // Tanralili
  { value: "allaere", label: "Allaere", kecamatan: "tanralili", kota: "maros" },
  {
    value: "toddopulia",
    label: "Toddopulia",
    kecamatan: "tanralili",
    kota: "maros",
  },
  {
    value: "kurusumange",
    label: "Kurusumange",
    kecamatan: "tanralili",
    kota: "maros",
  },
  // Tompobulu (Maros)
  {
    value: "pucak",
    label: "Pucak",
    kecamatan: "tompobulu_maros",
    kota: "maros",
  },
  {
    value: "toddolimae",
    label: "Toddolimae",
    kecamatan: "tompobulu_maros",
    kota: "maros",
  },
  {
    value: "benteng_gajah",
    label: "Benteng Gajah",
    kecamatan: "tompobulu_maros",
    kota: "maros",
  },
  // Cenrana
  { value: "labuaja", label: "Labuaja", kecamatan: "cenrana", kota: "maros" },
  {
    value: "cenrana_baru",
    label: "Cenrana Baru",
    kecamatan: "cenrana",
    kota: "maros",
  },
  {
    value: "limapoccoe",
    label: "Limapoccoe",
    kecamatan: "cenrana",
    kota: "maros",
  },
  // Mallawa
  {
    value: "batu_putih",
    label: "Batu Putih",
    kecamatan: "mallawa",
    kota: "maros",
  },
  { value: "samaenre", label: "Samaenre", kecamatan: "mallawa", kota: "maros" },
  {
    value: "tellumpanua",
    label: "Tellumpanua",
    kecamatan: "mallawa",
    kota: "maros",
  },
  // Bantimurung
  {
    value: "kalabbirang",
    label: "Kalabbirang",
    kecamatan: "bantimurung",
    kota: "maros",
  },
  {
    value: "minasa_baji",
    label: "Minasa Baji",
    kecamatan: "bantimurung",
    kota: "maros",
  },
  {
    value: "tukamasea",
    label: "Tukamasea",
    kecamatan: "bantimurung",
    kota: "maros",
  },
  // Camba
  {
    value: "pattanyamang",
    label: "Pattanyamang",
    kecamatan: "camba",
    kota: "maros",
  },
  { value: "timpuseng", label: "Timpuseng", kecamatan: "camba", kota: "maros" },
  { value: "sawaru", label: "Sawaru", kecamatan: "camba", kota: "maros" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API — Sprint 3: replace bodies dengan Supabase query
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ambil semua kota/kabupaten.
 * Sprint 3: return await supabase.from('ref_kota').select('*').order('nama')
 */
export function getKotaList(): KotaOption[] {
  return KOTA_LIST;
}

/**
 * Ambil kecamatan berdasarkan kota.
 * Sprint 3: return await supabase.from('ref_kecamatan').select('*').eq('kota_id', kotaId).order('nama')
 */
export function getKecamatanByKota(kota: string): KecamatanOption[] {
  return KECAMATAN_LIST.filter((k) => k.kota === kota);
}

/**
 * Ambil kelurahan berdasarkan kecamatan.
 * Sprint 3: return await supabase.from('ref_kelurahan').select('*').eq('kecamatan_id', kecamatanId).order('nama')
 */
export function getKelurahanByKecamatan(kecamatan: string): KelurahanOption[] {
  return KELURAHAN_LIST.filter((k) => k.kecamatan === kecamatan);
}
