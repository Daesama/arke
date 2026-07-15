"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/database";

export async function getUserOrders() {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const supabase = createAdminClient();

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

  interface DesignRef {
    id: string;
    image_url: string;
    thumbnail_url: string | null;
  }

  const designIds = orders?.flatMap((order) =>
    order.order_items.map((item: { design_id: string }) => item.design_id)
  ).filter(Boolean);

  let designsMap: Record<string, DesignRef> = {};
  if (designIds && designIds.length > 0) {
    const { data: designs } = await supabase
      .from("designs")
      .select("id, image_url, thumbnail_url")
      .in("id", designIds);

    if (designs) {
      designsMap = designs.reduce((acc, design) => {
        acc[design.id] = design;
        return acc;
      }, {} as Record<string, DesignRef>);
    }
  }

  const ordersWithDesigns = orders?.map((order) => ({
    ...order,
    order_items: order.order_items.map((item: { design_id: string } & Record<string, unknown>) => ({
      ...item,
      design: designsMap[item.design_id] || null,
    })),
  }));

  return { orders: ordersWithDesigns as (Order & { order_items: (OrderItem & { design: { id: string; image_url: string; thumbnail_url: string | null } | null })[] })[] };
}
