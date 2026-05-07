// src/components/sections/ContactFormSection.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useInView } from "@/hooks/useInView";
import { PACKAGES } from "./ContactPackagesSection";

// ─────────────────────────────────────────────────────────────────────────────
// T2.4 — Validation regex constants
//
// Didefinisikan di module scope (bukan dalam komponen) agar tidak
// di-recreate setiap render.
// ─────────────────────────────────────────────────────────────────────────────

// Format email dasar: ada karakter @ dengan domain dan TLD
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Format nomor HP Indonesia: 08xx / +628xx / 628xx, 10–13 digit
const PHONE_RE = /^(\+62|62|0)8[0-9]{8,11}$/;

// ─────────────────────────────────────────────────────────────────────────────
// Static options
// ─────────────────────────────────────────────────────────────────────────────

const JENIS_USAHA_OPTIONS = [
  "Cafe / Coffee Shop",
  "Restoran",
  "Hotel / Penginapan",
  "Catering",
  "Kantor / Perusahaan",
  "Lainnya",
];

const VOLUME_OPTIONS = [
  "< 1 kg / hari",
  "1 – 5 kg / hari",
  "5 – 10 kg / hari",
  "> 10 kg / hari",
];

// ─────────────────────────────────────────────────────────────────────────────
// Data layer — Supabase-ready mock
// Sprint 3: swap dua baris mock per fungsi dengan Supabase client call
// ─────────────────────────────────────────────────────────────────────────────

import {
  insertPartnerApplication,
  insertContactMessage,
  fetchKotaList,
  fetchKecamatanByKota,
  fetchKelurahanByKecamatan,
  type LokasiOption,
} from "@/lib/supabase-contact";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FormMode = null | "partner" | "general";

interface PartnerForm {
  type: "kontributor" | "dampak" | "strategis" | "";
  pic: string;
  organization: string;
  phone: string;
  email: string;
  jenisUsaha: string;
  volumeLimbah: string;
  kota: string;
  kotaCustom: string;
  kecamatan: string;
  kelurahan: string;
  alamat: string;
  message: string;
}

interface GeneralForm {
  name: string;
  phone: string;
  message: string;
}

const EMPTY_PARTNER: PartnerForm = {
  type: "",
  pic: "",
  organization: "",
  phone: "",
  email: "",
  jenisUsaha: "",
  volumeLimbah: "",
  kota: "",
  kotaCustom: "",
  kecamatan: "",
  kelurahan: "",
  alamat: "",
  message: "",
};
const EMPTY_GENERAL: GeneralForm = { name: "", phone: "", message: "" };

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-default)",
  color: "var(--text-primary)",
  borderRadius: "10px",
  padding: "0.8rem 1rem",
  fontSize: "0.9rem",
  width: "100%",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  // Sprint 1 T1.3: outline dihapus — focus ring ditangani globals.css :focus-visible
};

const selectBase: React.CSSProperties = {
  ...inputBase,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5a4a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 1rem center",
  paddingRight: "2.5rem",
};

const selectDisabled: React.CSSProperties = {
  ...selectBase,
  opacity: 0.45,
  cursor: "not-allowed",
};

function Label({
  children,
  htmlFor,
  optional,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: "block",
        fontFamily: "var(--font-space-mono), monospace",
        fontSize: "0.62rem",
        letterSpacing: "0.15em",
        textTransform: "uppercase" as const,
        color: "var(--text-muted)",
        marginBottom: "0.45rem",
      }}
    >
      {children}
      {optional && (
        <span
          style={{
            color: "var(--border-strong)",
            marginLeft: "0.5rem",
            fontSize: "0.55rem",
          }}
        >
          opsional
        </span>
      )}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p
      role="alert"
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: "0.6rem",
        color: "var(--color-error)",
        marginTop: "0.3rem",
      }}
    >
      {msg}
    </p>
  );
}

function SubmitError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4"
      style={{
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.22)",
      }}
    >
      <i
        className="fas fa-exclamation-circle text-[0.78rem] flex-shrink-0"
        style={{ color: "var(--color-error)" }}
      />
      <p
        className="text-[0.85rem] leading-snug"
        style={{ color: "var(--color-error)" }}
      >
        {msg}
      </p>
    </div>
  );
}

function GroupHeading({
  num,
  label,
  isNew,
}: {
  num: string;
  label: string;
  isNew?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[0.62rem] font-semibold flex-shrink-0"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          color: "var(--text-muted)",
        }}
      >
        {num}
      </span>
      <span
        className="font-mono text-[0.68rem] tracking-[0.14em] uppercase font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      {isNew && (
        <span
          className="font-mono text-[0.55rem] tracking-[0.1em] uppercase px-2 py-0.5 rounded-pill"
          style={{
            background: "rgba(200,168,75,0.15)",
            color: "var(--gold)",
            border: "1px solid rgba(200,168,75,0.25)",
          }}
        >
          Baru
        </span>
      )}
    </div>
  );
}

function SectionDivider() {
  return (
    <div
      className="my-7"
      style={{ height: "1px", background: "var(--border-subtle)" }}
    />
  );
}

// T2.1 — BackButton sebagai komponen terpisah dengan state hover lokal.
// Menggantikan onMouseEnter/Leave DOM manipulation di kedua form.
function BackButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Kembali ke menu"
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
      style={{
        border: hovered
          ? "1px solid var(--border-strong)"
          : "1px solid var(--border-default)",
        color: hovered ? "var(--text-primary)" : "var(--text-muted)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <i className="fas fa-arrow-left text-[0.7rem]" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Option Selector — T2.1: state-driven hover
// ─────────────────────────────────────────────────────────────────────────────
function OptionSelector({
  onSelect,
  inView,
}: {
  onSelect: (m: FormMode) => void;
  inView: boolean;
}) {
  // T2.1 — hoveredMode mengontrol semua style card via conditional expression.
  // Tidak ada onMouseEnter yang langsung mutasi DOM.
  const [hoveredMode, setHoveredMode] = useState<FormMode>(null);

  const OPTIONS = [
    {
      mode: "partner" as FormMode,
      icon: "fa-handshake",
      // T3.3 Sprint 3: label konsistensi bahasa (diganti dari "Be a Partner")
      label: "Be a Partner",
      sublabel: "Bergabung sebagai Mitra Rebru",
      desc: "Daftarkan kafe atau bisnis kamu untuk berkontribusi dalam ekosistem circular economy Rebru.",
      accent: "var(--forest-sage)",
      hex: "#7aab7e",
    },
    {
      mode: "general" as FormMode,
      icon: "fa-comment-dots",
      label: "Kritik & Saran",
      sublabel: "Kirim pesan atau pertanyaan",
      desc: "Sampaikan kritik, saran, pertanyaan umum, atau sekadar menyapa tim Rebru.",
      accent: "var(--coffee-latte)",
      hex: "#c4956a",
    },
  ];

  return (
    <div className="max-w-[760px] mx-auto">
      <p
        className={`text-center text-[0.92rem] leading-[1.9] mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ color: "var(--text-muted)", transitionDelay: "120ms" }}
      >
        Pilih salah satu untuk melanjutkan
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {OPTIONS.map((opt, i) => {
          const isHovered = hoveredMode === opt.mode;
          return (
            <button
              key={opt.mode}
              onClick={() => onSelect(opt.mode)}
              className={`text-left rounded-xl p-9 flex flex-col gap-6 transition-all duration-300 ${inView ? "opacity-100" : "opacity-0 translate-y-8"}`}
              style={{
                background: isHovered ? `${opt.hex}0f` : `${opt.hex}0a`,
                border: isHovered
                  ? `1px solid ${opt.hex}60`
                  : `1px solid ${opt.hex}38`,
                boxShadow: isHovered ? `0 12px 40px ${opt.hex}18` : "none",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                transitionDelay: `${200 + i * 120}ms`,
              }}
              onMouseEnter={() => setHoveredMode(opt.mode)}
              onMouseLeave={() => setHoveredMode(null)}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                style={{
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                  background: `${opt.hex}18`,
                  border: `1px solid ${opt.hex}38`,
                }}
              >
                <i
                  className={`fas ${opt.icon} text-[1.1rem]`}
                  style={{ color: opt.accent }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <p
                    className="font-display font-semibold text-[1.55rem] leading-tight mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {opt.label}
                  </p>
                  <p
                    className="font-mono text-[0.62rem] tracking-[0.15em] uppercase"
                    style={{ color: opt.accent }}
                  >
                    {opt.sublabel}
                  </p>
                </div>
                <p
                  className="text-[0.88rem] leading-[1.8]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {opt.desc}
                </p>
              </div>
              <div
                className="flex items-center font-mono text-[0.7rem] tracking-[0.12em] uppercase mt-auto transition-all duration-300"
                style={{
                  color: opt.accent,
                  gap: isHovered ? "0.75rem" : "0.5rem",
                }}
              >
                Mulai <i className="fas fa-arrow-right text-[0.6rem]" />
              </div>
            </button>
          );
        })}
      </div>

      <div
        className={`mt-10 flex items-center justify-center gap-6 flex-wrap transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{ transitionDelay: "480ms" }}
      >
        <span
          className="font-mono text-[0.62rem] tracking-[0.15em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Atau hubungi langsung
        </span>
        <a
          href="https://wa.me/6285237390994"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-[0.72rem] tracking-[0.08em]"
          style={{ color: "var(--forest-sage)" }}
        >
          <i className="fab fa-whatsapp" /> +62 852-3739-0994
        </a>
        <a
          href="mailto:rebruid@gmail.com"
          className="inline-flex items-center gap-2 font-mono text-[0.72rem] tracking-[0.08em]"
          style={{ color: "var(--text-secondary)" }}
        >
          <i className="fas fa-envelope text-[0.75rem]" /> rebruid@gmail.com
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PartnershipForm — T2.3 onBlur + T2.4 useMemo & regex
// ─────────────────────────────────────────────────────────────────────────────
function PartnershipForm({
  onBack,
  preSelected,
}: {
  onBack: () => void;
  preSelected: string;
}) {
  const [form, setForm] = useState<PartnerForm>({
    ...EMPTY_PARTNER,
    type: preSelected as PartnerForm["type"],
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof PartnerForm, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (preSelected)
      setForm((p) => ({ ...p, type: preSelected as PartnerForm["type"] }));
  }, [preSelected]);

  // T2.4 — useMemo: location lists tidak re-compute setiap keystroke user
  // BENAR ✅ — satu blok, tidak ada line break yang salah
  const [kotaList, setKotaList] = useState;
  {
    value: string;
    label: string;
    aktif: boolean;
  }
  [] > [];

  const [kecamatanList, setKecamatanList] = useState;
  {
    value: string;
    label: string;
  }
  [] > [];

  const [kelurahanList, setKelurahanList] = useState;
  {
    value: string;
    label: string;
  }
  [] > [];

  // Load kota saat komponen mount
  useEffect(() => {
    fetchKotaList().then(setKotaList);
  }, []);

  // Load kecamatan saat kota berubah
  useEffect(() => {
    if (!form.kota || form.kota === "Lainnya") {
      setKecamatanList([]);
      return;
    }
    fetchKecamatanByKota(form.kota).then(setKecamatanList);
  }, [form.kota]);

  // Load kelurahan saat kecamatan berubah
  useEffect(() => {
    if (!form.kecamatan || !form.kota) {
      setKelurahanList([]);
      return;
    }
    fetchKelurahanByKecamatan(form.kecamatan, form.kota).then(setKelurahanList);
  }, [form.kecamatan, form.kota]);
  const isKotaAktif = useMemo(
    () => kotaList.find((k) => k.value === form.kota)?.aktif ?? false,
    [kotaList, form.kota],
  );

  const isKotaLain = form.kota === "lain";
  const kotaLabel = useMemo(
    () => kotaList.find((k) => k.value === form.kota)?.label ?? "",
    [kotaList, form.kota],
  );
  const kecamatanLabel = useMemo(
    () => kecamatanList.find((k) => k.value === form.kecamatan)?.label ?? "",
    [kecamatanList, form.kecamatan],
  );
  const kelurahanLabel = useMemo(
    () => kelurahanList.find((k) => k.value === form.kelurahan)?.label ?? "",
    [kelurahanList, form.kelurahan],
  );

  const set = (k: keyof PartnerForm, v: string) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "kota") {
        next.kecamatan = "";
        next.kelurahan = "";
      }
      if (k === "kecamatan") {
        next.kelurahan = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  // T2.3 — Validasi per field, dipanggil onBlur.
  // Merge ke errors sehingga field lain tidak ter-reset.
  const validateField = (key: keyof PartnerForm) => {
    const v = form[key] as string;
    let msg: string | undefined;
    switch (key) {
      case "type":
        if (!v) msg = "Pilih skema kemitraan";
        break;
      case "pic":
        if (!v.trim()) msg = "Nama penanggung jawab wajib diisi";
        break;
      case "organization":
        if (!v.trim()) msg = "Nama kafe/bisnis wajib diisi";
        break;
      case "phone":
        if (!v.trim()) msg = "Nomor WhatsApp wajib diisi";
        else if (!PHONE_RE.test(v.replace(/[\s-]/g, "")))
          msg = "Format tidak valid (contoh: 08xx atau +628xx)";
        break;
      case "email":
        if (!v.trim()) msg = "Email wajib diisi";
        else if (!EMAIL_RE.test(v)) msg = "Format email tidak valid";
        break;
      case "jenisUsaha":
        if (!v) msg = "Jenis usaha wajib dipilih";
        break;
      case "volumeLimbah":
        if (!v) msg = "Estimasi volume wajib dipilih";
        break;
      case "kota":
        if (!v) msg = "Kota wajib dipilih";
        break;
      case "kotaCustom":
        if (isKotaLain && !v.trim()) msg = "Isi nama kota";
        break;
      case "kecamatan":
        if (!isKotaLain && isKotaAktif && !v) msg = "Kecamatan wajib dipilih";
        break;
      case "kelurahan":
        if (!isKotaLain && isKotaAktif && kecamatanList.length > 0 && !v)
          msg = "Kelurahan wajib dipilih";
        break;
      case "alamat":
        if (!v.trim()) msg = "Alamat lengkap wajib diisi";
        break;
    }
    setErrors((prev) => ({ ...prev, [key]: msg }));
  };

  // validateAll: dipakai saat submit — jalankan semua field sekaligus
  const validateAll = (): boolean => {
    const e: Partial<Record<keyof PartnerForm, string>> = {};
    const addIf = (k: keyof PartnerForm, cond: boolean, msg: string) => {
      if (cond) e[k] = msg;
    };

    addIf("type", !form.type, "Pilih skema kemitraan");
    addIf("pic", !form.pic.trim(), "Nama penanggung jawab wajib diisi");
    addIf(
      "organization",
      !form.organization.trim(),
      "Nama kafe/bisnis wajib diisi",
    );
    addIf("phone", !form.phone.trim(), "Nomor WhatsApp wajib diisi");
    if (form.phone.trim() && !PHONE_RE.test(form.phone.replace(/[\s-]/g, "")))
      e.phone = "Format tidak valid (contoh: 08xx atau +628xx)";
    addIf("email", !form.email.trim(), "Email wajib diisi");
    if (form.email.trim() && !EMAIL_RE.test(form.email))
      e.email = "Format email tidak valid";
    addIf("jenisUsaha", !form.jenisUsaha, "Jenis usaha wajib dipilih");
    addIf("volumeLimbah", !form.volumeLimbah, "Estimasi volume wajib dipilih");
    addIf("kota", !form.kota, "Kota wajib dipilih");
    addIf("kotaCustom", isKotaLain && !form.kotaCustom.trim(), "Isi nama kota");
    addIf(
      "kecamatan",
      !isKotaLain && isKotaAktif && !form.kecamatan,
      "Kecamatan wajib dipilih",
    );
    addIf(
      "kelurahan",
      !isKotaLain && isKotaAktif && kecamatanList.length > 0 && !form.kelurahan,
      "Kelurahan wajib dipilih",
    );
    addIf("alamat", !form.alamat.trim(), "Alamat lengkap wajib diisi");

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const { error } = await insertPartnerApplication(form);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("[PartnershipForm] submit error:", err);
      setSubmitError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-[520px] mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-7"
          style={{
            background: "rgba(45,90,46,0.15)",
            border: "1px solid rgba(122,171,126,0.3)",
          }}
        >
          <i
            className="fas fa-check text-[1.8rem]"
            style={{ color: "var(--forest-sage)" }}
          />
        </div>
        <h3
          className="font-display font-semibold text-[1.8rem] mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Pendaftaran Diterima!
        </h3>
        <p
          className="text-[0.92rem] leading-[1.85] mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Data kamu sudah kami catat. Tim Rebru akan menghubungi via WhatsApp
          dalam 1×24 jam.
        </p>
        <span
          className="font-mono text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1.5 rounded-pill mb-8"
          style={{
            background: "rgba(45,90,46,0.15)",
            color: "var(--forest-sage)",
            border: "1px solid rgba(122,171,126,0.25)",
          }}
        >
          Status: Pending Review
        </span>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm(EMPTY_PARTNER);
            onBack();
          }}
          className="font-mono text-[0.7rem] tracking-[0.12em] uppercase px-5 py-2.5 rounded-pill"
          style={{
            border: "1px solid var(--border-default)",
            color: "var(--text-muted)",
          }}
        >
          Kembali ke Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <BackButton onClick={onBack} />
        <div>
          <h3
            className="font-display font-semibold text-[1.5rem]"
            style={{ color: "var(--text-primary)" }}
          >
            Jadikan Mitra
          </h3>
          <p
            className="font-mono text-[0.62rem] tracking-[0.12em] uppercase"
            style={{ color: "var(--forest-sage)" }}
          >
            Bergabung sebagai Mitra Rebru
          </p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="flex flex-col gap-0">
          {/* 1 — Skema */}
          <GroupHeading num="1" label="Skema kemitraan" />
          <div className="flex flex-col gap-2 mb-2">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => set("type", pkg.id)}
                onBlur={() => validateField("type")}
                className="flex items-center justify-between px-5 py-4 rounded-lg text-left transition-all duration-200"
                style={{
                  background:
                    form.type === pkg.id ? pkg.accentBg : "var(--bg-card)",
                  border:
                    form.type === pkg.id
                      ? `1.5px solid ${pkg.accentBorder}`
                      : "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-200"
                    style={{
                      background:
                        form.type === pkg.id
                          ? pkg.accent
                          : "var(--border-strong)",
                    }}
                  />
                  <div>
                    <p
                      className="text-[0.92rem] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {pkg.tier}
                    </p>
                    <p
                      className="font-mono text-[0.58rem] tracking-[0.08em] mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {pkg.tagline}
                    </p>
                  </div>
                </div>
                <span
                  className="font-mono text-[0.68rem] tracking-[0.08em] uppercase flex-shrink-0 ml-3"
                  style={{ color: pkg.accent }}
                >
                  {pkg.badge}
                </span>
              </button>
            ))}
          </div>
          <FieldError msg={errors.type} />

          <SectionDivider />

          {/* 2 — Penanggung jawab */}
          <GroupHeading num="2" label="Penanggung jawab" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="partner-pic">Penanggung Jawab (PIC) *</Label>
              <input
                id="partner-pic"
                type="text"
                value={form.pic}
                onChange={(e) => set("pic", e.target.value)}
                onBlur={() => validateField("pic")}
                placeholder="Nama PIC atau pemilik kafe"
                style={inputBase}
              />
              <FieldError msg={errors.pic} />
            </div>
            <div>
              <Label htmlFor="partner-org">Nama Kafe / Bisnis *</Label>
              <input
                id="partner-org"
                type="text"
                value={form.organization}
                onChange={(e) => set("organization", e.target.value)}
                onBlur={() => validateField("organization")}
                placeholder="Nama usaha atau organisasi"
                style={inputBase}
              />
              <FieldError msg={errors.organization} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partner-phone">Nomor WhatsApp *</Label>
              <input
                id="partner-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => validateField("phone")}
                placeholder="+62 812 xxxx xxxx"
                style={inputBase}
              />
              <FieldError msg={errors.phone} />
            </div>
            <div>
              <Label htmlFor="partner-email">Email *</Label>
              <input
                id="partner-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => validateField("email")}
                placeholder="nama@bisnis.com"
                style={inputBase}
              />
              <FieldError msg={errors.email} />
            </div>
          </div>

          <SectionDivider />

          {/* 3 — Profil Bisnis */}
          <GroupHeading num="3" label="Profil bisnis" isNew />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partner-jenis-usaha">Jenis Usaha *</Label>
              <select
                id="partner-jenis-usaha"
                value={form.jenisUsaha}
                onChange={(e) => set("jenisUsaha", e.target.value)}
                onBlur={() => validateField("jenisUsaha")}
                style={selectBase}
              >
                <option value="" disabled>
                  Pilih jenis usaha...
                </option>
                {JENIS_USAHA_OPTIONS.map((opt) => (
                  <option
                    key={opt}
                    value={opt}
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {opt}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.jenisUsaha} />
            </div>
            <div>
              <Label htmlFor="partner-volume">
                Estimasi Volume Limbah / Hari *
              </Label>
              <select
                id="partner-volume"
                value={form.volumeLimbah}
                onChange={(e) => set("volumeLimbah", e.target.value)}
                onBlur={() => validateField("volumeLimbah")}
                style={selectBase}
              >
                <option value="" disabled>
                  Pilih estimasi...
                </option>
                {VOLUME_OPTIONS.map((opt) => (
                  <option
                    key={opt}
                    value={opt}
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {opt}
                  </option>
                ))}
              </select>
              <p
                className="font-mono text-[0.58rem] tracking-[0.08em] mt-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Untuk perencanaan penjemputan & kapasitas produksi
              </p>
              <FieldError msg={errors.volumeLimbah} />
            </div>
          </div>

          <SectionDivider />

          {/* 4 — Lokasi */}
          <GroupHeading num="4" label="Lokasi usaha" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="partner-kota">Kota / Kabupaten *</Label>
              <select
                id="partner-kota"
                value={form.kota}
                onChange={(e) => set("kota", e.target.value)}
                onBlur={() => validateField("kota")}
                style={selectBase}
              >
                <option value="" disabled>
                  Pilih kota...
                </option>
                {kotaList.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={!opt.aktif}
                    style={{
                      background: "var(--bg-surface)",
                      color: opt.aktif
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    }}
                  >
                    {opt.label}
                    {!opt.aktif ? " (segera)" : ""}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.kota} />
            </div>

            <div>
              <Label htmlFor="partner-kecamatan">Kecamatan *</Label>
              {isKotaLain || !isKotaAktif || kecamatanList.length === 0 ? (
                <input
                  id="partner-kecamatan"
                  type="text"
                  value={form.kecamatan}
                  onChange={(e) => set("kecamatan", e.target.value)}
                  onBlur={() => validateField("kecamatan")}
                  placeholder={
                    !form.kota ? "Pilih kota dulu" : "Nama kecamatan"
                  }
                  disabled={!form.kota}
                  style={{ ...inputBase, opacity: !form.kota ? 0.45 : 1 }}
                />
              ) : (
                <select
                  id="partner-kecamatan"
                  value={form.kecamatan}
                  onChange={(e) => set("kecamatan", e.target.value)}
                  onBlur={() => validateField("kecamatan")}
                  disabled={!form.kota}
                  style={form.kota ? selectBase : selectDisabled}
                >
                  <option value="" disabled>
                    Pilih kecamatan...
                  </option>
                  {kecamatanList.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{
                        background: "var(--bg-surface)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              <FieldError msg={errors.kecamatan} />
            </div>

            <div>
              <Label htmlFor="partner-kelurahan">Kelurahan *</Label>
              {isKotaLain || !isKotaAktif || kelurahanList.length === 0 ? (
                <input
                  id="partner-kelurahan"
                  type="text"
                  value={form.kelurahan}
                  onChange={(e) => set("kelurahan", e.target.value)}
                  onBlur={() => validateField("kelurahan")}
                  placeholder={
                    !form.kecamatan ? "Pilih kecamatan dulu" : "Nama kelurahan"
                  }
                  disabled={!form.kecamatan}
                  style={{ ...inputBase, opacity: !form.kecamatan ? 0.45 : 1 }}
                />
              ) : (
                <select
                  id="partner-kelurahan"
                  value={form.kelurahan}
                  onChange={(e) => set("kelurahan", e.target.value)}
                  onBlur={() => validateField("kelurahan")}
                  disabled={!form.kecamatan}
                  style={form.kecamatan ? selectBase : selectDisabled}
                >
                  <option value="" disabled>
                    Pilih kelurahan...
                  </option>
                  {kelurahanList.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      style={{
                        background: "var(--bg-surface)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              <FieldError msg={errors.kelurahan} />
            </div>
          </div>

          {isKotaLain && (
            <div className="mb-4">
              <Label htmlFor="partner-kota-custom">
                Nama Kota / Kabupaten *
              </Label>
              <input
                id="partner-kota-custom"
                type="text"
                value={form.kotaCustom}
                onChange={(e) => set("kotaCustom", e.target.value)}
                onBlur={() => validateField("kotaCustom")}
                placeholder="Contoh: Parepare, Bone, Palopo..."
                style={inputBase}
              />
              <FieldError msg={errors.kotaCustom} />
            </div>
          )}

          {form.kota && !isKotaAktif && !isKotaLain && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-md mb-4"
              style={{
                background: "rgba(200,168,75,0.08)",
                border: "1px solid rgba(200,168,75,0.22)",
              }}
            >
              <i
                className="fas fa-info-circle text-[0.75rem]"
                style={{ color: "var(--gold)" }}
              />
              <p
                className="font-mono text-[0.62rem] tracking-[0.1em]"
                style={{ color: "var(--gold)" }}
              >
                Data kecamatan & kelurahan untuk wilayah ini akan tersedia
                segera. Isi manual di atas.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="partner-alamat">Alamat Lengkap *</Label>
            <input
              id="partner-alamat"
              type="text"
              value={form.alamat}
              onChange={(e) => set("alamat", e.target.value)}
              onBlur={() => validateField("alamat")}
              placeholder="Jl. Nama Jalan No. xx, RT/RW xx/xx"
              style={inputBase}
            />
            <FieldError msg={errors.alamat} />
          </div>

          <SectionDivider />

          {/* 5 — Catatan */}
          <GroupHeading num="5" label="Catatan tambahan" />
          <textarea
            id="partner-message"
            aria-label="Catatan tambahan (opsional)"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Informasi lain yang ingin kamu sampaikan kepada tim Rebru..."
            rows={4}
            style={{ ...inputBase, resize: "vertical", lineHeight: "1.7" }}
          />

          <div className="mt-8">
            <SubmitError msg={submitError} />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-pill font-mono text-[0.78rem] tracking-[0.1em] uppercase transition-all duration-300"
              style={{
                background:
                  "linear-gradient(135deg, var(--forest-moss), var(--forest-dark))",
                border: "1px solid rgba(74,124,78,0.4)",
                color: "#f5efe6",
                boxShadow: "0 4px 20px rgba(45,90,46,0.2)",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin" /> Mengirim...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" /> Kirim Pendaftaran
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GeneralContactForm — T2.3 onBlur + T2.4 phone regex
// ─────────────────────────────────────────────────────────────────────────────
function GeneralContactForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState<GeneralForm>(EMPTY_GENERAL);
  const [errors, setErrors] = useState<
    Partial<Record<keyof GeneralForm, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (k: keyof GeneralForm, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validateField = (key: keyof GeneralForm) => {
    let msg: string | undefined;
    switch (key) {
      case "name":
        if (!form.name.trim()) msg = "Nama wajib diisi";
        break;
      case "phone":
        if (
          form.phone.trim() &&
          !PHONE_RE.test(form.phone.replace(/[\s-]/g, ""))
        )
          msg = "Format nomor tidak valid";
        break;
      case "message":
        if (!form.message.trim()) msg = "Pesan wajib diisi";
        break;
    }
    setErrors((p) => ({ ...p, [key]: msg }));
  };

  const validateAll = () => {
    const e: Partial<Record<keyof GeneralForm, string>> = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (form.phone.trim() && !PHONE_RE.test(form.phone.replace(/[\s-]/g, "")))
      e.phone = "Format nomor tidak valid";
    if (!form.message.trim()) e.message = "Pesan wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const { error } = await insertContactMessage(form);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("[GeneralContactForm] submit error:", err);
      setSubmitError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-[520px] mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-7"
          style={{
            background: "rgba(196,149,106,0.15)",
            border: "1px solid rgba(196,149,106,0.3)",
          }}
        >
          <i
            className="fas fa-check text-[1.8rem]"
            style={{ color: "var(--coffee-latte)" }}
          />
        </div>
        <h3
          className="font-display font-semibold text-[1.8rem] mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Pesan Terkirim!
        </h3>
        <p
          className="text-[0.92rem] leading-[1.85] mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          Terima kasih sudah menghubungi kami. Kami akan segera merespons
          pesanmu.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm(EMPTY_GENERAL);
            onBack();
          }}
          className="font-mono text-[0.7rem] tracking-[0.12em] uppercase px-5 py-2.5 rounded-pill"
          style={{
            border: "1px solid var(--border-default)",
            color: "var(--text-muted)",
          }}
        >
          Kembali ke Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[560px] mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <BackButton onClick={onBack} />
        <div>
          <h3
            className="font-display font-semibold text-[1.5rem]"
            style={{ color: "var(--text-primary)" }}
          >
            Kritik &amp; Saran
          </h3>
          <p
            className="font-mono text-[0.62rem] tracking-[0.12em] uppercase"
            style={{ color: "var(--coffee-latte)" }}
          >
            Kirim pesan atau pertanyaan
          </p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="general-name">Nama *</Label>
            <input
              id="general-name"
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => validateField("name")}
              placeholder="Nama kamu"
              style={inputBase}
            />
            <FieldError msg={errors.name} />
          </div>
          <div>
            <Label htmlFor="general-phone" optional>
              WhatsApp / Telepon
            </Label>
            <input
              id="general-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => validateField("phone")}
              placeholder="+62 812 xxxx xxxx"
              style={inputBase}
            />
            <FieldError msg={errors.phone} />
          </div>
          <div>
            <Label htmlFor="general-message">Pesan *</Label>
            <textarea
              id="general-message"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              onBlur={() => validateField("message")}
              placeholder="Kritik, saran, pertanyaan, atau sekadar menyapa..."
              rows={6}
              style={{ ...inputBase, resize: "vertical", lineHeight: "1.7" }}
            />
            <FieldError msg={errors.message} />
          </div>

          <SubmitError msg={submitError} />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-pill font-mono text-[0.78rem] tracking-[0.1em] uppercase transition-all duration-300"
            style={{
              background:
                "linear-gradient(135deg, var(--coffee-warm), var(--coffee-mid))",
              border: "1px solid var(--border-strong)",
              color: "#f5efe6",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-circle-notch fa-spin" /> Mengirim...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane" /> Kirim Pesan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContactFormSectionInner
//
// T2.2 — useSearchParams() membaca ?package= dari URL yang ditulis
// ContactPackagesSection via router.push("/contact?package=id").
//
// Keunggulan vs window.CustomEvent (sebelumnya):
//   • /contact?package=dampak bisa dishare dan langsung buka form pre-selected
//   • State visible di URL bar → mudah di-debug
//   • Testable tanpa mock window object
//   • Tidak ada global side effect di luar React tree
// ─────────────────────────────────────────────────────────────────────────────
function ContactFormSectionInner() {
  const { ref, inView } = useInView(0.06);
  const searchParams = useSearchParams();
  const packageParam = searchParams.get("package") ?? "";

  const [mode, setMode] = useState<FormMode>(packageParam ? "partner" : null);
  const [visible, setVisible] = useState<FormMode>(
    packageParam ? "partner" : null,
  );
  const [preSelected, setPreSelected] = useState(packageParam);

  // Sync bila URL berubah (mis. navigasi ke /contact?package=strategis)
  useEffect(() => {
    if (packageParam) {
      setPreSelected(packageParam);
      setMode("partner");
      setVisible("partner");
    }
  }, [packageParam]);

  const handleSelect = (selected: FormMode) => {
    setMode(null);
    setTimeout(() => {
      setVisible(selected);
      setMode(selected);
    }, 280);
  };

  const handleBack = () => {
    setMode(null);
    setTimeout(() => {
      setVisible(null);
      setMode(null);
      setPreSelected("");
    }, 280);
  };

  return (
    <section
      id="partnership-form"
      className="relative py-24 px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="absolute top-0 left-12 right-12 h-px"
        style={{ background: "var(--impact-bottom-line)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(74,44,26,0.1) 0%, transparent 70%)",
        }}
      />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        <div
          className={`mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <p className="section-label mb-4">Hubungi Kami</p>
          <h2 className="section-title">Mulai dari Sini</h2>
        </div>

        <div
          className="transition-all duration-300"
          style={{ opacity: mode === null && visible !== null ? 0 : 1 }}
        >
          {visible === null && (
            <OptionSelector onSelect={handleSelect} inView={inView} />
          )}
          {visible === "partner" && (
            <div
              className={`transition-all duration-500 ${mode === "partner" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <PartnershipForm onBack={handleBack} preSelected={preSelected} />
            </div>
          )}
          {visible === "general" && (
            <div
              className={`transition-all duration-500 ${mode === "general" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <GeneralContactForm onBack={handleBack} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContactFormSection (default export)
//
// Membungkus Inner di dalam <Suspense> karena useSearchParams() di Next.js
// App Router wajib punya Suspense boundary agar tidak memblokir rendering
// tree di atasnya. Fallback = skeleton ringan yang sesuai layout section.
// ─────────────────────────────────────────────────────────────────────────────
export default function ContactFormSection() {
  return (
    <Suspense
      fallback={
        <section
          className="relative py-24 px-12"
          style={{ background: "var(--bg-primary)" }}
        >
          <div className="max-w-[1280px] mx-auto">
            <div
              className="h-6 w-32 rounded mb-4 animate-pulse"
              style={{ background: "var(--bg-elevated)" }}
            />
            <div
              className="h-10 w-64 rounded mb-16 animate-pulse"
              style={{ background: "var(--bg-elevated)" }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[760px] mx-auto">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="rounded-xl p-9 animate-pulse"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    height: "260px",
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      }
    >
      <ContactFormSectionInner />
    </Suspense>
  );
}
