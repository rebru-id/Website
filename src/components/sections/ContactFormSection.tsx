"use client";

import { useEffect, useRef, useState } from "react";
import { buildWhatsAppOrderURL, buildCartMessage } from "@/services/order";
import { PACKAGES } from "./ContactPackagesSection";

// ─────────────────────────────────────────────────────────────────────────────
// Kota data — dropdown kota Makassar & sekitarnya
// ─────────────────────────────────────────────────────────────────────────────
const KOTA_OPTIONS = [
  "Makassar — Biringkanaya",
  "Makassar — Bontoala",
  "Makassar — Kepulauan Sangkarrang",
  "Makassar — Makassar",
  "Makassar — Mamajang",
  "Makassar — Manggala",
  "Makassar — Mappala",
  "Makassar — Mariso",
  "Makassar — Panakkukang",
  "Makassar — Rappocini",
  "Makassar — Tallo",
  "Makassar — Tamalate",
  "Makassar — Tamalanrea",
  "Makassar — Ujung Pandang",
  "Makassar — Ujung Tanah",
  "Makassar — Wajo",
  "Gowa",
  "Maros",
  "Takalar",
  "Kota lain (isi manual)",
];

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─────────────────────────────────────────────────────────────────────────────
// Types — maps directly to Supabase tables (Sprint 3)
// ─────────────────────────────────────────────────────────────────────────────

interface PartnerForm {
  pic: string;               // Penanggung Jawab (PIC)
  organization: string;
  phone: string;
  wilayah: string;           // kota/kecamatan dari dropdown
  wilayahCustom: string;     // jika pilih "Kota lain"
  type: "kontributor" | "dampak" | "strategis" | "";
  message: string;
}

interface GeneralForm {
  name: string;
  phone: string;
  message: string;
}

const EMPTY_PARTNER: PartnerForm = {
  pic: "", organization: "", phone: "",
  wilayah: "", wilayahCustom: "", type: "", message: "",
};

const EMPTY_GENERAL: GeneralForm = { name: "", phone: "", message: "" };

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI helpers
// ─────────────────────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-default)",
  color: "var(--text-primary)",
  borderRadius: "10px",
  padding: "0.8rem 1rem",
  fontSize: "0.9rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
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

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label style={{
      display: "block",
      fontFamily: "var(--font-space-mono), monospace",
      fontSize: "0.62rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase" as const,
      color: "var(--text-muted)",
      marginBottom: "0.45rem",
    }}>
      {children}
      {optional && (
        <span style={{ color: "var(--border-strong)", marginLeft: "0.5rem", fontSize: "0.55rem" }}>
          opsional
        </span>
      )}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{ fontFamily: "var(--font-space-mono)", fontSize: "0.6rem", color: "#f87171", marginTop: "0.3rem" }}>
      {msg}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Partnership Form
// ─────────────────────────────────────────────────────────────────────────────
function PartnershipForm({ preSelected }: { preSelected: string }) {
  const [form, setForm] = useState<PartnerForm>({
    ...EMPTY_PARTNER,
    type: preSelected as PartnerForm["type"],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PartnerForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      setForm((prev) => ({ ...prev, type: id as PartnerForm["type"] }));
    };
    window.addEventListener("selectPackage", handler);
    return () => window.removeEventListener("selectPackage", handler);
  }, []);

  useEffect(() => {
    if (preSelected) setForm((prev) => ({ ...prev, type: preSelected as PartnerForm["type"] }));
  }, [preSelected]);

  const set = (k: keyof PartnerForm, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const wilayahFinal = form.wilayah === "Kota lain (isi manual)"
    ? form.wilayahCustom
    : form.wilayah;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.pic.trim())          e.pic = "Nama penanggung jawab wajib diisi";
    if (!form.organization.trim()) e.organization = "Nama kafe/bisnis wajib diisi";
    if (!form.phone.trim())        e.phone = "Nomor WhatsApp wajib diisi";
    if (!form.wilayah)             e.wilayah = "Wilayah wajib dipilih";
    if (form.wilayah === "Kota lain (isi manual)" && !form.wilayahCustom.trim())
                                   e.wilayahCustom = "Isi nama kota/wilayah";
    if (!form.type)                e.type = "Pilih skema kemitraan";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const selectedPkg = PACKAGES.find((p) => p.id === form.type);

    // Mock — Sprint 3: supabase.from('partner_applications').insert(...)
    console.log("[MOCK] partner_applications insert:", {
      name: form.pic,
      organization: form.organization,
      phone: form.phone,
      city: wilayahFinal,
      type: form.type,
      message: form.message,
      status: "pending",
    });

    const msgText =
      `Halo Rebru! Saya ingin mendaftar sebagai *${selectedPkg?.tier}*.\n\n` +
      `PIC / Penanggung Jawab: ${form.pic}\n` +
      `Kafe / Bisnis: ${form.organization}\n` +
      `Wilayah: ${wilayahFinal}\n` +
      `WhatsApp: ${form.phone}\n` +
      `Paket: ${selectedPkg?.tier} (${selectedPkg?.badge})\n` +
      (form.message ? `\nCatatan: ${form.message}\n` : "") +
      `\nDitunggu konfirmasinya. Terima kasih! 🌱`;

    window.open(buildWhatsAppOrderURL(msgText), "_blank");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ background: "rgba(45,90,46,0.15)", border: "1px solid rgba(122,171,126,0.3)" }}>
          <i className="fas fa-check text-[1.3rem]" style={{ color: "var(--forest-sage)" }} />
        </div>
        <h3 className="font-display font-semibold text-[1.4rem] mb-2" style={{ color: "var(--text-primary)" }}>
          Terima Kasih!
        </h3>
        <p className="text-[0.88rem] leading-[1.8] max-w-[320px] mb-6" style={{ color: "var(--text-secondary)" }}>
          Pendaftaran kamu sudah kami terima. Tim Rebru akan menghubungi via WhatsApp dalam 1×24 jam.
        </p>
        <button onClick={() => { setSubmitted(false); setForm(EMPTY_PARTNER); }}
          className="font-mono text-[0.68rem] tracking-[0.12em] uppercase px-4 py-2 rounded-pill"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
          Daftar Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Package selector */}
      <div>
        <Label>Pilih Skema Kemitraan *</Label>
        <div className="flex flex-col gap-2">
          {PACKAGES.map((pkg) => (
            <button key={pkg.id} onClick={() => set("type", pkg.id)}
              className="flex items-center justify-between px-4 py-3.5 rounded-md text-left transition-all duration-200"
              style={{
                background: form.type === pkg.id ? pkg.accentBg : "var(--bg-card)",
                border: form.type === pkg.id
                  ? `1.5px solid ${pkg.accentBorder}`
                  : "1px solid var(--border-default)",
              }}>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: form.type === pkg.id ? pkg.accent : "var(--border-strong)" }} />
                <div>
                  <p className="text-[0.88rem] font-medium" style={{ color: "var(--text-primary)" }}>
                    {pkg.tier}
                  </p>
                  <p className="font-mono text-[0.58rem] tracking-[0.08em] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {pkg.tagline}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[0.65rem] tracking-[0.08em] uppercase flex-shrink-0 ml-3"
                style={{ color: pkg.accent }}>{pkg.badge}</span>
            </button>
          ))}
        </div>
        <FieldError msg={errors.type} />
      </div>

      {/* PIC + Organisasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Penanggung Jawab (PIC) *</Label>
          <input type="text" value={form.pic}
            onChange={(e) => set("pic", e.target.value)}
            placeholder="Nama PIC atau pemilik kafe"
            style={inputBase} />
          <FieldError msg={errors.pic} />
        </div>
        <div>
          <Label>Nama Kafe / Bisnis *</Label>
          <input type="text" value={form.organization}
            onChange={(e) => set("organization", e.target.value)}
            placeholder="Nama usaha atau organisasi"
            style={inputBase} />
          <FieldError msg={errors.organization} />
        </div>
      </div>

      {/* Phone + Wilayah */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Nomor WhatsApp *</Label>
          <input type="tel" value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+62 812 xxxx xxxx"
            style={inputBase} />
          <FieldError msg={errors.phone} />
        </div>

        <div>
          <Label>Wilayah / Kecamatan *</Label>
          <select value={form.wilayah}
            onChange={(e) => set("wilayah", e.target.value)}
            style={selectBase}>
            <option value="" disabled>Pilih wilayah...</option>
            {KOTA_OPTIONS.map((opt) => (
              <option key={opt} value={opt}
                style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>
                {opt}
              </option>
            ))}
          </select>
          <FieldError msg={errors.wilayah} />
        </div>
      </div>

      {/* Custom kota jika "Kota lain" */}
      {form.wilayah === "Kota lain (isi manual)" && (
        <div>
          <Label>Nama Kota / Wilayah *</Label>
          <input type="text" value={form.wilayahCustom}
            onChange={(e) => set("wilayahCustom", e.target.value)}
            placeholder="Contoh: Parepare, Bone, Gowa Kota..."
            style={inputBase} />
          <FieldError msg={errors.wilayahCustom} />
        </div>
      )}

      {/* Message */}
      <div>
        <Label optional>Catatan Tambahan</Label>
        <textarea value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Volume ampas kopi per hari, pertanyaan, atau hal lain yang ingin disampaikan..."
          rows={4}
          style={{ ...inputBase, resize: "vertical", lineHeight: "1.7" }} />
      </div>

      {/* Submit */}
      <button onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-pill font-mono text-[0.78rem] tracking-[0.1em] uppercase transition-all duration-300 hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, var(--forest-moss), var(--forest-dark))",
          border: "1px solid rgba(74,124,78,0.4)",
          color: "#f5efe6",
          boxShadow: "0 4px 20px rgba(45,90,46,0.2)",
        }}>
        <i className="fab fa-whatsapp text-[1rem]" />
        Daftar via WhatsApp
      </button>

      <p className="text-center font-mono text-[0.6rem] tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
        Sprint 3: form akan tersimpan ke Supabase &amp; konfirmasi dikirim otomatis
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// General Contact Form
// ─────────────────────────────────────────────────────────────────────────────
function GeneralContactForm() {
  const [form, setForm] = useState<GeneralForm>(EMPTY_GENERAL);
  const [errors, setErrors] = useState<Partial<Record<keyof GeneralForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof GeneralForm, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim())    e.name = "Nama wajib diisi";
    if (!form.message.trim()) e.message = "Pesan wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // Mock — Sprint 3: supabase.from('contact_messages').insert(...)
    console.log("[MOCK] contact_messages insert:", {
      name: form.name,
      phone: form.phone || null,
      message: form.message,
      type: "general",
    });

    const msgText =
      `Halo Rebru! Saya ingin menghubungi kalian.\n\n` +
      `Nama: ${form.name}\n` +
      (form.phone ? `WhatsApp: ${form.phone}\n` : "") +
      `\nPesan:\n${form.message}`;

    window.open(buildWhatsAppOrderURL(msgText), "_blank");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(196,149,106,0.15)", border: "1px solid rgba(196,149,106,0.3)" }}>
          <i className="fas fa-check text-[1.1rem]" style={{ color: "var(--coffee-latte)" }} />
        </div>
        <h4 className="font-display font-semibold text-[1.2rem] mb-2" style={{ color: "var(--text-primary)" }}>
          Pesan Terkirim!
        </h4>
        <p className="text-[0.85rem] leading-[1.8] mb-5" style={{ color: "var(--text-secondary)" }}>
          Kami akan membalas via WhatsApp segera.
        </p>
        <button onClick={() => { setSubmitted(false); setForm(EMPTY_GENERAL); }}
          className="font-mono text-[0.65rem] tracking-[0.12em] uppercase px-4 py-2 rounded-pill"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
          Kirim Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label>Nama *</Label>
        <input type="text" value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Nama kamu"
          style={inputBase} />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <Label optional>WhatsApp / Telepon</Label>
        <input type="tel" value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+62 812 xxxx xxxx"
          style={inputBase} />
      </div>

      <div>
        <Label>Pesan *</Label>
        <textarea value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Kritik, saran, pertanyaan, atau sekadar menyapa..."
          rows={5}
          style={{ ...inputBase, resize: "vertical", lineHeight: "1.7" }} />
        <FieldError msg={errors.message} />
      </div>

      <button onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-pill font-mono text-[0.75rem] tracking-[0.1em] uppercase transition-all duration-300"
        style={{
          background: "transparent",
          border: "1.5px solid rgba(196,149,106,0.45)",
          color: "var(--coffee-latte)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(196,149,106,0.08)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(196,149,106,0.75)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(196,149,106,0.45)";
        }}>
        <i className="fab fa-whatsapp" />
        Kirim Pesan
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function ContactFormSection() {
  const { ref, inView } = useInView(0.06);
  const [preSelected, setPreSelected] = useState("");

  useEffect(() => {
    const handler = (e: Event) => setPreSelected((e as CustomEvent).detail as string);
    window.addEventListener("selectPackage", handler);
    return () => window.removeEventListener("selectPackage", handler);
  }, []);

  return (
    <section id="partnership-form" className="relative py-24 px-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}>
      <div className="absolute top-0 left-12 right-12 h-px" style={{ background: "var(--impact-bottom-line)" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(74,44,26,0.1) 0%, transparent 70%)" }} />

      <div ref={ref} className="relative z-10 max-w-[1280px] mx-auto">
        <div className={`mb-14 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="section-label mb-4">Hubungi Kami</p>
          <h2 className="section-title">Mulai dari Sini</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">

          {/* LEFT — Partnership */}
          <div
            className={`rounded-lg p-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{
              background: "rgba(45,90,46,0.05)",
              border: "1px solid rgba(122,171,126,0.2)",
              transitionDelay: "160ms",
            }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(122,171,126,0.15)", border: "1px solid rgba(122,171,126,0.25)" }}>
                <i className="fas fa-handshake text-[0.85rem]" style={{ color: "var(--forest-sage)" }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-[1.35rem]" style={{ color: "var(--text-primary)" }}>
                  Become a Partner
                </h3>
                <p className="font-mono text-[0.62rem] tracking-[0.1em] uppercase" style={{ color: "var(--forest-sage)" }}>
                  Daftar sebagai Mitra Rebru
                </p>
              </div>
            </div>
            <PartnershipForm preSelected={preSelected} />
          </div>

          {/* RIGHT — General */}
          <div
            className={`rounded-lg p-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              transitionDelay: "280ms",
            }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(196,149,106,0.12)", border: "1px solid rgba(196,149,106,0.2)" }}>
                <i className="fas fa-comment-alt text-[0.85rem]" style={{ color: "var(--coffee-latte)" }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-[1.35rem]" style={{ color: "var(--text-primary)" }}>
                  Say Hello
                </h3>
                <p className="font-mono text-[0.62rem] tracking-[0.1em] uppercase" style={{ color: "var(--coffee-latte)" }}>
                  Pertanyaan umum &amp; saran
                </p>
              </div>
            </div>
            <GeneralContactForm />

            {/* Direct contact */}
            <div className="mt-8 pt-8 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <p className="font-mono text-[0.62rem] tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                Atau hubungi langsung
              </p>
              <a href="https://wa.me/6285237390994" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[0.88rem] transition-colors duration-200"
                style={{ color: "var(--forest-sage)" }}>
                <i className="fab fa-whatsapp" />
                +62 852-3739-0994
              </a>
              <a href="mailto:rebruid@gmail.com"
                className="inline-flex items-center gap-2.5 text-[0.88rem]"
                style={{ color: "var(--text-secondary)" }}>
                <i className="fas fa-envelope text-[0.8rem]" />
                rebruid@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
