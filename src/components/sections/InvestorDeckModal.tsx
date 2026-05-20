// src/components/sections/InvestorDeckModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─── Supabase client — anon key, insert-only via RLS ───────────────────────
 * Menggunakan NEXT_PUBLIC_ prefix agar tersedia di client component.
 * RLS policy "allow_public_insert" memastikan anon hanya bisa INSERT,
 * tidak bisa SELECT/UPDATE/DELETE — aman diekspos di frontend.
 * ─────────────────────────────────────────────────────────────────────────── */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/* ─── Types ────────────────────────────────────────────────────────────────── */
type FormState = "idle" | "submitting" | "success" | "error";

interface FormData {
  fullName: string;
  email: string;
  organization: string;
  investorType: string;
  message: string;
}

const INITIAL_FORM: FormData = {
  fullName: "",
  email: "",
  organization: "",
  investorType: "",
  message: "",
};

const INVESTOR_TYPES = [
  { value: "", label: "Select investor type…" },
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capital" },
  { value: "corporate", label: "Corporate / Strategic" },
  { value: "impact", label: "Impact Fund" },
  { value: "other", label: "Other" },
] as const;

/* ─── Props ─────────────────────────────────────────────────────────────────── */
interface InvestorDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function InvestorDeckModal({
  isOpen,
  onClose,
}: InvestorDeckModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Partial<FormData>>({});

  /* Lock body scroll saat modal terbuka */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ESC key close */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setForm(INITIAL_FORM);
        setState("idle");
        setErrors({});
      }, 300);
    }
  }, [isOpen]);

  /* ── Validation ── */
  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Please enter a valid email";
    if (!form.organization.trim()) e.organization = "Organization is required";
    if (!form.investorType) e.investorType = "Please select an investor type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit → Supabase insert ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setState("submitting");

    const { error: supabaseError } = await supabase
      .from("investor_deck_requests")
      .insert({
        full_name: form.fullName,
        email: form.email,
        organization: form.organization,
        investor_type: form.investorType,
        message: form.message || null,
        // status & submitted_at diisi otomatis oleh DEFAULT di schema SQL
      });

    if (supabaseError) {
      console.error(
        "[InvestorDeckModal] Supabase insert error:",
        supabaseError,
      );
      setState("error");
      return;
    }

    setState("success");
  };

  /* ── Field update helper ── */
  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        background: "rgba(10, 6, 4, 0.78)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-modal-title"
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-[520px] rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(196,149,106,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-[15%] right-[15%] h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--coffee-latte), transparent)",
          }}
        />

        {/* Header */}
        <div
          className="px-8 pt-8 pb-6"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] tracking-[0.18em] uppercase mb-3"
                style={{
                  color: "var(--forest-sage)",
                  background: "rgba(122,171,126,0.08)",
                  border: "1px solid rgba(122,171,126,0.18)",
                  padding: "3px 10px",
                  borderRadius: "4px",
                }}
              >
                <span
                  className="block w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--forest-sage)" }}
                />
                Investor Relations
              </span>
              <h2
                id="deck-modal-title"
                className="font-display font-semibold leading-[1.2]"
                style={{
                  fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
                  color: "var(--text-primary)",
                }}
              >
                Request{" "}
                <em className="italic" style={{ color: "var(--coffee-latte)" }}>
                  Investment Deck
                </em>
              </h2>
              <p
                className="text-[0.82rem] leading-[1.7] mt-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Fill in the form below — we&apos;ll send the deck to your email
                within{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  24 hours
                </strong>
                .
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
              aria-label="Close modal"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        {state === "success" ? (
          <SuccessState onClose={onClose} email={form.email} />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="px-8 py-7 flex flex-col gap-5"
            noValidate
          >
            {/* Full Name */}
            <Field label="Full Name" required error={errors.fullName}>
              <input
                type="text"
                autoComplete="name"
                placeholder="Ahmad Rifai"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                style={inputStyle(!!errors.fullName)}
              />
            </Field>

            {/* Email */}
            <Field label="Email" required error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                placeholder="investor@fund.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                style={inputStyle(!!errors.email)}
              />
            </Field>

            {/* Organization */}
            <Field label="Organization" required error={errors.organization}>
              <input
                type="text"
                autoComplete="organization"
                placeholder="Alpha Capital / Mandiri Investasi"
                value={form.organization}
                onChange={(e) => update("organization", e.target.value)}
                style={inputStyle(!!errors.organization)}
              />
            </Field>

            {/* Investor Type */}
            <Field label="Investor Type" required error={errors.investorType}>
              <div className="relative">
                <select
                  value={form.investorType}
                  onChange={(e) => update("investorType", e.target.value)}
                  className="w-full appearance-none"
                  style={{
                    ...inputStyle(!!errors.investorType),
                    color: form.investorType
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                    paddingRight: "2.5rem",
                  }}
                >
                  {INVESTOR_TYPES.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.value === ""}
                      style={{
                        background: "var(--bg-surface)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ color: "var(--text-muted)" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </Field>

            {/* Message (optional) */}
            <Field
              label="Message"
              hint="Optional — what would you like to know?"
            >
              <textarea
                rows={3}
                placeholder="e.g. interested in the revenue model, or want to know about expansion plans to other cities…"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                className="resize-none"
                style={inputStyle(false)}
              />
            </Field>

            {/* Global error */}
            {state === "error" && (
              <p
                className="text-[0.78rem] leading-[1.6] px-4 py-3 rounded-lg"
                style={{
                  color: "var(--color-error)",
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                Something went wrong. Please try again or reach us directly at{" "}
                <a
                  href="mailto:halo@rebru.id"
                  style={{
                    color: "var(--coffee-latte)",
                    textDecoration: "underline",
                  }}
                >
                  halo@rebru.id
                </a>
                .
              </p>
            )}

            {/* Submit row */}
            <div
              className="flex items-center justify-between gap-4"
              style={{
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "1.25rem",
                marginTop: "0.25rem",
              }}
            >
              <p
                className="text-[0.72rem] leading-[1.6]"
                style={{ color: "var(--text-muted)" }}
              >
                Your data is safe — we will never share it with third parties.
              </p>
              <button
                type="submit"
                disabled={state === "submitting"}
                className="flex-shrink-0 inline-flex items-center gap-2 font-medium text-[0.82rem] px-5 py-2.5 rounded-lg transition-all duration-200"
                style={{
                  background:
                    state === "submitting"
                      ? "rgba(196,149,106,0.5)"
                      : "var(--coffee-latte)",
                  color: "#1a0f0a",
                  border: "none",
                  cursor: state === "submitting" ? "not-allowed" : "pointer",
                  minWidth: "120px",
                  justifyContent: "center",
                }}
              >
                {state === "submitting" ? (
                  <>
                    <Spinner /> Sending…
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

const Field = ({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      className="flex items-center gap-1 text-[0.78rem] font-medium"
      style={{ color: "var(--text-secondary)" }}
    >
      {label}
      {required && (
        <span style={{ color: "var(--coffee-latte)" }} aria-hidden>
          *
        </span>
      )}
      {hint && (
        <span
          className="ml-1 font-normal text-[0.72rem]"
          style={{ color: "var(--text-muted)" }}
        >
          — {hint}
        </span>
      )}
    </label>
    {children}
    {error && (
      <p className="text-[0.72rem]" style={{ color: "var(--color-error)" }}>
        {error}
      </p>
    )}
  </div>
);

const SuccessState = ({
  onClose,
  email,
}: {
  onClose: () => void;
  email: string;
}) => (
  <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center"
      style={{
        background: "rgba(122,171,126,0.12)",
        border: "1px solid rgba(122,171,126,0.25)",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--forest-sage)" }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>

    <div>
      <h3
        className="font-display font-semibold text-[1.4rem] mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Request Received!
      </h3>
      <p
        className="text-[0.85rem] leading-[1.75]"
        style={{ color: "var(--text-secondary)" }}
      >
        We&apos;ll send the Rebru deck to{" "}
        <strong style={{ color: "var(--coffee-latte)" }}>{email}</strong> within
        24 hours. Thank you for your interest in our mission.
      </p>
    </div>

    <p className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
      Have an urgent question?{" "}
      <a
        href="https://wa.me/6285237390994"
        style={{ color: "var(--forest-sage)", textDecoration: "underline" }}
        target="_blank"
        rel="noopener noreferrer"
      >
        Chat via WhatsApp
      </a>
    </p>

    <button
      onClick={onClose}
      className="text-[0.8rem] px-6 py-2.5 rounded-lg transition-all duration-200"
      style={{
        background: "transparent",
        border: "1px solid var(--border-default)",
        color: "var(--text-secondary)",
        cursor: "pointer",
      }}
    >
      Close
    </button>
  </div>
);

const Spinner = () => (
  <svg
    className="animate-spin"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
    <path d="M21 12a9 9 0 00-9-9" />
  </svg>
);

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${hasError ? "rgba(248,113,113,0.5)" : "var(--border-default)"}`,
  borderRadius: "8px",
  padding: "0.625rem 0.875rem",
  fontSize: "0.85rem",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
  fontFamily: "var(--font-dm-sans), sans-serif",
});
