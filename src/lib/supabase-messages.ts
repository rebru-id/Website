// src/lib/supabase-messages.ts
// ─────────────────────────────────────────────────────────────────────────────
// Data layer — contact_messages table (read + update untuk AdminDashboard)
//
// Dipakai oleh:
//   MessageSection.tsx  → fetchContactMessages(), updateMessageStatus()
//   OverviewSection.tsx → fetchContactMessages(3), countUnreadMessages()
//   AdminDashboard.tsx  → countUnreadMessages() untuk badge nav
//
// CHANGELOG:
//   - fetchContactMessages: tambah parameter limit? (opsional, default semua)
//   - countUnreadMessages: fungsi baru untuk badge nav + KPI Overview
//   - Inisialisasi client TIDAK diubah — tetap module-level singleton
//     dengan @supabase/supabase-js (terbukti berfungsi)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

// Module-level singleton — dibuat sekali saat module di-load.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageStatus = "unread" | "read" | "done" | "archived";

export interface ContactMessage {
  id: string;
  sender_name: string;
  phone: string | null;
  message: string;
  status: MessageStatus;
  submitted_at: string;
  ip_address: string | null;
}

// ── Queries ───────────────────────────────────────────────────────────────────

// fetchContactMessages
// ─────────────────────────────────────────────────────────────────────────────
// @param limit  Opsional. Jika tidak diisi, ambil semua.
//   fetchContactMessages()   → semua pesan (MessageSection)
//   fetchContactMessages(3)  → 3 terbaru saja (OverviewSection)
export async function fetchContactMessages(
  limit?: number,
): Promise<ContactMessage[]> {
  let query = supabase
    .from("contact_messages")
    .select("id, sender_name, phone, message, status, submitted_at")
    .order("submitted_at", { ascending: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ContactMessage[]) ?? [];
}

// countUnreadMessages
// ─────────────────────────────────────────────────────────────────────────────
// Hanya mengembalikan angka count — tidak menarik isi pesan (head: true).
// Dipakai di: AdminDashboard (badge nav) + OverviewSection (KPI card)
export async function countUnreadMessages(): Promise<number> {
  const { count, error } = await supabase
    .from("contact_messages")
    .select("*", { count: "exact", head: true })
    .eq("status", "unread");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

// updateMessageStatus
// ─────────────────────────────────────────────────────────────────────────────
// Mengubah status satu pesan berdasarkan id.
// Dipanggil saat admin klik: Tandai Dibaca / Tandai Selesai / Arsip.
export async function updateMessageStatus(
  id: string,
  status: MessageStatus,
): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
