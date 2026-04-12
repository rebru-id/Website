// src/services/order.ts

import { formatCurrency } from "@/utils";
import { CONFIG } from "@/constants/config";

// ─────────────────────────────────────────────
// Types (optional tapi recommended)
// ─────────────────────────────────────────────
interface CartItem {
  name: string;
  variant?: string;
  price: number;
  qty: number;
  subtotal: number;
}

// ─────────────────────────────────────────────
// ✅ Build message dari CART (single source of truth)
// ─────────────────────────────────────────────
export function buildCartMessage(items: CartItem[], total: number): string {
  let msg = `Halo Rebru! Saya ingin memesan:\n\n`;

  items.forEach((item, i) => {
    msg += `${i + 1}. *${item.name}*`;

    if (item.variant) {
      msg += ` (${item.variant})`;
    }

    msg += `\n   ${item.qty} × ${formatCurrency(item.price)}`;
    msg += ` = ${formatCurrency(item.subtotal)}\n\n`;
  });

  msg += `💰 *TOTAL: ${formatCurrency(total)}*\n\n`;
  msg += `Mohon konfirmasi ketersediaan & ongkir. Terima kasih 🌱`;

  return msg;
}

// ─────────────────────────────────────────────
// ✅ Universal WA URL builder (1 function only)
// ─────────────────────────────────────────────
export function buildWhatsAppOrderURL(message: string): string {
  const phone = CONFIG.whatsappNumber;

  if (!phone) {
    throw new Error("WhatsApp number is not configured");
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
