import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ── Tailwind class merger (shadcn/ui pattern) ────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Number formatters ─────────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

// ── WhatsApp order URL builder ────────────────────────────────────────────────
export function buildWhatsAppOrderURL(
  phone: string,
  productName: string,
  qty: number,
  total: number,
): string {
  const message = encodeURIComponent(
    `Halo Rebru! Saya ingin memesan:\n\n` +
      `Produk : ${productName}\n` +
      `Jumlah : ${qty}\n` +
      `Total  : ${formatCurrency(total)}\n\n` +
      `Mohon konfirmasi ketersediaan. Terima kasih 🌱`,
  );
  return `https://wa.me/${phone}?text=${message}`;
}

// ── Slug helper ───────────────────────────────────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}
