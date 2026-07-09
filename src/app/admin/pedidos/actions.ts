"use server";

import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/database";

export async function getAllOrders() {
  const supabase = await createClient();

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
