"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderStatus } from "@/types/database";

const VALID_TRANSITIONS: OrderStatus[] = [
  "paid",
  "in_production",
  "shipped",
  "delivered",
];

const TIMESTAMP_FIELDS: Partial<Record<OrderStatus, string>> = {
  in_production: "production_at",
  shipped: "shipped_at",
  delivered: "delivered_at",
};

async function verifyAdmin() {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "No autenticado" as const };

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "No autorizado" as const };

  return { supabase, user };
}

export async function getAllOrders() {
  const auth = await verifyAdmin();
  if ("error" in auth) return { error: auth.error };

  const { data: orders, error } = await auth.supabase
    .from("orders")
    .select("*, order_items(*)")
    .neq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all orders:", error);
    return { error: "Error al obtener pedidos" };
  }

  const userIds = [...new Set(orders?.map((o) => o.user_id) ?? [])];
  const emailMap: Record<string, string> = {};
  await Promise.all(
    userIds.map(async (uid) => {
      const { data } = await auth.supabase.auth.admin.getUserById(uid);
      if (data?.user?.email) emailMap[uid] = data.user.email;
    }),
  );

  const ordersWithEmail = (orders ?? []).map((o) => ({
    ...o,
    user_email: emailMap[o.user_id] ?? null,
  }));

  return { orders: ordersWithEmail as (Order & { order_items: OrderItem[]; user_email: string | null })[] };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
) {
  const auth = await verifyAdmin();
  if ("error" in auth) return { error: auth.error };

  if (!VALID_TRANSITIONS.includes(newStatus)) {
    return { error: "Estado no válido" };
  }

  const update: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  const tsField = TIMESTAMP_FIELDS[newStatus];
  if (tsField) {
    update[tsField] = new Date().toISOString();
  }

  const { error } = await auth.supabase
    .from("orders")
    .update(update)
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order status:", error);
    return { error: "Error al actualizar estado" };
  }

  return { success: true };
}

export async function ensureTimestampColumns() {
  const auth = await verifyAdmin();
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase.rpc("exec_sql" as any, {
    query: `
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS production_at TIMESTAMPTZ;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
    `,
  });

  if (error) {
    console.error("Error ensuring timestamp columns:", error);
  }

  return { success: !error };
}
