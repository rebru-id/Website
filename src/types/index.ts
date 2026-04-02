// ─────────────────────────────────────────────────────────────────────────────
// REBRU — Shared TypeScript Types
// Maps directly to the Supabase database schema
// ─────────────────────────────────────────────────────────────────────────────

// ── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = "admin" | "mitra" | "government";

export interface UserProfile {
  id: string;
  user_id: string;         // FK → auth.users
  name: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

// ── Partnership ───────────────────────────────────────────────────────────────

export type PartnerType = "supplier" | "collector" | "reseller";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type MitraType = "collector" | "processor" | "distributor";

export interface PartnerApplication {
  id: string;
  name: string;
  organization: string;
  phone: string;
  type: PartnerType;
  status: ApplicationStatus;
  created_at: string;
}

export interface Mitra {
  id: string;
  user_id?: string;        // nullable — mitra bisa ada sebelum punya akun
  name: string;
  type: MitraType;
  location: string;
  is_active: boolean;
  created_at: string;
}

// ── Waste & Supply ────────────────────────────────────────────────────────────

export type WasteType = "coffee" | "rice_husk" | "corn_husk" | "cocoa" | "coconut" | "biomass" | "organic";
export type CollectionStatus = "pending" | "processed";
export type ConversionMethod = "biochar" | "compost" | "briquette";

export interface WasteCollection {
  id: string;
  mitra_id: string;
  waste_type: WasteType;
  weight_kg: number;
  collection_date: string;
  status: CollectionStatus;
  created_at: string;
}

export interface Bioconversion {
  id: string;
  collection_id: string;
  method: ConversionMethod;
  output_product_id?: string;
  input_weight: number;
  output_weight: number;
  carbon_reduction: number;
  created_at: string;
}

// ── Products ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
}

// ── Orders & Transactions ─────────────────────────────────────────────────────

export type OrderChannel = "web" | "whatsapp";
export type OrderStatus = "pending" | "paid" | "shipped" | "done";

export interface Order {
  id: string;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  channel: OrderChannel;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// ── Impact ────────────────────────────────────────────────────────────────────

export interface ImpactLog {
  id: string;
  collection_id: string;
  co2_saved: number;
  waste_saved: number;
  created_at: string;
}

// ── Aggregated Views (Supabase Views) ─────────────────────────────────────────

export interface GlobalStats {
  total_waste_collected: number;  // kg
  total_co2_saved: number;        // ton
  total_products_sold: number;
  total_partners: number;
}

export interface MonthlyRecap {
  month: string;
  waste_collected: number;
  co2_saved: number;
  revenue: number;
}

// ── Communication ─────────────────────────────────────────────────────────────

export type ContactType = "general" | "partnership";

export interface ContactMessage {
  id: string;
  name: string;
  phone?: string;
  message: string;
  type: ContactType;
  created_at: string;
}
