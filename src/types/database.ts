export type OrderStatus =
  | "pending"
  | "paid"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod =
  | "wompi_card"
  | "wompi_pse"
  | "wompi_nequi"
  | "wompi_daviplata";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "declined"
  | "voided"
  | "error";

export type AIProvider = "gemini" | "fal" | "openai";

export type DesignCategory = "gaming" | "anime" | "abstracto" | "pop";

export type PrintPosition = "pecho" | "espalda" | "pecho-pequeño";

export type TshirtColor = "negro" | "blanco" | "gris" | "navy" | (string & {});

export type TshirtSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type TshirtGenero = "mujer" | "hombre";

export type TshirtMaterial = "piel_de_durazno" | "algodon_licrado" | "seda_fria";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  postal_code: string | null;
  role: "customer" | "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  material: string;
  available_colors: TshirtColor[];
  available_sizes: TshirtSize[];
  print_positions: PrintPosition[];
  mockup_images: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Design {
  id: string;
  user_id: string | null;
  prompt: string;
  ai_prompt: string | null;
  ai_provider: AIProvider;
  ai_model: string | null;
  image_url: string;
  image_path: string;
  thumbnail_url: string | null;
  config: Record<string, unknown>;
  is_catalog: boolean;
  category: DesignCategory | null;
  tags: string[] | null;
  is_public: boolean;
  generation_time_ms: number | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  user_id: string;
  status: OrderStatus;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_postal_code: string | null;
  shipping_notes: string | null;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  design_id: string;
  quantity: number;
  size: TshirtSize;
  color: TshirtColor;
  print_position: PrintPosition;
  unit_price: number;
  design_snapshot: {
    prompt: string;
    image_url: string;
    config: Record<string, unknown>;
  };
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  design_id: string | null;
  status: "active" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
