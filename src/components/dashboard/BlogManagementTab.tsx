"use client";
// src/components/dashboard/BlogManagementTab.tsx

import { useState, useMemo } from "react";
import {
  BLOG_POSTS,
  CATEGORIES,
  type BlogPost,
  type BlogCategory,
} from "@/lib/blog-data";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type View = "list" | "editor";

type DraftPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: Exclude<BlogCategory, "all">;
  readTime: string;
  date: string;
  published: boolean;
  featured: boolean;
  bodyMarkdown: string;
};

const EMPTY_DRAFT: DraftPost = {
  slug: "",
  title: "",
  excerpt: "",
  category: "coffee-waste",
  readTime: "4 min",
  date: new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }),
  published: false,
  featured: false,
  bodyMarkdown: "",
};

// Warna per kategori
const CAT_COLORS: Record<string, string> = {
  "coffee-waste": "var(--coffee-latte)",
  "climate-impact": "var(--forest-sage)",
  "behind-the-process": "#c8a84b",
  "esg-partnership": "var(--forest-mist)",
  "product-insights": "#d4783a",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill font-mono text-[0.6rem] tracking-[0.1em] uppercase"
      style={{
        background: published ? "rgba(45,90,46,0.25)" : "rgba(200,168,75,0.15)",
        color: published ? "var(--forest-sage)" : "#c8a84b",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: published ? "var(--forest-sage)" : "#c8a84b" }}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Article List View
// ─────────────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "published" | "draft";

function ArticleList({
  posts,
  onNew,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  posts: BlogPost[];
  onNew: () => void;
  onEdit: (post: BlogPost) => void;
  onDelete: (slug: string) => void;
  onTogglePublish: (slug: string) => void;
}) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // ── Filtered posts ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchesSearch =
        search.trim() === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.published) ||
        (statusFilter === "draft" && !p.published);

      return matchesSearch && matchesStatus;
    });
  }, [posts, search, statusFilter]);

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  const STATUS_FILTERS: { id: StatusFilter; label: string; count?: number }[] =
    [
      { id: "all", label: "Semua", count: posts.length },
      { id: "published", label: "Published", count: publishedCount },
      { id: "draft", label: "Draft", count: draftCount },
    ];

  return (
    <div>
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className="font-display text-[1.3rem] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            All Articles
          </h3>
          <p
            className="font-mono text-[0.62rem] tracking-[0.12em] uppercase mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {publishedCount} published · {draftCount} draft
          </p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill font-mono text-[0.72rem] tracking-[0.1em] uppercase transition-all duration-300"
          style={{
            background:
              "linear-gradient(135deg, var(--coffee-warm), var(--coffee-mid))",
            color: "#f5efe6",
            border: "1px solid var(--border-strong)",
          }}
        >
          <i className="fas fa-plus text-[0.65rem]" />
          New Article
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="dash-filter-bar">
        <div className="relative flex-1">
          <i
            className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[0.7rem]"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul atau kategori..."
            className="dash-search-input"
            style={{ paddingLeft: "2rem" }}
          />
        </div>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`dash-filter-btn${statusFilter === f.id ? " active" : ""}`}
          >
            {f.label}
            {f.count !== undefined && (
              <span
                className="ml-1.5 font-mono text-[0.55rem] px-1.5 py-0.5 rounded-full"
                style={{
                  background:
                    statusFilter === f.id
                      ? "rgba(196,149,106,0.2)"
                      : "var(--bg-elevated)",
                  color:
                    statusFilter === f.id
                      ? "var(--coffee-latte)"
                      : "var(--text-muted)",
                }}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Article table ───────────────────────────────────────────────── */}
      <div
        className="overflow-x-auto rounded-md"
        style={{ border: "1px solid var(--border-subtle)" }}
      >
        <table className="dash-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Judul</th>
              <th>Kategori</th>
              <th>Read Time</th>
              <th>Status</th>
              <th>Featured</th>
              <th style={{ textAlign: "right" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="dash-empty-state">
                    <div className="dash-empty-icon">
                      <i className="fas fa-newspaper" />
                    </div>
                    <p className="font-display text-[1rem] text-text-primary">
                      {search
                        ? `Tidak ada artikel untuk "${search}"`
                        : "Tidak ada artikel dengan filter ini"}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="font-mono text-[0.68rem] tracking-[0.08em] uppercase px-3 py-1.5 rounded-md transition-all"
                        style={{
                          border: "1px solid var(--border-default)",
                          color: "var(--coffee-latte)",
                        }}
                      >
                        Reset pencarian
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((post) => (
                <tr key={post.slug}>
                  {/* Title */}
                  <td>
                    <div>
                      <p
                        className="font-medium text-[0.9rem] leading-tight mb-0.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {post.title}
                      </p>
                      <p
                        className="font-mono text-[0.6rem] tracking-[0.08em]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        /blog/{post.slug}
                      </p>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span
                      className="font-mono text-[0.62rem] tracking-[0.1em] uppercase px-2.5 py-1 rounded-pill"
                      style={{
                        background: `${CAT_COLORS[post.category]}18`,
                        color: CAT_COLORS[post.category],
                        border: `1px solid ${CAT_COLORS[post.category]}30`,
                      }}
                    >
                      {post.categoryLabel}
                    </span>
                  </td>

                  {/* Read time */}
                  <td>
                    <span
                      className="font-mono text-[0.72rem]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {post.readTime}
                    </span>
                  </td>

                  {/* Status — toggleable */}
                  <td>
                    <button onClick={() => onTogglePublish(post.slug)}>
                      <StatusPill published={post.published} />
                    </button>
                  </td>

                  {/* Featured */}
                  <td>
                    {post.featured ? (
                      <i
                        className="fas fa-star text-[0.78rem]"
                        style={{ color: "#c8a84b" }}
                      />
                    ) : (
                      <span style={{ color: "var(--border-strong)" }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                        style={{
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-muted)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--border-strong)";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--border-subtle)";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--text-muted)";
                        }}
                        title="Preview"
                      >
                        <i className="fas fa-eye text-[0.65rem]" />
                      </a>
                      <button
                        onClick={() => onEdit(post)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                        style={{
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-muted)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--border-strong)";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--border-subtle)";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--text-muted)";
                        }}
                        title="Edit"
                      >
                        <i className="fas fa-pen text-[0.65rem]" />
                      </button>

                      {/* Delete with confirm */}
                      {confirm === post.slug ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              onDelete(post.slug);
                              setConfirm(null);
                            }}
                            className="px-2.5 py-1 rounded-pill font-mono text-[0.6rem] tracking-[0.08em] uppercase"
                            style={{
                              background: "rgba(248,113,113,0.15)",
                              color: "#f87171",
                              border: "1px solid rgba(248,113,113,0.3)",
                            }}
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => setConfirm(null)}
                            className="px-2.5 py-1 rounded-pill font-mono text-[0.6rem] tracking-[0.08em] uppercase"
                            style={{
                              color: "var(--text-muted)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirm(post.slug)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                          style={{
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-muted)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "rgba(248,113,113,0.4)";
                            (e.currentTarget as HTMLElement).style.color =
                              "#f87171";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "var(--border-subtle)";
                            (e.currentTarget as HTMLElement).style.color =
                              "var(--text-muted)";
                          }}
                          title="Hapus"
                        >
                          <i className="fas fa-trash text-[0.65rem]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Result count ────────────────────────────────────────────────── */}
      {filtered.length > 0 && filtered.length !== posts.length && (
        <p
          className="font-mono text-[0.62rem] tracking-[0.08em] mt-3"
          style={{ color: "var(--text-muted)" }}
        >
          Menampilkan {filtered.length} dari {posts.length} artikel
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Article Editor — tidak ada perubahan logic, hanya minor style polish
// ─────────────────────────────────────────────────────────────────────────────

function ArticleEditor({
  initial,
  isNew,
  onSave,
  onCancel,
}: {
  initial: DraftPost;
  isNew: boolean;
  onSave: (draft: DraftPost) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<DraftPost>(initial);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DraftPost, string>>
  >({});

  const set = <K extends keyof DraftPost>(key: K, val: DraftPost[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: val };
      if (isNew && key === "title") next.slug = slugify(val as string);
      return next;
    });
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!draft.title.trim()) e.title = "Judul wajib diisi";
    if (!draft.slug.trim()) e.slug = "Slug wajib diisi";
    if (!draft.excerpt.trim()) e.excerpt = "Excerpt wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(draft);
  };

  const inputStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
    borderRadius: "10px",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontFamily: "var(--font-space-mono), monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
    marginBottom: "0.5rem",
  };

  const errorStyle = {
    fontFamily: "var(--font-space-mono), monospace",
    fontSize: "0.62rem",
    color: "#f87171",
    marginTop: "0.35rem",
  };

  const TEMPLATE = `## The Problem

Write your opening paragraph here...

## Key Insight

Add your main insight here.

## The Process

Describe the process or solution...

## Impact

What is the measurable impact?

## Conclusion

Final thoughts and call to action.`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-strong)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-subtle)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-muted)";
            }}
          >
            <i className="fas fa-arrow-left text-[0.65rem]" />
          </button>
          <div>
            <h3
              className="font-display text-[1.3rem] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {isNew ? "New Article" : "Edit Article"}
            </h3>
            <p
              className="font-mono text-[0.62rem] tracking-[0.1em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {isNew ? "Buat artikel baru" : `Editing: /blog/${draft.slug}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Publish toggle */}
          <button
            onClick={() => set("published", !draft.published)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill font-mono text-[0.68rem] tracking-[0.1em] uppercase transition-all duration-200"
            style={{
              background: draft.published
                ? "rgba(45,90,46,0.2)"
                : "transparent",
              border: draft.published
                ? "1px solid rgba(122,171,126,0.35)"
                : "1px solid var(--border-default)",
              color: draft.published
                ? "var(--forest-sage)"
                : "var(--text-muted)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: draft.published
                  ? "var(--forest-sage)"
                  : "var(--text-muted)",
              }}
            />
            {draft.published ? "Published" : "Draft"}
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill font-mono text-[0.72rem] tracking-[0.1em] uppercase transition-all duration-300"
            style={{
              background:
                "linear-gradient(135deg, var(--forest-moss), var(--forest-dark))",
              color: "#f5efe6",
              border: "1px solid rgba(74,124,78,0.4)",
            }}
          >
            <i className="fas fa-save text-[0.65rem]" />
            Simpan
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — main fields */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Title */}
          <div>
            <label style={labelStyle}>Judul Artikel *</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Contoh: Why Coffee Waste is a Hidden Environmental Problem"
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--border-strong)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-default)")
              }
            />
            {errors.title && <p style={errorStyle}>{errors.title}</p>}
          </div>

          {/* Slug */}
          <div>
            <label style={labelStyle}>Slug (URL) *</label>
            <div
              className="flex items-center rounded-[10px] overflow-hidden"
              style={{
                border: "1px solid var(--border-default)",
                background: "var(--bg-card)",
              }}
            >
              <span
                className="px-3 py-3 font-mono text-[0.72rem] flex-shrink-0"
                style={{
                  color: "var(--text-muted)",
                  borderRight: "1px solid var(--border-subtle)",
                }}
              >
                /blog/
              </span>
              <input
                type="text"
                value={draft.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder="auto-generated-from-title"
                style={{ ...inputStyle, border: "none", borderRadius: 0 }}
              />
            </div>
            {errors.slug && <p style={errorStyle}>{errors.slug}</p>}
          </div>

          {/* Excerpt */}
          <div>
            <label style={labelStyle}>Excerpt (ringkasan singkat) *</label>
            <textarea
              value={draft.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="1-2 kalimat ringkasan artikel yang muncul di kartu blog..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--border-strong)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-default)")
              }
            />
            {errors.excerpt && <p style={errorStyle}>{errors.excerpt}</p>}
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Konten Artikel
              </label>
              <button
                onClick={() => set("bodyMarkdown", TEMPLATE)}
                className="font-mono text-[0.6rem] tracking-[0.1em] uppercase px-3 py-1 rounded-pill transition-all duration-200"
                style={{
                  color: "var(--forest-sage)",
                  border: "1px solid rgba(122,171,126,0.25)",
                }}
              >
                <i className="fas fa-magic text-[0.55rem] mr-1" />
                Insert Template
              </button>
            </div>
            <textarea
              value={draft.bodyMarkdown}
              onChange={(e) => set("bodyMarkdown", e.target.value)}
              placeholder={
                "Tulis konten artikel di sini menggunakan format Markdown...\n\n## Heading\nParagraf biasa...\n\n> Blockquote"
              }
              rows={18}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "var(--font-space-mono), monospace",
                fontSize: "0.82rem",
                lineHeight: "1.7",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--border-strong)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-default)")
              }
            />
            <p
              className="font-mono text-[0.6rem] tracking-[0.08em] mt-2"
              style={{ color: "var(--text-muted)" }}
            >
              Format: Markdown. Akan dirender menjadi blok konten terstruktur
              setelah Supabase terhubung.
            </p>
          </div>
        </div>

        {/* Right — metadata sidebar */}
        <div className="flex flex-col gap-5">
          {/* Status */}
          <div
            className="rounded-md p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <p style={{ ...labelStyle, marginBottom: "1rem" }}>
              Status Publikasi
            </p>
            <div className="flex flex-col gap-3">
              {/* Published toggle */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[0.85rem]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Published
                </span>
                <button
                  onClick={() => set("published", !draft.published)}
                  className="relative w-10 h-5 rounded-full transition-all duration-300 flex-shrink-0"
                  style={{
                    background: draft.published
                      ? "var(--forest-sage)"
                      : "var(--border-strong)",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
                    style={{
                      background: "#f5efe6",
                      left: draft.published ? "calc(100% - 18px)" : "2px",
                    }}
                  />
                </button>
              </div>
              {/* Featured toggle */}
              <div className="flex items-center justify-between">
                <span
                  className="text-[0.85rem]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Featured
                </span>
                <button
                  onClick={() => set("featured", !draft.featured)}
                  className="relative w-10 h-5 rounded-full transition-all duration-300 flex-shrink-0"
                  style={{
                    background: draft.featured
                      ? "#c8a84b"
                      : "var(--border-strong)",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
                    style={{
                      background: "#f5efe6",
                      left: draft.featured ? "calc(100% - 18px)" : "2px",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Category */}
          <div
            className="rounded-md p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <label style={{ ...labelStyle, marginBottom: "0.75rem" }}>
              Kategori
            </label>
            <div className="flex flex-col gap-2">
              {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    set("category", cat.id as Exclude<BlogCategory, "all">)
                  }
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-left transition-all duration-200"
                  style={{
                    background:
                      draft.category === cat.id
                        ? `${CAT_COLORS[cat.id]}15`
                        : "transparent",
                    border:
                      draft.category === cat.id
                        ? `1px solid ${CAT_COLORS[cat.id]}30`
                        : "1px solid transparent",
                    color:
                      draft.category === cat.id
                        ? CAT_COLORS[cat.id]
                        : "var(--text-secondary)",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: CAT_COLORS[cat.id] }}
                  />
                  <span className="text-[0.82rem]">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div
            className="rounded-md p-5"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <label style={{ ...labelStyle, marginBottom: "0.75rem" }}>
              Meta
            </label>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ ...labelStyle, fontSize: "0.58rem" }}>
                  Read Time
                </label>
                <input
                  type="text"
                  value={draft.readTime}
                  onChange={(e) => set("readTime", e.target.value)}
                  placeholder="4 min"
                  style={{
                    ...inputStyle,
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.82rem",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--border-strong)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border-default)")
                  }
                />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: "0.58rem" }}>
                  Tanggal
                </label>
                <input
                  type="text"
                  value={draft.date}
                  onChange={(e) => set("date", e.target.value)}
                  placeholder="April 2025"
                  style={{
                    ...inputStyle,
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.82rem",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--border-strong)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--border-default)")
                  }
                />
              </div>
            </div>
          </div>

          {/* Preview link */}
          {!isNew && (
            <a
              href={`/blog/${draft.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2.5 rounded-pill font-mono text-[0.68rem] tracking-[0.1em] uppercase transition-all duration-200"
              style={{
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              <i className="fas fa-external-link-alt text-[0.6rem]" />
              Preview Artikel
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Tab Component
// ─────────────────────────────────────────────────────────────────────────────

export default function BlogManagementTab() {
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [view, setView] = useState<View>("list");
  const [editingPost, setEditingPost] = useState<DraftPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleNew = () => {
    setEditingPost({ ...EMPTY_DRAFT });
    setIsNew(true);
    setView("editor");
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      readTime: post.readTime,
      date: post.date,
      published: post.published,
      featured: post.featured,
      bodyMarkdown: "",
    });
    setIsNew(false);
    setView("editor");
  };

  const handleDelete = (slug: string) => {
    setPosts((prev) => prev.filter((p) => p.slug !== slug));
    showToast("Artikel dihapus");
  };

  const handleTogglePublish = (slug: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.slug === slug ? { ...p, published: !p.published } : p,
      ),
    );
  };

  const handleSave = (draft: DraftPost) => {
    if (isNew) {
      const newPost: BlogPost = {
        slug: draft.slug,
        title: draft.title,
        excerpt: draft.excerpt,
        category: draft.category,
        categoryLabel:
          CATEGORIES.find((c) => c.id === draft.category)?.label ??
          draft.category,
        readTime: draft.readTime,
        date: draft.date,
        published: draft.published,
        featured: draft.featured,
        content: [],
      };
      setPosts((prev) => [newPost, ...prev]);
      showToast("Artikel baru disimpan");
    } else {
      setPosts((prev) =>
        prev.map((p) =>
          p.slug === draft.slug
            ? {
                ...p,
                title: draft.title,
                excerpt: draft.excerpt,
                category: draft.category,
                categoryLabel:
                  CATEGORIES.find((c) => c.id === draft.category)?.label ??
                  draft.category,
                readTime: draft.readTime,
                date: draft.date,
                published: draft.published,
                featured: draft.featured,
              }
            : p,
        ),
      );
      showToast("Perubahan disimpan");
    }
    setView("list");
    setEditingPost(null);
  };

  const handleCancel = () => {
    setView("list");
    setEditingPost(null);
  };

  return (
    <div className="relative">
      {/* ── Toast notification ──────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-md transition-all duration-300"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid rgba(122,171,126,0.35)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <i
            className="fas fa-check-circle text-[0.85rem]"
            style={{ color: "var(--forest-sage)" }}
          />
          <span
            className="font-mono text-[0.72rem] tracking-[0.1em]"
            style={{ color: "var(--text-primary)" }}
          >
            {toast}
          </span>
        </div>
      )}

      {/* ── View router ─────────────────────────────────────────────────── */}
      {view === "list" && (
        <ArticleList
          posts={posts}
          onNew={handleNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePublish={handleTogglePublish}
        />
      )}
      {view === "editor" && editingPost && (
        <ArticleEditor
          initial={editingPost}
          isNew={isNew}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
