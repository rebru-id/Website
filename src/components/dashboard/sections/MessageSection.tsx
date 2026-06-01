"use client";
// src/components/dashboard/sections/MessageSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FASE 6B — Integrasi Supabase
//
// Perubahan dari versi sebelumnya:
//   - INITIAL_MESSAGES mock dihapus
//   - Data dibaca dari Supabase via fetchContactMessages()
//   - Sistem tag (Saran/Pertanyaan/Kritik) dihapus — tidak ada di DB
//   - email dihapus — tidak ada di DB; phone (opsional) menggantikannya
//   - Status update menulis ke Supabase via updateMessageStatus()
//   - sender_name dipetakan dari DB langsung ke tampilan
//   - Filter: Belum Dibaca | Semua
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  fetchContactMessages,
  updateMessageStatus,
  type ContactMessage,
  type MessageStatus,
} from "@/lib/supabase-messages";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return `${Math.floor(days / 7)} minggu lalu`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  MessageStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  unread: {
    label: "Belum Dibaca",
    color: "var(--coffee-latte)",
    bg: "rgba(196,149,106,0.10)",
    border: "rgba(196,149,106,0.30)",
  },
  read: {
    label: "Dibaca",
    color: "var(--teal)",
    bg: "var(--teal-bg)",
    border: "var(--teal-border)",
  },
  done: {
    label: "Selesai",
    color: "var(--forest-sage)",
    bg: "rgba(122,171,126,0.10)",
    border: "rgba(122,171,126,0.30)",
  },
  archived: {
    label: "Diarsip",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.04)",
    border: "var(--border-subtle)",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MessageListItem
// ─────────────────────────────────────────────────────────────────────────────

function MessageListItem({
  msg,
  isSelected,
  onClick,
}: {
  msg: ContactMessage;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isUnread = msg.status === "unread";
  const scfg = STATUS_CFG[msg.status];

  return (
    <div
      onClick={onClick}
      className="px-4 py-3 cursor-pointer transition-all duration-150 border-b"
      style={{
        background: isSelected ? "rgba(196,149,106,0.06)" : "transparent",
        borderColor: "var(--border-subtle)",
        borderLeft: isSelected
          ? "2px solid var(--coffee-latte)"
          : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          e.currentTarget.style.background = "var(--bg-elevated)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        {/* Name + unread dot */}
        <div className="flex items-center gap-1.5 min-w-0">
          {isUnread && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "var(--coffee-latte)" }}
            />
          )}
          <p
            className="text-[12px] leading-none truncate"
            style={{
              color: isSelected
                ? "var(--text-primary)"
                : isUnread
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              fontWeight: isUnread ? 500 : 400,
            }}
          >
            {msg.sender_name}
          </p>
        </div>

        {/* Time */}
        <span
          className="text-[10px] flex-shrink-0"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-space-mono)",
          }}
        >
          {timeAgo(msg.submitted_at)}
        </span>
      </div>

      {/* Preview */}
      <p
        className="text-[11px] leading-[1.5] line-clamp-2 mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        {msg.message}
      </p>

      {/* Status pill */}
      <span
        className="inline-flex items-center px-1.5 py-px rounded text-[9px] leading-none"
        style={{
          background: scfg.bg,
          color: scfg.color,
          border: `0.5px solid ${scfg.border}`,
        }}
      >
        {scfg.label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageDetail (panel kanan)
// ─────────────────────────────────────────────────────────────────────────────

function MessageDetail({
  msg,
  note,
  onNoteChange,
  onStatusChange,
  actionLoading,
}: {
  msg: ContactMessage;
  note: string;
  onNoteChange: (v: string) => void;
  onStatusChange: (status: MessageStatus) => void;
  actionLoading: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div
        className="px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p
              className="font-display font-semibold leading-tight mb-0.5 truncate"
              style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}
            >
              {msg.sender_name}
            </p>
            <p
              className="text-[10px]"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {formatDate(msg.submitted_at)} · {timeAgo(msg.submitted_at)}
            </p>
          </div>

          {/* Status badge */}
          <span
            className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded text-[10px]"
            style={{
              background: STATUS_CFG[msg.status].bg,
              color: STATUS_CFG[msg.status].color,
              border: `0.5px solid ${STATUS_CFG[msg.status].border}`,
              fontFamily: "var(--font-space-mono)",
            }}
          >
            {STATUS_CFG[msg.status].label}
          </span>
        </div>

        {/* Phone — opsional */}
        {msg.phone && (
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            <i className="fas fa-phone text-[9px] mr-1.5" aria-hidden />
            {msg.phone}
          </p>
        )}
      </div>

      {/* ── Message body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p
          className="text-[13px] leading-[1.85] whitespace-pre-wrap mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          {msg.message}
        </p>

        {/* Catatan internal */}
        <div
          className="pt-4"
          style={{ borderTop: "0.5px solid var(--border-subtle)" }}
        >
          <p
            className="text-[9px] tracking-[0.12em] uppercase mb-2"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-space-mono)",
            }}
          >
            Catatan Internal{" "}
            <span
              className="normal-case opacity-60"
              style={{ letterSpacing: 0 }}
            >
              (tidak terlihat pengirim)
            </span>
          </p>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Tulis catatan…"
            rows={3}
            className="w-full rounded-md px-3 py-2 text-[12px] outline-none resize-none transition-colors"
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-dm-sans)",
              fontStyle: "italic",
              lineHeight: "1.7",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-strong)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-subtle)")
            }
          />
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div
        className="px-5 py-3 flex gap-2 flex-shrink-0 flex-wrap"
        style={{ borderTop: "0.5px solid var(--border-subtle)" }}
      >
        {msg.status === "unread" && (
          <button
            onClick={() => onStatusChange("read")}
            disabled={actionLoading}
            className="flex-1 py-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: "var(--teal-bg)",
              color: "var(--teal)",
              border: "0.5px solid var(--teal-border)",
              opacity: actionLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(45,128,128,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--teal-bg)")
            }
          >
            <i className="fas fa-eye text-[9px]" aria-hidden />
            Tandai Dibaca
          </button>
        )}

        {(msg.status === "unread" || msg.status === "read") && (
          <button
            onClick={() => onStatusChange("done")}
            disabled={actionLoading}
            className="flex-1 py-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: "rgba(122,171,126,0.10)",
              color: "var(--forest-sage)",
              border: "0.5px solid rgba(122,171,126,0.30)",
              opacity: actionLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(122,171,126,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(122,171,126,0.10)")
            }
          >
            {actionLoading ? (
              <i
                className="fas fa-circle-notch fa-spin text-[9px]"
                aria-hidden
              />
            ) : (
              <i className="fas fa-check text-[9px]" aria-hidden />
            )}
            Tandai Selesai
          </button>
        )}

        {msg.status !== "archived" && (
          <button
            onClick={() => onStatusChange("archived")}
            disabled={actionLoading}
            className="py-2 px-3 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-muted)",
              border: "0.5px solid var(--border-subtle)",
              opacity: actionLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.borderColor = "var(--border-default)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          >
            <i className="fas fa-archive text-[9px]" aria-hidden />
            Arsip
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main — MessageSection
// ─────────────────────────────────────────────────────────────────────────────

type FilterMode = "unread" | "all";

export default function MessageSection() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<FilterMode>("unread");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchContactMessages();
      setMessages(data);
    } catch {
      setError("Gagal memuat pesan. Periksa koneksi Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-select first item when list loads
  useEffect(() => {
    if (messages.length > 0 && !selected) {
      const first =
        filter === "unread"
          ? (messages.find((m) => m.status === "unread") ?? messages[0])
          : messages[0];
      setSelected(first);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Status change ──────────────────────────────────────────────────────────
  async function handleStatusChange(newStatus: MessageStatus) {
    if (!selected) return;
    setActionLoading(true);

    try {
      await updateMessageStatus(selected.id, newStatus);
      const updated = { ...selected, status: newStatus };
      setMessages((prev) =>
        prev.map((m) => (m.id === selected.id ? updated : m)),
      );
      setSelected(updated);
    } catch {
      // Bisa ditambah toast
    } finally {
      setActionLoading(false);
    }
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered =
    filter === "unread"
      ? messages.filter((m) => m.status === "unread")
      : messages;

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <i
          className="fas fa-circle-notch fa-spin text-sm"
          style={{ color: "var(--text-muted)" }}
          aria-hidden
        />
        <span
          className="text-sm tracking-widest uppercase"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-space-mono)",
          }}
        >
          Memuat pesan…
        </span>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <i
          className="fas fa-exclamation-circle text-2xl"
          style={{ color: "#f87171" }}
          aria-hidden
        />
        <p
          className="text-sm"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-space-mono)",
          }}
        >
          {error}
        </p>
        <button
          onClick={loadMessages}
          className="px-4 py-2 rounded-md text-xs transition-all"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            border: "0.5px solid var(--border-default)",
          }}
        >
          <i className="fas fa-redo mr-1.5" aria-hidden /> Coba lagi
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Section header */}
      <div className="dash-section-header">
        <h2 className="dash-section-title">Pesan Masuk</h2>
        <p className="dash-section-sub">
          {unreadCount > 0
            ? `${unreadCount} pesan belum dibaca`
            : "Semua pesan telah dibaca"}
        </p>
      </div>

      {/* Split-pane */}
      <div
        className="rounded-lg overflow-hidden flex"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          height: "calc(100vh - 200px)",
          minHeight: "480px",
        }}
      >
        {/* ── List pane (kiri) ── */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{
            width: "300px",
            borderRight: "0.5px solid var(--border-subtle)",
          }}
        >
          {/* Filter tabs */}
          <div
            className="flex gap-1 px-3 py-2.5 flex-shrink-0"
            style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
          >
            {(["unread", "all"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-1 py-1.5 rounded text-[11px] transition-all"
                style={{
                  background:
                    filter === f ? "var(--bg-elevated)" : "transparent",
                  color:
                    filter === f ? "var(--text-primary)" : "var(--text-muted)",
                  border:
                    filter === f
                      ? "0.5px solid var(--border-default)"
                      : "0.5px solid transparent",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                {f === "unread" ? (
                  <>
                    Belum Dibaca
                    {unreadCount > 0 && (
                      <span
                        className="ml-1.5 px-1.5 py-px rounded-full text-[9px]"
                        style={{
                          background: "rgba(196,149,106,0.15)",
                          color: "var(--coffee-latte)",
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </>
                ) : (
                  "Semua"
                )}
              </button>
            ))}
          </div>

          {/* Message list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
                <i
                  className="fas fa-inbox text-xl"
                  style={{ color: "var(--text-muted)" }}
                  aria-hidden
                />
                <p
                  className="text-[11px]"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-space-mono)",
                  }}
                >
                  {filter === "unread"
                    ? "Tidak ada pesan baru"
                    : "Belum ada pesan"}
                </p>
              </div>
            ) : (
              filtered.map((msg) => (
                <MessageListItem
                  key={msg.id}
                  msg={msg}
                  isSelected={selected?.id === msg.id}
                  onClick={() => setSelected(msg)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Detail pane (kanan) ── */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <MessageDetail
              msg={selected}
              note={notes[selected.id] ?? ""}
              onNoteChange={(v) =>
                setNotes((prev) => ({ ...prev, [selected.id]: v }))
              }
              onStatusChange={handleStatusChange}
              actionLoading={actionLoading}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <i
                className="fas fa-envelope-open text-2xl"
                style={{ color: "var(--text-muted)" }}
                aria-hidden
              />
              <p
                className="text-[12px]"
                style={{
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-space-mono)",
                }}
              >
                Pilih pesan untuk dibaca
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
