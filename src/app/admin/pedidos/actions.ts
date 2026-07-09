"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/database";

export async function getAllOrders() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "No autorizado" };
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all orders:", error);
    return { error: "Error al obtener pedidos" };
  }

  return { orders: orders as (Order & { order_items: OrderItem[] })[] };
}
