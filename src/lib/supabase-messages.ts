// src/lib/supabase-messages.ts
// ─────────────────────────────────────────────────────────────────────────────
// Data layer — contact_messages table (read + update untuk AdminDashboard)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

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

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, sender_name, phone, message, status, submitted_at")
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ContactMessage[]) ?? [];
}

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
