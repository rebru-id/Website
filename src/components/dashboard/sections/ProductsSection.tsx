"use client";
// src/components/dashboard/sections/ProductsSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FASE 6 — Section Produk & Penjualan
//
// 3 sub-tab:
//   1. Catalog   — product grid, stock status, low-stock warning
//   2. Orders    — KPI row + pending order list with confirm action
//   3. Sales     — KPI row + SVG revenue line chart (ported from HTML v2)
//
// Data: all mock static, typed against src/types/index.ts.
// State: sub-tab selection + order confirm action (local).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { cn } from "@/utils";
import { formatCurrency } from "@/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SubTab = "catalog" | "orders" | "sales";
type OrderStatus = "pending" | "processing" | "done" | "cancelled";

interface AdminProduct {
  id: string;
  emoji: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  stockUnit: string;
  lowStockThreshold: number;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: string;
  items: string;
  total: number;
  status: OrderStatus;
  channel: "web" | "whatsapp";
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCTS: AdminProduct[] = [
  {
    id: "prod-1",
    emoji: "🌿",
    name: "Biochar Premium",
    description: "Ukuran 1–3mm, kadar karbon tinggi",
    price: 45000,
    unit: "kg",
    stock: 240,
    stockUnit: "kg",
    lowStockThreshold: 20,
  },
  {
    id: "prod-2",
    emoji: "🌱",
    name: "Kompos Organik",
    description: "Kompos matang siap pakai",
    price: 25000,
    unit: "kg",
    stock: 8,
    stockUnit: "kg",
    lowStockThreshold: 20,
  },
  {
    id: "prod-3",
    emoji: "🔥",
    name: "Briket Biochar",
    description: "Bahan bakar alternatif ramah lingkungan",
    price: 85000,
    unit: "pcs",
    stock: 45,
    stockUnit: "pcs",
    lowStockThreshold: 10,
  },
  {
    id: "prod-4",
    emoji: "🕯️",
    name: "Scented Candle",
    description: "Lilin aromaterapi berbahan ampas kopi",
    price: 50000,
    unit: "pcs",
    stock: 32,
    stockUnit: "pcs",
    lowStockThreshold: 10,
  },
  {
    id: "prod-5",
    emoji: "🧴",
    name: "Coffee Soap",
    description: "Sabun eksfoliasi alami dari ampas kopi",
    price: 15000,
    unit: "pcs",
    stock: 5,
    stockUnit: "pcs",
    lowStockThreshold: 10,
  },
  {
    id: "prod-6",
    emoji: "⭕",
    name: "Coaster",
    description: "Tatakan meja dari ampas kopi terkompresi",
    price: 20000,
    unit: "pcs",
    stock: 60,
    stockUnit: "pcs",
    lowStockThreshold: 10,
  },
];

const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-2847",
    customer: "PT Agro Makassar",
    items: "50 kg Biochar",
    total: 2250000,
    status: "pending",
    channel: "web",
    createdAt: "26 Mei 2026",
  },
  {
    id: "ord-2",
    orderNumber: "ORD-2846",
    customer: "CV Tani Sulsel",
    items: "30 kg Kompos",
    total: 750000,
    status: "pending",
    channel: "whatsapp",
    createdAt: "26 Mei 2026",
  },
  {
    id: "ord-3",
    orderNumber: "ORD-2845",
    customer: "Ibu Rahma Dewi",
    items: "10 kg Biochar · 5 kg Kompos",
    total: 575000,
    status: "processing",
    channel: "web",
    createdAt: "25 Mei 2026",
  },
  {
    id: "ord-4",
    orderNumber: "ORD-2844",
    customer: "Toko Hijau Nusantara",
    items: "20 kg Biochar",
    total: 900000,
    status: "done",
    channel: "whatsapp",
    createdAt: "24 Mei 2026",
  },
  {
    id: "ord-5",
    orderNumber: "ORD-2843",
    customer: "Anonim",
    items: "5 pcs Scented Candle",
    total: 250000,
    status: "cancelled",
    channel: "web",
    createdAt: "23 Mei 2026",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Config — order status styles
// ─────────────────────────────────────────────────────────────────────────────

const ORDER_STATUS_STYLE: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "var(--coffee-latte)",
    bg: "rgba(196,136,47,0.12)",
    border: "rgba(196,136,47,0.35)",
  },
  processing: {
    label: "Diproses",
    color: "var(--teal)",
    bg: "var(--teal-bg)",
    border: "var(--teal-border)",
  },
  done: {
    label: "Selesai",
    color: "var(--forest-sage)",
    bg: "rgba(45,90,46,0.12)",
    border: "rgba(45,90,46,0.3)",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "var(--text-muted)",
    bg: "rgba(255,255,255,0.04)",
    border: "var(--border-subtle)",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-tab bar
// ─────────────────────────────────────────────────────────────────────────────

function SubTabBar({
  active,
  onChange,
}: {
  active: SubTab;
  onChange: (t: SubTab) => void;
}) {
  const tabs: { id: SubTab; label: string }[] = [
    { id: "catalog", label: "Katalog Produk" },
    { id: "orders", label: "Manajemen Order" },
    { id: "sales", label: "Sales Report" },
  ];

  return (
    <div className="dash-stab-bar mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn("dash-stab", active === t.id && "active")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Catalog
// ─────────────────────────────────────────────────────────────────────────────

function CatalogTab() {
  const lowStockCount = PRODUCTS.filter(
    (p) => p.stock <= p.lowStockThreshold,
  ).length;

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        {lowStockCount > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "0.5px solid rgba(248,113,113,0.25)",
              color: "var(--color-error)",
            }}
          >
            <i className="fas fa-triangle-exclamation text-[10px]" />
            {lowStockCount} produk stok rendah — perlu restok
          </div>
        )}
        <button
          className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all"
          style={{
            background: "var(--coffee-latte)",
            color: "var(--bg-primary)",
            border: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <i className="fas fa-plus text-[10px]" />
          Tambah Produk
        </button>
      </div>

      {/* Product grid — 3 columns */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {PRODUCTS.map((p) => {
          const isLow = p.stock <= p.lowStockThreshold;
          return (
            <div
              key={p.id}
              className="rounded-lg overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: `0.5px solid ${isLow ? "rgba(248,113,113,0.3)" : "var(--border-subtle)"}`,
              }}
            >
              {/* Emoji header */}
              <div
                className="flex items-center justify-center"
                style={{
                  height: "84px",
                  background: "var(--bg-elevated)",
                  borderBottom: "0.5px solid var(--border-subtle)",
                  fontSize: "36px",
                }}
              >
                {p.emoji}
              </div>

              {/* Body */}
              <div style={{ padding: "13px 14px" }}>
                <p
                  className="font-medium mb-0.5"
                  style={{ fontSize: "13px", color: "var(--text-primary)" }}
                >
                  {p.name}
                </p>
                <p
                  className="mb-3"
                  style={{ fontSize: "11px", color: "var(--text-muted)" }}
                >
                  {p.description}
                </p>

                {/* Price */}
                <p
                  className="font-semibold mb-3"
                  style={{
                    fontSize: "14px",
                    color: "var(--coffee-latte)",
                  }}
                >
                  {formatCurrency(p.price)} / {p.unit}
                </p>

                {/* Low stock warning */}
                {isLow && (
                  <div
                    className="text-center rounded text-[10px] py-1 mb-2"
                    style={{
                      background: "rgba(248,113,113,0.08)",
                      color: "var(--color-error)",
                      border: "0.5px solid rgba(248,113,113,0.2)",
                    }}
                  >
                    ⚠ Stok rendah — perlu restok
                  </div>
                )}

                {/* Stock row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    style={{ fontSize: "11px", color: "var(--text-muted)" }}
                  >
                    Stok:
                  </span>
                  <span
                    className="px-2 py-px rounded text-[11px] font-medium"
                    style={{
                      background: isLow
                        ? "rgba(248,113,113,0.1)"
                        : "rgba(45,90,46,0.12)",
                      color: isLow
                        ? "var(--color-error)"
                        : "var(--forest-sage)",
                      border: `0.5px solid ${isLow ? "rgba(248,113,113,0.25)" : "rgba(45,90,46,0.3)"}`,
                    }}
                  >
                    {p.stock} {p.stockUnit}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button
                    className="flex-1 py-1.5 rounded text-[11px] transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "0.5px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-strong)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-subtle)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="flex-1 py-1.5 rounded text-[11px] transition-all"
                    style={{
                      background: "transparent",
                      border: "0.5px solid rgba(248,113,113,0.3)",
                      color: "var(--color-error)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(248,113,113,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Orders
// ─────────────────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ORDERS);

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    done: orders.filter((o) => o.status === "done").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  function confirmOrder(id: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: "processing" as OrderStatus } : o,
      ),
    );
  }

  const kpiItems = [
    { label: "Pending", value: counts.pending, color: "var(--coffee-latte)" },
    { label: "Diproses", value: counts.processing, color: "var(--teal)" },
    { label: "Selesai", value: counts.done, color: "var(--forest-sage)" },
    {
      label: "Dibatalkan",
      value: counts.cancelled,
      color: "var(--text-muted)",
    },
  ];

  return (
    <div>
      {/* KPI row */}
      <div
        className="grid gap-2.5 mb-5"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {kpiItems.map((k) => (
          <div
            key={k.label}
            className="rounded-lg text-center"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "14px",
            }}
          >
            <p
              className="text-[10px] uppercase tracking-wider mb-1.5"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {k.label}
            </p>
            <p
              className="text-[22px] font-semibold leading-none"
              style={{ color: k.color, letterSpacing: "-0.02em" }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Order list */}
      <div className="flex flex-col gap-2.5">
        {orders.map((order) => {
          const s = ORDER_STATUS_STYLE[order.status];
          return (
            <div
              key={order.id}
              className="flex items-center gap-3 rounded-lg"
              style={{
                background: "var(--bg-card)",
                border: "0.5px solid var(--border-subtle)",
                padding: "14px 16px",
              }}
            >
              {/* Left: order info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-space-mono)",
                    }}
                  >
                    {order.orderNumber}
                  </span>
                  <span
                    className="px-2 py-px rounded text-[10px]"
                    style={{
                      background: s.bg,
                      color: s.color,
                      border: `0.5px solid ${s.border}`,
                    }}
                  >
                    {s.label}
                  </span>
                  {/* Channel badge */}
                  <span
                    className="px-1.5 py-px rounded text-[9px] uppercase tracking-wider"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                      border: "0.5px solid var(--border-subtle)",
                      fontFamily: "var(--font-space-mono)",
                    }}
                  >
                    {order.channel}
                  </span>
                </div>
                <p
                  className="font-medium mb-0.5"
                  style={{ fontSize: "13px", color: "var(--text-primary)" }}
                >
                  {order.customer}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {order.items}
                </p>
              </div>

              {/* Right: total + action */}
              <div className="text-right flex-shrink-0">
                <p
                  className="font-medium mb-2"
                  style={{
                    fontSize: "14px",
                    color: "var(--coffee-latte)",
                  }}
                >
                  {formatCurrency(order.total)}
                </p>
                {order.status === "pending" && (
                  <button
                    onClick={() => confirmOrder(order.id)}
                    className="px-3 py-1.5 rounded text-[11px] transition-all"
                    style={{
                      background: "rgba(45,90,46,0.12)",
                      color: "var(--forest-sage)",
                      border: "0.5px solid rgba(45,90,46,0.35)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(45,90,46,0.22)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "rgba(45,90,46,0.12)")
                    }
                  >
                    Konfirmasi ▶
                  </button>
                )}
                {order.status === "processing" && (
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--teal)" }}
                  >
                    Sedang diproses
                  </span>
                )}
                {order.status === "done" && (
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--forest-sage)" }}
                  >
                    ✓ Selesai
                  </span>
                )}
                {order.status === "cancelled" && (
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Dibatalkan
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Sales Report
// ─────────────────────────────────────────────────────────────────────────────

function SalesTab() {
  const kpiItems = [
    {
      label: "Revenue Bulan Ini",
      value: "Rp 28.4 Jt",
      sub: "▲ +22% vs Apr",
      subColor: "var(--forest-sage)",
      color: "var(--coffee-latte)",
    },
    {
      label: "Total Order",
      value: "24",
      sub: "4 pending",
      subColor: "var(--text-muted)",
      color: "var(--text-primary)",
    },
    {
      label: "Avg Order Value",
      value: "Rp 1.18 Jt",
      sub: "▲ +8%",
      subColor: "var(--forest-sage)",
      color: "var(--text-primary)",
    },
  ];

  return (
    <div>
      {/* KPI row */}
      <div
        className="grid gap-2.5 mb-5"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {kpiItems.map((k) => (
          <div
            key={k.label}
            className="rounded-lg"
            style={{
              background: "var(--bg-card)",
              border: "0.5px solid var(--border-subtle)",
              padding: "14px 16px",
            }}
          >
            <p
              className="text-[10px] uppercase tracking-wider mb-1.5"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-space-mono)",
              }}
            >
              {k.label}
            </p>
            <p
              className="font-semibold leading-none mb-1"
              style={{
                fontSize: "22px",
                color: k.color,
                letterSpacing: "-0.02em",
              }}
            >
              {k.value}
            </p>
            <p style={{ fontSize: "11px", color: k.subColor }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart card */}
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border-subtle)",
          padding: "16px 18px",
        }}
      >
        <p
          className="mb-3"
          style={{ fontSize: "11px", color: "var(--text-muted)" }}
        >
          Revenue Trend — Juta Rupiah (Jan–Mei 2026)
        </p>

        {/* SVG line chart — ported from rebru_dashboard_v2.html */}
        <svg
          viewBox="0 0 500 130"
          style={{ width: "100%", maxHeight: "130px" }}
          aria-label="Revenue trend chart Jan-May 2026"
        >
          <defs>
            <linearGradient id="revenue-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C4882F" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#C4882F" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1="0"
            y1="20"
            x2="500"
            y2="20"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="55"
            x2="500"
            y2="55"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="90"
            x2="500"
            y2="90"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />

          {/* Area fill */}
          <path
            d="M50,65 L150,52 L250,40 L350,49 L450,20 L450,110 L350,110 L250,110 L150,110 L50,110 Z"
            fill="url(#revenue-gradient)"
          />

          {/* Line */}
          <polyline
            points="50,65 150,52 250,40 350,49 450,20"
            fill="none"
            stroke="#C4882F"
            strokeWidth="1.5"
          />

          {/* Data points */}
          <circle cx="50" cy="65" r="3" fill="#C4882F" />
          <circle cx="150" cy="52" r="3" fill="#C4882F" />
          <circle cx="250" cy="40" r="3" fill="#C4882F" />
          <circle cx="350" cy="49" r="3" fill="#C4882F" />
          <circle cx="450" cy="20" r="4" fill="#C4882F" />

          {/* Month labels */}
          <text
            x="50"
            y="122"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            Jan
          </text>
          <text
            x="150"
            y="122"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            Feb
          </text>
          <text
            x="250"
            y="122"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            Mar
          </text>
          <text
            x="350"
            y="122"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            Apr
          </text>
          <text
            x="450"
            y="122"
            textAnchor="middle"
            fill="#C4882F"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
            fontWeight="500"
          >
            Mei ▲
          </text>

          {/* Value labels */}
          <text
            x="50"
            y="60"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            14
          </text>
          <text
            x="150"
            y="47"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            18
          </text>
          <text
            x="250"
            y="35"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            22
          </text>
          <text
            x="350"
            y="44"
            textAnchor="middle"
            fill="#574E44"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
          >
            19
          </text>
          <text
            x="450"
            y="15"
            textAnchor="middle"
            fill="#C4882F"
            fontSize="9"
            fontFamily="DM Sans,sans-serif"
            fontWeight="500"
          >
            28
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductsSection — main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductsSection() {
  const [activeTab, setActiveTab] = useState<SubTab>("catalog");

  return (
    <div>
      {/* Section header */}
      <div className="dash-section-header">
        <h2 className="dash-section-title">Produk & Penjualan</h2>
        <p className="dash-section-sub">
          6 produk aktif · 2 order pending konfirmasi
        </p>
      </div>

      {/* Sub-tab navigation */}
      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "catalog" && <CatalogTab />}
      {activeTab === "orders" && <OrdersTab />}
      {activeTab === "sales" && <SalesTab />}
    </div>
  );
}
