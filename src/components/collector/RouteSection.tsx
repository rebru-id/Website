"use client";
// src/components/collector/RouteSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Perubahan dari versi sebelumnya:
//
//   REC 3 — Timestamp di completed stops di route list
//     Sebelumnya: completed_at hanya tampil di HistorySection
//     Sekarang: juga tampil inline di RouteCard untuk stop "done",
//     agar collector bisa lihat "selesai 09:32" langsung tanpa buka riwayat.
//
//   REC 4 — Hero card + InlineForm dalam proximity
//     Sebelumnya: "Mulai Catat →" di hero card membuka form di route list
//     (bisa jauh di bawah layar → disorienting scroll).
//     Sekarang: InlineForm dirender langsung di dalam hero card itu sendiri,
//     sehingga form muncul tepat di bawah tombol yang ditekan.
//     Route list tetap ada, tapi form hero tidak lagi di-scroll ke sana.
//
//   REC 7 — Skip flow simplification
//     Sebelumnya: tap "Lewati" → buka panel skip di dalam form (3 langkah)
//     Sekarang: tap "Lewati" → bottom sheet kecil dengan 3 tombol besar
//     langsung dapat dikonfirmasi dalam 1 tap tanpa membuka form penuh.
//     "Lainnya" tetap ada dengan input teks.
//     Quick skip bisa dipanggil dari hero card DAN dari route card langsung.
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
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-[0.62rem] tracking-[0.06em] px-2 py-0.5 rounded-pill border bg-[rgba(122,171,126,0.1)] text-forest-sage border-[rgba(122,171,126,0.25)]">
          ✓ {stop.actual_kg?.toFixed(1)} kg
        </span>
        {/* Fix #3 — indikator foto: hijau=ada foto, redup=belum ada */}
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          title={stop.photo_preview ? "Ada foto dokumentasi" : "Belum ada foto"}
          style={{
            background: stop.photo_preview
              ? "rgba(122,171,126,0.12)"
              : "rgba(196,149,106,0.08)",
            border: `1px solid ${stop.photo_preview ? "rgba(122,171,126,0.3)" : "rgba(196,149,106,0.2)"}`,
          }}
        >
          <i
            className={`fas fa-${stop.photo_preview ? "image" : "camera"} text-[0.52rem]`}
            style={{
              color: stop.photo_preview
                ? "var(--forest-sage)"
                : "var(--text-muted)",
            }}
          />
        </span>
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
// REC 7 — QuickSkipSheet
// Bottom sheet kecil dengan 3 tombol alasan utama + opsi "Lainnya".
// Dirender sebagai overlay di dalam RouteSection (bukan modal global),
// agar tidak ada layout shift pada konten di bawahnya.
// ─────────────────────────────────────────────────────────────────────────────

interface QuickSkipSheetProps {
  stopName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

function QuickSkipSheet({
  stopName,
  onConfirm,
  onCancel,
}: QuickSkipSheetProps) {
  const [customReason, setCustomReason] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Alasan utama — 3 tombol besar, 1 tap langsung konfirmasi
  const quickReasons = SKIP_REASONS.filter((r) => r !== "Lainnya");

  return (
    <div
      className="mt-1 mb-2 rounded-md overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(248,113,113,0.25)",
        borderTop: "2px solid #f87171",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          background: "rgba(248,113,113,0.04)",
          borderColor: "rgba(248,113,113,0.12)",
        }}
      >
        <div>
          <p className="text-[0.85rem] font-medium text-text-primary">
            Lewati stop ini
          </p>
          <p className="text-[0.72rem] text-text-muted mt-0.5 truncate max-w-[220px]">
            {stopName}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
          }}
          aria-label="Batal lewati"
        >
          <i className="fas fa-times text-[0.65rem]" />
        </button>
      </div>

      <div className="p-4">
        <p className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted mb-3">
          Pilih alasan
        </p>

        {/* Quick reason buttons — 1 tap langsung konfirmasi */}
        <div className="flex flex-col gap-2 mb-3">
          {quickReasons.map((reason) => (
            <button
              key={reason}
              onClick={() => onConfirm(reason)}
              className="w-full text-left px-4 py-3 rounded-md text-[0.82rem] font-medium border transition-all duration-150 hover:-translate-y-0.5"
              style={{
                background: "rgba(248,113,113,0.05)",
                color: "#f87171",
                borderColor: "rgba(248,113,113,0.2)",
              }}
            >
              <i className="fas fa-times-circle mr-2 text-[0.75rem] opacity-70" />
              {reason}
            </button>
          ))}
        </div>

        {/* Lainnya — expand input teks */}
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full text-left px-4 py-2.5 rounded-md text-[0.78rem] border transition-colors"
            style={{
              color: "var(--text-muted)",
              borderColor: "var(--border-subtle)",
              background: "var(--bg-elevated)",
            }}
          >
            Lainnya — tulis sendiri...
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              autoFocus
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Tuliskan alasan..."
              className="flex-1 text-[0.82rem] px-3 py-2.5 rounded-md"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customReason.trim()) {
                  onConfirm(customReason.trim());
                }
              }}
            />
            <button
              onClick={() => {
                if (customReason.trim()) onConfirm(customReason.trim());
              }}
              disabled={!customReason.trim()}
              className="px-4 py-2.5 rounded-md text-[0.78rem] font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "rgba(248,113,113,0.08)",
                color: "#f87171",
                borderColor: "rgba(248,113,113,0.25)",
              }}
            >
              Konfirmasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #9 — UndoToast
// Toast countdown 10 detik dengan tombol "Batalkan".
// UI update terjadi segera; Supabase baru dipanggil setelah onConfirm.
// ─────────────────────────────────────────────────────────────────────────────

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onConfirm: () => void;
  durationMs?: number;
}

function UndoToast({
  message,
  onUndo,
  onConfirm,
  durationMs = 10000,
}: UndoToastProps) {
  const [remaining, setRemaining] = useState(Math.ceil(durationMs / 1000));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    const confirmTimer = setTimeout(() => {
      onConfirm();
    }, durationMs);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(confirmTimer);
      clearInterval(interval);
    };
  }, [durationMs, onConfirm]);

  const pct = (remaining / Math.ceil(durationMs / 1000)) * 100;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9998] w-full max-w-[360px] rounded-lg overflow-hidden shadow-xl transition-all duration-300"
      style={{
        transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
        opacity: visible ? 1 : 0,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className="h-[3px] transition-all"
        style={{
          width: `${pct}%`,
          background: "var(--coffee-latte)",
          transition: "width 1s linear",
        }}
      />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-[0.82rem] font-medium text-text-primary truncate">
            {message}
          </p>
          <p className="font-mono text-[0.65rem] text-text-muted mt-0.5">
            Tersimpan dalam {remaining}d...
          </p>
        </div>
        <button
          onClick={onUndo}
          className="shrink-0 font-mono text-[0.72rem] tracking-[0.06em] px-3 py-1.5 rounded-md border font-medium transition-all duration-150 hover:-translate-y-0.5"
          style={{
            background: "rgba(196,149,106,0.1)",
            color: "var(--coffee-latte)",
            borderColor: "rgba(196,149,106,0.3)",
          }}
        >
          Batalkan
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineForm — form input data stop
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
  const [showSkipSheet, setShowSkipSheet] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StopFormData, string>>
  >({});
  // Fix #2 — realtime validation setelah submit pertama
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [shakeField, setShakeField] = useState<string | null>(null);
  // Fix #4 — GPS error state dengan pesan spesifik per jenis error
  const [gpsError, setGpsError] = useState<{
    type: "permission" | "timeout" | "unavailable";
    msg: string;
  } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Fix #4 — captureGPS dengan error handling per jenis error
  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError({
        type: "unavailable",
        msg: "GPS tidak tersedia di perangkat ini",
      });
      return;
    }
    setLocLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          locationCoords: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          locationAccuracy: Math.round(pos.coords.accuracy),
        }));
        setGpsError(null);
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        if (err.code === 1) {
          setGpsError({
            type: "permission",
            msg: "Izin lokasi ditolak — aktifkan di pengaturan HP",
          });
        } else if (err.code === 3) {
          setGpsError({
            type: "timeout",
            msg: "Sinyal GPS lemah — coba di luar ruangan",
          });
        } else {
          setGpsError({
            type: "unavailable",
            msg: "Lokasi tidak dapat dideteksi saat ini",
          });
        }
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }, []);

  useEffect(() => {
    captureGPS();
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }, [captureGPS]);

  useEffect(() => {
    const draft = {
      qty: form.qty,
      condition: form.condition,
      notes: form.notes,
    };
    localStorage.setItem(`rebru_draft_${stop.id}`, JSON.stringify(draft));
  }, [form.qty, form.condition, form.notes, stop.id]);

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

  // Fix #2 — validate bisa dipanggil kapan saja
  function validate(silent = false): boolean {
    const errs: typeof errors = {};
    if (form.qty <= 0) errs.qty = "Kuantitas harus lebih dari 0";
    if (!form.condition) errs.condition = "Pilih kondisi ampas";
    if (!silent) setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Fix #2 — realtime validation setelah hasAttemptedSubmit=true
  useEffect(() => {
    if (hasAttemptedSubmit) validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.qty, form.condition, hasAttemptedSubmit]);

  function triggerShake(field: string) {
    setShakeField(field);
    setTimeout(() => setShakeField(null), 500);
  }

  function handleSubmit() {
    setHasAttemptedSubmit(true);
    if (!validate()) {
      if (form.qty <= 0) triggerShake("qty");
      else if (!form.condition) triggerShake("condition");
      return;
    }
    localStorage.removeItem(`rebru_draft_${stop.id}`);
    onSubmit(form);
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

  // Fix #7 — pakai nomor stop bukan nama mitra agar tidak overflow
  const nextStopOrder = nextStopName ? stop.order + 1 : null;
  const ctaLabel = nextStopOrder
    ? `Simpan & Lanjut ke Stop ${nextStopOrder} →`
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
      {/* Fix #2 — keyframes shake untuk field validation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-5px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }
      `}</style>
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
        {/* Qty + Kondisi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Qty stepper */}
          <div>
            <label className="font-mono text-[0.62rem] tracking-[0.12em] uppercase text-text-muted mb-2 block">
              Kuantitas <span style={{ color: "var(--coffee-latte)" }}>*</span>
            </label>
            {/* Fix #2 — shake saat qty invalid setelah submit pertama */}
            <div
              className="flex items-center gap-2"
              style={{
                animation: shakeField === "qty" ? "shake 0.45s ease" : "none",
              }}
            >
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
            {/* Fix #2 — shake saat kondisi belum dipilih setelah submit pertama */}
            <div
              className="flex gap-2 h-9"
              style={{
                animation:
                  shakeField === "condition" ? "shake 0.45s ease" : "none",
              }}
            >
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

        {/* Lokasi */}
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
            {/* Fix #4 — ikon berubah sesuai state */}
            <i
              className={`fas fa-${locLoading ? "circle-notch fa-spin" : "location-dot"} text-sm shrink-0`}
              style={{
                color: locLoading
                  ? "var(--text-muted)"
                  : gpsError
                    ? gpsError.type === "permission"
                      ? "#f87171"
                      : "var(--coffee-latte)"
                    : "var(--forest-sage)",
              }}
            />
            {locLoading ? (
              <span className="font-mono text-[0.75rem] text-text-muted animate-pulse flex-1">
                Mendeteksi lokasi...
              </span>
            ) : gpsError ? (
              <div className="flex-1 min-w-0">
                <span
                  className="font-mono text-[0.72rem] block"
                  style={{
                    color:
                      gpsError.type === "permission"
                        ? "#f87171"
                        : "var(--coffee-latte)",
                  }}
                >
                  {gpsError.msg}
                </span>
                {gpsError.type === "permission" && (
                  <span className="font-mono text-[0.62rem] text-text-muted block mt-0.5">
                    Pengaturan → Privasi → Lokasi → Browser
                  </span>
                )}
              </div>
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
              <span className="font-mono text-[0.75rem] text-text-muted flex-1">
                Menunggu GPS...
              </span>
            )}
            <button
              onClick={captureGPS}
              className="font-mono text-[0.65rem] shrink-0 transition-colors hover:opacity-70"
              style={{ color: "var(--coffee-latte)" }}
              title="Coba lagi deteksi lokasi"
              aria-label="Refresh lokasi GPS"
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
              setForm((p) => ({ ...p, notes: e.target.value.slice(0, 500) }))
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

        {/* Action buttons */}
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
          {/* REC 7 — tombol Lewati langsung buka QuickSkipSheet */}
          <button
            onClick={() => setShowSkipSheet(true)}
            className="px-4 py-3 rounded-md text-[0.75rem] font-mono tracking-[0.06em] border text-text-muted hover:text-text-secondary transition-all duration-150"
            style={{ borderColor: "var(--border-default)" }}
          >
            Lewati
          </button>
        </div>

        <p className="font-mono text-[0.6rem] text-text-muted text-center -mt-1">
          Draft tersimpan otomatis · GPS diambil saat form dibuka
        </p>
      </div>

      {/* REC 7 — QuickSkipSheet muncul di bawah form body, bukan overlay */}
      {showSkipSheet && (
        <div
          className="border-t"
          style={{ borderColor: "rgba(248,113,113,0.15)" }}
        >
          <QuickSkipSheet
            stopName={stop.mitra_name}
            onConfirm={(reason) => {
              localStorage.removeItem(`rebru_draft_${stop.id}`);
              onSkip(reason);
              setShowSkipSheet(false);
            }}
            onCancel={() => setShowSkipSheet(false)}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RouteCard
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
            {/*
              REC 3 — Timestamp selesai langsung di route card
              Sebelumnya hanya tampil di HistorySection
            */}
            {stop.status === "done" && stop.completed_at && (
              <span
                className="font-mono text-[0.65rem] flex items-center gap-1"
                style={{ color: "var(--forest-sage)" }}
              >
                <i className="fas fa-check text-[0.55rem]" />
                selesai {stop.completed_at}
              </span>
            )}
            {stop.status === "skipped" && stop.skip_reason && (
              <span
                className="font-mono text-[0.65rem]"
                style={{ color: "#f87171" }}
              >
                {stop.skip_reason}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          <StatusBadge stop={stop} />
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
  // Fix #9 — callback spesifik untuk satu stop yang di-commit setelah undo window
  onCommitStop?: (stop: RouteStop) => void;
  onHeroAction?: (stopId: string) => void;
}

export default function RouteSection({
  collectorName,
  routeDate,
  initialStops,
  onStopsChange,
  onCommitStop,
  onHeroAction,
}: RouteSectionProps) {
  const [stops, setStops] = useState<RouteStop[]>(initialStops);
  const [activeStopId, setActiveStopId] = useState<string | null>(() => {
    return initialStops.find((s) => s.status === "pending")?.id ?? null;
  });
  const [heroFormOpen, setHeroFormOpen] = useState(false);
  // Fix #9 — undo state: UI sudah update, DB commit tertunda 10 detik
  const [undoState, setUndoState] = useState<{
    stopId: string;
    prevStop: RouteStop;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const doneStops = stops.filter((s) => s.status === "done");
  const nextPendingStop = stops.find((s) => s.status === "pending") ?? null;
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
    // Menutup hero form jika collector membuka stop dari route list
    setHeroFormOpen(false);
  }

  // Fix #9 — applyWithUndo: update UI segera, commit DB setelah 10d
  function applyWithUndo(
    stopId: string,
    updated: RouteStop[],
    message: string,
  ) {
    const prevStop = stops.find((s) => s.id === stopId)!;
    const committedStop = updated.find((s) => s.id === stopId)!;
    // Jika ada undo pending sebelumnya, langsung confirm dulu
    if (undoState) undoState.onConfirm();
    updateStops(updated);
    setHeroFormOpen(false);
    const currentIdx = updated.findIndex((s) => s.id === stopId);
    const nextPending = updated
      .slice(currentIdx + 1)
      .find((s) => s.status === "pending");
    setActiveStopId(nextPending?.id ?? null);
    setUndoState({
      stopId,
      prevStop,
      message,
      // onConfirm: kirim tepat satu stop ke page.tsx via onCommitStop
      onConfirm: () => {
        setUndoState(null);
        onCommitStop?.(committedStop);
      },
    });
  }

  function handleSubmit(stopId: string, formData: StopFormData) {
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
            photo_file: formData.photo ?? undefined,
            location_coords: formData.locationCoords ?? undefined,
            location_accuracy: formData.locationAccuracy ?? undefined,
            completed_at: timeStr,
          }
        : s,
    );
    const stopName = stops.find((s) => s.id === stopId)?.mitra_name ?? "Stop";
    applyWithUndo(
      stopId,
      updated,
      `✓ ${stopName} — ${formData.qty} kg tersimpan`,
    );
  }

  function handleSkip(stopId: string, reason: string) {
    const updated = stops.map((s) =>
      s.id === stopId
        ? { ...s, status: "skipped" as const, skip_reason: reason }
        : s,
    );
    const stopName = stops.find((s) => s.id === stopId)?.mitra_name ?? "Stop";
    applyWithUndo(stopId, updated, `${stopName} dilewati — ${reason}`);
  }

  // Fix #9 — batalkan: kembalikan stop ke state sebelumnya
  function handleUndo() {
    if (!undoState) return;
    const restored = stops.map((s) =>
      s.id === undoState.stopId ? undoState.prevStop : s,
    );
    setStops(restored);
    setActiveStopId(undoState.stopId);
    setHeroFormOpen(false);
    setUndoState(null);
  }

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

      {/*
        REC 4 — Hero Card dengan form inline di dalamnya
        Sebelumnya: tombol "Mulai Catat →" membuka form di route list
        (disorienting scroll, terutama di mobile)
        Sekarang: form muncul tepat di dalam blok hero card ini sendiri
      */}
      {nextPendingStop && (
        <div
          className="mb-5 rounded-lg overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${heroFormOpen ? "var(--coffee-latte)" : "var(--border-default)"}`,
          }}
        >
          {/* Label */}
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{ background: "rgba(196,149,106,0.08)" }}
          >
            <span
              className="font-mono text-[0.62rem] tracking-[0.12em] uppercase"
              style={{ color: "var(--coffee-latte)" }}
            >
              Stop berikutnya
            </span>
            <span
              className="font-mono text-[0.62rem] tracking-[0.1em]"
              style={{ color: "var(--text-muted)" }}
            >
              Stop {nextPendingStop.order} dari {stops.length}
            </span>
          </div>

          {/* Info stop */}
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[1rem] font-semibold text-text-primary truncate">
                  {nextPendingStop.mitra_name}
                </p>
                <p className="text-[0.78rem] text-text-muted mt-0.5 truncate">
                  {nextPendingStop.address}
                </p>
              </div>
              <CategoryPill cat={nextPendingStop.mitra_category} />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <i
                  className="fas fa-clock text-[0.65rem]"
                  style={{ color: "var(--text-muted)" }}
                />
                <span
                  className="font-mono text-[0.72rem]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {nextPendingStop.scheduled_time || "—"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <i
                  className="fas fa-weight-hanging text-[0.65rem]"
                  style={{ color: "var(--text-muted)" }}
                />
                <span
                  className="font-mono text-[0.72rem]"
                  style={{ color: "var(--text-primary)" }}
                >
                  ~{nextPendingStop.estimated_kg} kg
                </span>
              </div>
            </div>

            {/* REC 4 — CTA: toggle form di dalam hero card, bukan scroll ke route list */}
            {!heroFormOpen && (
              <button
                onClick={() => {
                  setHeroFormOpen(true);
                  // Sync route list agar stop ini tidak terbuka dua kali
                  setActiveStopId(null);
                  onHeroAction?.(nextPendingStop.id);
                }}
                className="w-full py-3 rounded-md text-[0.85rem] font-medium tracking-[0.03em] transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "var(--coffee-latte)",
                  color: "var(--bg-primary)",
                  border: "none",
                }}
              >
                Mulai Catat →
              </button>
            )}
          </div>

          {/* REC 4 — InlineForm muncul di dalam hero card (proximity terjaga) */}
          {heroFormOpen && (
            <div
              className="border-t"
              style={{ borderColor: "rgba(196,149,106,0.2)" }}
            >
              <InlineForm
                stop={nextPendingStop}
                nextStopName={
                  stops
                    .filter(
                      (s) =>
                        s.status === "pending" && s.id !== nextPendingStop.id,
                    )
                    .sort((a, b) => a.order - b.order)[0]?.mitra_name ?? null
                }
                onSubmit={(data) => handleSubmit(nextPendingStop.id, data)}
                onSkip={(reason) => handleSkip(nextPendingStop.id, reason)}
              />
            </div>
          )}
        </div>
      )}

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
              <div key={stop.id} id={`stop-card-${stop.id}`}>
                <RouteCard
                  stop={stop}
                  isActive={activeStopId === stop.id}
                  nextStop={nextPending ?? null}
                  onToggle={() => handleToggle(stop.id)}
                  onSubmit={(data) => handleSubmit(stop.id, data)}
                  onSkip={(reason) => handleSkip(stop.id, reason)}
                />
              </div>
            );
          })}
        </div>

        {/* Completion banner — hanya tampil setelah undo window tutup */}
        {stops.every((s) => s.status !== "pending") && !undoState && (
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

      {/* Fix #9 — UndoToast: commit ke DB setelah 10d atau saat dismiss */}
      {undoState && (
        <UndoToast
          message={undoState.message}
          onUndo={handleUndo}
          onConfirm={undoState.onConfirm}
          durationMs={10000}
        />
      )}
    </div>
  );
}
