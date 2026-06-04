"use client";
// src/components/collector/RouteSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXED — perubahan dari versi sebelumnya:
//
//   1. isClickable logic (RouteCard):
//      Sebelumnya: !isCompleted || stop.status === "done"
//      → stop "done" tetap bisa diklik tapi tidak menampilkan apa-apa
//      → collector bingung karena tidak ada visual feedback
//
//      Sekarang: hanya stop "pending" yang bisa diklik untuk buka form
//      → stop "done" dan "skipped" tidak bisa diklik (cursor: default)
//      → jika collector tap stop done: tidak ada respons = tidak membingungkan
//
//   2. Satu form aktif sekaligus (sudah benar sebelumnya, dipertahankan):
//      activeStopId mengontrol form mana yang terbuka.
//      Menutup form aktif jika id yang sama diklik ulang.
//
//   3. Draft auto-save per stop.id (sudah benar, dipertahankan):
//      Key: `rebru_draft_${stop.id}` — tidak ada tabrakan antar stop.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react";
import { cn } from "@/utils";
import type {
  RouteStop,
  StopFormData,
  ConditionType,
  MitraCategory,
} from "@/types/collector";
import { DEFAULT_FORM_DATA, SKIP_REASONS } from "@/types/collector";
import { nowWITA, formatDisplayDate } from "@/utils/date";

// ─────────────────────────────────────────────────────────────────────────────
// Helper sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CategoryPill({ cat }: { cat: MitraCategory }) {
  const map: Record<MitraCategory, { label: string; style: string }> = {
    cafe: {
      label: "Cafe",
      style:
        "bg-[rgba(196,149,106,0.12)] text-coffee-latte border-border-DEFAULT",
    },
    hotel: {
      label: "Hotel",
      style: "bg-[rgba(200,168,75,0.12)] text-gold border-border-DEFAULT",
    },
    resto: {
      label: "Resto",
      style:
        "bg-[rgba(122,171,126,0.12)] text-forest-sage border-border-DEFAULT",
    },
  };
  const { label, style } = map[cat];
  return (
    <span
      className={cn(
        "font-mono text-[0.65rem] tracking-[0.06em] px-2 py-0.5 rounded-pill border",
        style,
      )}
    >
      {label}
    </span>
  );
}

function StatusBadge({ stop }: { stop: RouteStop }) {
  if (stop.status === "done") {
    return (
      <span className="font-mono text-[0.62rem] tracking-[0.06em] px-2 py-0.5 rounded-pill border bg-[rgba(122,171,126,0.1)] text-forest-sage border-[rgba(122,171,126,0.25)]">
        ✓ {stop.actual_kg?.toFixed(1)} kg
      </span>
    );
  }
  if (stop.status === "skipped") {
    return (
      <span
        className="font-mono text-[0.62rem] tracking-[0.06em] px-2 py-0.5 rounded-pill border"
        style={{
          background: "rgba(248,113,113,0.08)",
          color: "#f87171",
          borderColor: "rgba(248,113,113,0.2)",
        }}
      >
        {stop.skip_reason ?? "Dilewati"}
      </span>
    );
  }
  return null;
}

function StopBullet({
  stop,
  isActive,
}: {
  stop: RouteStop;
  isActive: boolean;
}) {
  const base =
    "w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[0.68rem] font-semibold font-mono shrink-0";
  if (stop.status === "done")
    return (
      <span
        className={cn(base)}
        style={{
          background: "rgba(122,171,126,0.15)",
          color: "var(--forest-sage)",
        }}
      >
        ✓
      </span>
    );
  if (stop.status === "skipped")
    return (
      <span
        className={cn(base)}
        style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
      >
        ✕
      </span>
    );
  if (isActive)
    return (
      <span
        className={cn(base)}
        style={{
          background: "var(--coffee-latte)",
          color: "var(--bg-primary)",
        }}
      >
        {stop.order}
      </span>
    );
  return (
    <span
      className={cn(base)}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        color: "var(--text-muted)",
      }}
    >
      {stop.order}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineForm — muncul di bawah stop card yang aktif
// ─────────────────────────────────────────────────────────────────────────────

interface InlineFormProps {
  stop: RouteStop;
  nextStopName: string | null;
  onSubmit: (data: StopFormData) => void;
  onSkip: (reason: string) => void;
}

function InlineForm({ stop, nextStopName, onSubmit, onSkip }: InlineFormProps) {
  const [form, setForm] = useState<StopFormData>({
    ...DEFAULT_FORM_DATA,
    qty: stop.estimated_kg,
  });
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StopFormData, string>>
  >({});
  const photoRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          locationCoords: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          locationAccuracy: Math.round(pos.coords.accuracy),
        }));
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 8000, enableHighAccuracy: true },
    );
  }, []);

  useEffect(() => {
    captureGPS();
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }, [captureGPS]);

  // Draft auto-save — key per stop.id, tidak ada tabrakan antar stop
  useEffect(() => {
    const draft = {
      qty: form.qty,
      condition: form.condition,
      notes: form.notes,
    };
    localStorage.setItem(`rebru_draft_${stop.id}`, JSON.stringify(draft));
  }, [form.qty, form.condition, form.notes, stop.id]);

  // Draft restore
  useEffect(() => {
    const raw = localStorage.getItem(`rebru_draft_${stop.id}`);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      setForm((prev) => ({
        ...prev,
        qty: draft.qty ?? stop.estimated_kg,
        condition: draft.condition ?? null,
        notes: draft.notes ?? "",
      }));
    } catch {
      /* invalid draft */
    }
  }, [stop.id, stop.estimated_kg]);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) =>
      setForm((prev) => ({
        ...prev,
        photo: file,
        photoPreview: evt.target?.result as string,
      }));
    reader.readAsDataURL(file);
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (form.qty <= 0) errs.qty = "Kuantitas harus lebih dari 0";
    if (!form.condition) errs.condition = "Pilih kondisi ampas";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    localStorage.removeItem(`rebru_draft_${stop.id}`);
    onSubmit(form);
  }

  function handleConfirmSkip() {
    const reason = skipReason === "Lainnya" ? customReason.trim() : skipReason;
    if (!reason) return;
    localStorage.removeItem(`rebru_draft_${stop.id}`);
    onSkip(reason);
  }

  const inputBase: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    borderRadius: "8px",
    fontSize: "0.88rem",
    padding: "9px 12px",
    width: "100%",
    outline: "none",
  };

  const ctaLabel = nextStopName
    ? `Simpan & Lanjut ke ${nextStopName.split(" ").slice(0, 3).join(" ")} →`
    : "Simpan & Selesaikan Rute ✓";

  return (
    <div
      ref={formRef}
      className="mt-1 mb-2 rounded-md overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-strong)",
        borderTop: "2px solid var(--coffee-latte)",
      }}
    >
      {/* Context banner */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div>
          <p className="text-[0.9rem] font-medium text-text-primary">
            {stop.mitra_name}
          </p>
          <p className="text-[0.75rem] text-text-muted mt-0.5">
            {stop.address} · Stop {stop.order}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[0.7rem] text-text-muted tracking-[0.08em] uppercase">
            Estimasi
          </p>
          <p
            className="font-mono text-[0.9rem] font-semibold"
            style={{ color: "var(--coffee-latte)" }}
          >
            ~{stop.estimated_kg} kg
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Row: Qty + Kondisi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Qty stepper */}
          <div>
            <label className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted mb-2 block">
              Kuantitas <span style={{ color: "var(--coffee-latte)" }}>*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    qty: Math.max(0, +(p.qty - 0.5).toFixed(1)),
                  }))
                }
                className="w-9 h-9 rounded-md flex items-center justify-center text-lg font-light border shrink-0"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                  color: "var(--coffee-latte)",
                }}
              >
                −
              </button>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.qty}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    qty: Math.max(0, parseFloat(e.target.value) || 0),
                  }))
                }
                className="font-mono text-[1.1rem] font-semibold text-center flex-1 h-9"
                style={{ ...inputBase, padding: "0 8px" }}
              />
              <button
                onClick={() =>
                  setForm((p) => ({ ...p, qty: +(p.qty + 0.5).toFixed(1) }))
                }
                className="w-9 h-9 rounded-md flex items-center justify-center text-lg font-light border shrink-0"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                  color: "var(--coffee-latte)",
                }}
              >
                +
              </button>
              <span className="font-mono text-[0.7rem] text-text-muted tracking-[0.08em] shrink-0">
                KG
              </span>
            </div>
            {errors.qty && (
              <p
                className="font-mono text-[0.7rem] mt-1"
                style={{ color: "#f87171" }}
              >
                {errors.qty}
              </p>
            )}
          </div>

          {/* Kondisi */}
          <div>
            <label className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted mb-2 block">
              Kondisi ampas{" "}
              <span style={{ color: "var(--coffee-latte)" }}>*</span>
            </label>
            <div className="flex gap-2 h-9">
              {(["basah", "kering", "mix"] as ConditionType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((p) => ({ ...p, condition: c }))}
                  className="flex-1 rounded-md text-[0.75rem] font-mono tracking-[0.04em] border capitalize transition-all duration-150"
                  style={{
                    background:
                      form.condition === c
                        ? "rgba(122,171,126,0.12)"
                        : "var(--bg-elevated)",
                    borderColor:
                      form.condition === c
                        ? "rgba(122,171,126,0.4)"
                        : "var(--border-strong)",
                    color:
                      form.condition === c
                        ? "var(--forest-sage)"
                        : "var(--text-muted)",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            {errors.condition && (
              <p
                className="font-mono text-[0.7rem] mt-1"
                style={{ color: "#f87171" }}
              >
                {errors.condition}
              </p>
            )}
          </div>
        </div>

        {/* Foto dokumentasi */}
        <div>
          <label className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted mb-2 block">
            Foto dokumentasi
          </label>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
          {!form.photoPreview ? (
            <button
              onClick={() => photoRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md border border-dashed transition-all duration-150 hover:border-coffee-latte"
              style={{
                background: "rgba(196,149,106,0.02)",
                borderColor: "var(--border-default)",
              }}
            >
              <span
                className="w-8 h-8 rounded-md flex items-center justify-center text-sm shrink-0"
                style={{
                  background: "rgba(196,149,106,0.1)",
                  color: "var(--coffee-latte)",
                }}
              >
                <i className="fas fa-camera" />
              </span>
              <span className="text-left">
                <span className="block text-[0.82rem] text-text-secondary">
                  Ambil foto / pilih dari galeri
                </span>
                <span className="block font-mono text-[0.65rem] text-text-muted mt-0.5">
                  JPG · PNG · maks 5 MB
                </span>
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.photoPreview}
                alt="Preview foto"
                className="w-16 h-16 rounded-md object-cover"
                style={{ border: "1px solid var(--border-strong)" }}
              />
              <div>
                <p className="text-[0.82rem] text-text-secondary">
                  {form.photo?.name}
                </p>
                <button
                  onClick={() => photoRef.current?.click()}
                  className="font-mono text-[0.65rem] mt-1 transition-colors"
                  style={{ color: "var(--coffee-latte)" }}
                >
                  Ganti foto →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lokasi otomatis */}
        <div>
          <label className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted mb-2 block">
            Lokasi saat ini
          </label>
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-md"
            style={{
              background: "rgba(122,171,126,0.05)",
              border: "1px solid rgba(122,171,126,0.18)",
            }}
          >
            <i
              className="fas fa-location-dot text-sm"
              style={{ color: "var(--forest-sage)" }}
            />
            {locLoading ? (
              <span className="font-mono text-[0.75rem] text-text-muted animate-pulse">
                Mendeteksi lokasi...
              </span>
            ) : form.locationCoords ? (
              <>
                <span
                  className="font-mono text-[0.75rem] flex-1"
                  style={{ color: "var(--forest-sage)" }}
                >
                  {form.locationCoords}
                </span>
                <span className="font-mono text-[0.65rem] text-text-muted shrink-0">
                  ±{form.locationAccuracy}m
                </span>
              </>
            ) : (
              <span className="font-mono text-[0.75rem] text-text-muted">
                Lokasi tidak terdeteksi
              </span>
            )}
            <button
              onClick={captureGPS}
              className="font-mono text-[0.65rem] shrink-0 transition-colors"
              style={{ color: "var(--coffee-latte)" }}
              title="Refresh lokasi"
            >
              <i className="fas fa-rotate-right" />
            </button>
          </div>
        </div>

        {/* Catatan */}
        <div>
          <label className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted mb-2 block">
            Catatan{" "}
            <span className="normal-case tracking-normal text-[0.65rem]">
              (opsional)
            </span>
          </label>
          <textarea
            value={form.notes}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                notes: e.target.value.slice(0, 500),
              }))
            }
            rows={2}
            placeholder="Kondisi khusus, keterangan sak/wadah, dll..."
            className="resize-none transition-all duration-150"
            style={{
              ...inputBase,
              color: form.notes ? "var(--text-primary)" : "var(--text-muted)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--border-strong)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--border-default)")
            }
          />
          <p className="font-mono text-[0.62rem] text-text-muted text-right mt-1">
            {form.notes.length}/500
          </p>
        </div>

        {/* Skip section */}
        {showSkip && (
          <div
            className="rounded-md p-3 border"
            style={{
              background: "var(--bg-elevated)",
              borderColor: "var(--border-default)",
            }}
          >
            <p className="text-[0.78rem] text-text-secondary mb-2 font-medium">
              Alasan melewati stop ini:
            </p>
            <div className="flex flex-col gap-1.5 mb-2">
              {SKIP_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSkipReason(r)}
                  className="text-left px-3 py-2 rounded-md text-[0.78rem] border transition-all duration-150"
                  style={{
                    background:
                      skipReason === r
                        ? "rgba(248,113,113,0.06)"
                        : "var(--bg-card)",
                    borderColor:
                      skipReason === r
                        ? "rgba(248,113,113,0.3)"
                        : "var(--border-subtle)",
                    color: skipReason === r ? "#f87171" : "var(--text-muted)",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            {skipReason === "Lainnya" && (
              <input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Tuliskan alasan..."
                style={{ ...inputBase, marginBottom: "8px" }}
              />
            )}
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleConfirmSkip}
                disabled={
                  !skipReason ||
                  (skipReason === "Lainnya" && !customReason.trim())
                }
                className="flex-1 py-2 rounded-md text-[0.78rem] font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  color: "#f87171",
                  borderColor: "rgba(248,113,113,0.25)",
                }}
              >
                Konfirmasi lewati
              </button>
              <button
                onClick={() => {
                  setShowSkip(false);
                  setSkipReason("");
                  setCustomReason("");
                }}
                className="px-4 py-2 rounded-md text-[0.78rem] border text-text-muted"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showSkip && (
          <div
            className="flex gap-2 pt-1 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-md text-[0.82rem] font-medium tracking-[0.03em] border flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--forest-moss)",
                color: "var(--forest-mist)",
                borderColor: "rgba(122,171,126,0.3)",
              }}
            >
              {ctaLabel}
            </button>
            <button
              onClick={() => setShowSkip(true)}
              className="px-4 py-3 rounded-md text-[0.75rem] font-mono tracking-[0.06em] border text-text-muted hover:text-text-secondary transition-all duration-150"
              style={{ borderColor: "var(--border-default)" }}
            >
              Lewati
            </button>
          </div>
        )}

        <p className="font-mono text-[0.6rem] text-text-muted text-center -mt-1">
          Draft tersimpan otomatis · GPS diambil saat form dibuka
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RouteCard
// FIXED: isClickable — hanya stop "pending" yang bisa diklik untuk buka form
// ─────────────────────────────────────────────────────────────────────────────

interface RouteCardProps {
  stop: RouteStop;
  isActive: boolean;
  nextStop: RouteStop | null;
  onToggle: () => void;
  onSubmit: (data: StopFormData) => void;
  onSkip: (reason: string) => void;
}

function RouteCard({
  stop,
  isActive,
  nextStop,
  onToggle,
  onSubmit,
  onSkip,
}: RouteCardProps) {
  // FIXED: hanya pending yang interaktif
  // done/skipped = read-only, tidak ada form yang bisa dibuka
  const isPending = stop.status === "pending";

  return (
    <div>
      <div
        onClick={isPending ? onToggle : undefined}
        role={isPending ? "button" : undefined}
        tabIndex={isPending ? 0 : undefined}
        onKeyDown={
          isPending
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onToggle();
              }
            : undefined
        }
        aria-expanded={isPending ? isActive : undefined}
        aria-label={
          isPending
            ? `Stop ${stop.order}: ${stop.mitra_name} — klik untuk buka form`
            : undefined
        }
        className={cn(
          "flex items-start gap-3 px-3 py-3 rounded-md border transition-all duration-200",
          isPending
            ? "cursor-pointer hover:border-border-strong"
            : "cursor-default",
          isActive && isPending && "border-coffee-latte",
        )}
        style={{
          background:
            isActive && isPending ? "rgba(196,149,106,0.04)" : "var(--bg-card)",
          borderColor:
            isActive && isPending
              ? "var(--coffee-latte)"
              : stop.status === "done"
                ? "rgba(122,171,126,0.15)"
                : stop.status === "skipped"
                  ? "rgba(248,113,113,0.12)"
                  : "var(--border-subtle)",
          // Stop selesai/dilewati: opasitas lebih rendah agar hierarki visual jelas
          opacity: stop.status === "pending" ? 1 : 0.65,
        }}
      >
        <StopBullet stop={stop} isActive={isActive} />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-[0.88rem] font-medium truncate",
              stop.status !== "pending"
                ? "text-text-muted"
                : "text-text-primary",
            )}
          >
            {stop.mitra_name}
            {isActive && isPending && (
              <span
                className="font-mono text-[0.6rem] ml-2 tracking-[0.06em]"
                style={{ color: "var(--coffee-latte)" }}
              >
                ▲ form terbuka
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <CategoryPill cat={stop.mitra_category} />
            <span className="font-mono text-[0.65rem] text-text-muted">
              {stop.scheduled_time}
            </span>
            {stop.status === "pending" && (
              <span className="font-mono text-[0.65rem] text-text-muted">
                ~{stop.estimated_kg} kg
              </span>
            )}
            {stop.status === "done" && stop.completed_at && (
              <span className="font-mono text-[0.65rem] text-text-muted">
                selesai {stop.completed_at}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          <StatusBadge stop={stop} />
          {/* Chevron hanya untuk stop pending */}
          {isPending && (
            <span
              className="font-mono text-[0.65rem] tracking-[0.04em] transition-transform duration-200 ml-1"
              style={{
                color: "var(--text-muted)",
                transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                display: "inline-block",
              }}
            >
              ▼
            </span>
          )}
        </div>
      </div>

      {/* Form inline — hanya muncul untuk stop aktif yang masih pending */}
      {isActive && isPending && (
        <InlineForm
          stop={stop}
          nextStopName={nextStop?.mitra_name ?? null}
          onSubmit={onSubmit}
          onSkip={onSkip}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RouteSection — main export
// ─────────────────────────────────────────────────────────────────────────────

interface RouteSectionProps {
  collectorName: string;
  routeDate: string;
  initialStops: RouteStop[];
  onStopsChange?: (stops: RouteStop[]) => void;
}

export default function RouteSection({
  collectorName,
  routeDate,
  initialStops,
  onStopsChange,
}: RouteSectionProps) {
  const [stops, setStops] = useState<RouteStop[]>(initialStops);
  const [activeStopId, setActiveStopId] = useState<string | null>(() => {
    return initialStops.find((s) => s.status === "pending")?.id ?? null;
  });

  const doneStops = stops.filter((s) => s.status === "done");
  const totalKg = doneStops.reduce((acc, s) => acc + (s.actual_kg ?? 0), 0);
  const progressPct =
    stops.length > 0
      ? Math.round(
          (stops.filter((s) => s.status !== "pending").length / stops.length) *
            100,
        )
      : 0;

  function updateStops(updated: RouteStop[]) {
    setStops(updated);
    onStopsChange?.(updated);
  }

  function handleToggle(stopId: string) {
    setActiveStopId((prev) => (prev === stopId ? null : stopId));
  }

  function handleSubmit(stopId: string, formData: StopFormData) {
    // FIX #8: nowWITA() + getUTC* agar jam selesai tercatat dalam WITA
    // getHours() bergantung timezone browser → salah jika bukan WITA
    const now = nowWITA();
    const timeStr = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;

    const updated = stops.map((s) =>
      s.id === stopId
        ? {
            ...s,
            status: "done" as const,
            actual_kg: formData.qty,
            condition: formData.condition ?? undefined,
            notes: formData.notes || undefined,
            photo_preview: formData.photoPreview ?? undefined,
            location_coords: formData.locationCoords ?? undefined,
            location_accuracy: formData.locationAccuracy ?? undefined,
            completed_at: timeStr,
          }
        : s,
    );
    updateStops(updated);

    // Auto-advance ke stop pending berikutnya
    const currentIdx = updated.findIndex((s) => s.id === stopId);
    const nextPending = updated
      .slice(currentIdx + 1)
      .find((s) => s.status === "pending");
    setActiveStopId(nextPending?.id ?? null);
  }

  function handleSkip(stopId: string, reason: string) {
    const updated = stops.map((s) =>
      s.id === stopId
        ? { ...s, status: "skipped" as const, skip_reason: reason }
        : s,
    );
    updateStops(updated);

    const currentIdx = updated.findIndex((s) => s.id === stopId);
    const nextPending = updated
      .slice(currentIdx + 1)
      .find((s) => s.status === "pending");
    setActiveStopId(nextPending?.id ?? null);
  }

  // FIX #7: formatDisplayDate (WITA-aware, tidak bergantung locale browser)
  // new Date("YYYY-MM-DD") parsed sebagai UTC midnight → getDay() bisa salah
  const formattedDate = formatDisplayDate(routeDate, {
    weekday: true,
    longMonth: true,
  });

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem] font-semibold shrink-0"
          style={{
            background: "var(--coffee-latte)",
            color: "var(--bg-primary)",
          }}
        >
          1
        </div>
        <div>
          <h2 className="font-display text-[1.15rem] text-text-primary font-semibold">
            Input data pengambilan
          </h2>
          <p className="text-[0.78rem] text-text-muted mt-0.5">
            Tap nama mitra untuk buka form input
          </p>
        </div>
      </div>

      {/* Identity + progress strip */}
      <div
        className="flex items-center gap-3 p-3 rounded-md border mb-4"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-[0.72rem] font-semibold shrink-0"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--coffee-latte)",
          }}
        >
          {collectorName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[0.88rem] font-medium text-text-primary truncate">
            {collectorName}
          </p>
          <p className="text-[0.72rem] text-text-muted mt-0.5">
            {formattedDate} ·{" "}
            <span style={{ color: "var(--forest-sage)" }}>
              {stops.length} stop dijadwalkan
            </span>
          </p>
          <div
            className="mt-2 h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--border-subtle)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "var(--forest-sage)",
              }}
            />
          </div>
        </div>

        <div className="flex gap-4 shrink-0">
          <div className="text-center">
            <p
              className="font-display text-[1.1rem] font-semibold leading-none"
              style={{ color: "var(--coffee-latte)" }}
            >
              {totalKg % 1 === 0 ? totalKg.toFixed(0) : totalKg.toFixed(1)}
            </p>
            <p className="font-mono text-[0.58rem] tracking-[0.08em] uppercase text-text-muted mt-1">
              kg
            </p>
          </div>
          <div className="text-center">
            <p
              className="font-display text-[1.1rem] font-semibold leading-none"
              style={{ color: "var(--forest-sage)" }}
            >
              {doneStops.length}
              <span className="text-text-muted text-[0.85rem]">
                /{stops.length}
              </span>
            </p>
            <p className="font-mono text-[0.58rem] tracking-[0.08em] uppercase text-text-muted mt-1">
              selesai
            </p>
          </div>
        </div>
      </div>

      {/* Route list */}
      <div>
        <p className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted mb-2 flex items-center gap-2">
          Rute hari ini
          <span
            className="flex-1 h-px"
            style={{ background: "var(--border-subtle)" }}
          />
        </p>

        <div className="flex flex-col gap-1.5">
          {stops.map((stop, idx) => {
            const nextPending = stops
              .slice(idx + 1)
              .find((s) => s.status === "pending");
            return (
              <RouteCard
                key={stop.id}
                stop={stop}
                isActive={activeStopId === stop.id}
                nextStop={nextPending ?? null}
                onToggle={() => handleToggle(stop.id)}
                onSubmit={(data) => handleSubmit(stop.id, data)}
                onSkip={(reason) => handleSkip(stop.id, reason)}
              />
            );
          })}
        </div>

        {/* Completion banner */}
        {stops.every((s) => s.status !== "pending") && (
          <div
            className="mt-4 p-4 rounded-md border text-center"
            style={{
              background: "rgba(122,171,126,0.05)",
              borderColor: "rgba(122,171,126,0.2)",
            }}
          >
            <p
              className="font-display text-[1.1rem]"
              style={{ color: "var(--forest-sage)" }}
            >
              Semua stop telah dikunjungi ✓
            </p>
            <p className="text-[0.78rem] text-text-muted mt-1">
              Total terkumpul:{" "}
              <span style={{ color: "var(--coffee-latte)" }}>
                {totalKg.toFixed(1)} kg
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
