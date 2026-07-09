"use server";

import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/database";

export async function getUserOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // First get orders with order_items
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return { error: "Error al obtener pedidos" };
  }

  // Get design IDs from all order items
  const designIds = orders?.flatMap((order) =>
    order.order_items.map((item: any) => item.design_id)
  ).filter(Boolean);

  // Fetch designs separately
  let designsMap: Record<string, any> = {};
  if (designIds && designIds.length > 0) {
    const { data: designs } = await supabase
      .from("designs")
      .select("id, image_url, thumbnail_url")
      .in("id", designIds);

    if (designs) {
      designsMap = designs.reduce((acc, design) => {
        acc[design.id] = design;
        return acc;
      }, {} as Record<string, any>);
    }
  }

  // Attach designs to order items
  const ordersWithDesigns = orders?.map((order: any) => ({
    ...order,
    order_items: order.order_items.map((item: any) => ({
      ...item,
      design: designsMap[item.design_id] || null,
    })),
  }));

  return { orders: ordersWithDesigns as (Order & { order_items: (OrderItem & { design: { id: string; image_url: string; thumbnail_url: string | null } | null })[] })[] };
}
