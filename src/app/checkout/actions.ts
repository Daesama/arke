"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ENVIO } from "@/lib/utils/pricing";

interface ShippingData {
  name: string;
  whatsapp: string;
  address: string;
  barrio: string;
  localidad: string;
  notes: string;
}

interface CartItemData {
  productId: string;
  designId: string | null;
  designImageUrl: string | null;
  designPrompt: string | null;
  genero: string;
  material: string;
  color: string;
  size: string;
  printPosition: string;
  designConfig: Record<string, unknown> | null;
  quantity: number;
  unitPrice: number;
}

interface CreateOrderResult {
  reference?: string;
  amountInCents?: number;
  orderId?: string;
  orderNumber?: number;
  error?: string;
}

export async function createOrder(
  shipping: ShippingData,
  items: CartItemData[],
): Promise<CreateOrderResult> {
  let user;
  try {
    const supabaseAuth = await createClient();
    const { data } = await supabaseAuth.auth.getUser();
    user = data?.user;
  } catch {
    return { error: "Error de autenticación. Intenta de nuevo." };
  }

  if (!user) {
    return { error: "Debes iniciar sesión para completar tu pedido." };
  }

  const supabase = createAdminClient();

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const total = subtotal + ENVIO;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      shipping_name: shipping.name,
      shipping_phone: shipping.whatsapp,
      shipping_address: `${shipping.address}, Barrio ${shipping.barrio}`,
      shipping_city: shipping.localidad,
      shipping_department: "Bogotá D.C.",
      shipping_notes: shipping.notes || null,
      payment_method: "wompi_card",
      payment_status: "pending",
      subtotal,
      shipping_cost: ENVIO,
      discount: 0,
      total,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    console.error("Order creation error:", orderError);
    return { error: "Error al crear el pedido. Intenta de nuevo." };
  }

  const productSlugs = [...new Set(items.map((i) => i.productId))];
  const { data: products } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", productSlugs);

  const slugToId: Record<string, string> = {};
  for (const p of products ?? []) {
    slugToId[p.slug] = p.id;
  }

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: slugToId[item.productId] ?? null,
    design_id: item.designId || null,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    print_position: item.printPosition || "pecho",
    unit_price: item.unitPrice,
    design_snapshot: {
      prompt: item.designPrompt,
      image_url: item.designImageUrl,
      config: item.designConfig,
      genero: item.genero,
      material: item.material,
      color: item.color,
      talla: item.size,
    },
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Order items error:", itemsError);
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: `Error en items: ${itemsError.message}` };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const reference = `ARKE-${order.order_number}-${timestamp}`;
  const amountInCents = total * 100;

  await supabase
    .from("orders")
    .update({ payment_reference: reference })
    .eq("id", order.id);

  console.log("Pedido creado:", order.id, "ref:", reference, "monto:", amountInCents);

  return { reference, amountInCents, orderId: order.id, orderNumber: order.order_number };
}

const ZONE_FILE_NAMES: Record<string, string> = {
  pechoBolsillo: "pecho-bolsillo",
  abdominalGrande: "abdominal-grande",
  espaldaGrande: "espalda-grande",
};

function extractStoragePath(imageUrl: string): string | null {
  const marker = "/storage/v1/object/public/designs/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(imageUrl.substring(idx + marker.length));
}

export async function saveOrderAssets(
  formData: FormData,
): Promise<{ error?: string }> {
  const orderId = formData.get("orderId") as string;
  const orderNumber = formData.get("orderNumber") as string;

  const supabase = createAdminClient();
  const folder = `pedido-ARKE-${orderNumber}`;

  const mockupUrls: Record<string, string> = {};
  const organizedZoneUrls: Record<string, string> = {};

  for (const key of ["mockup-frente", "mockup-espalda"] as const) {
    const file = formData.get(key) as File | null;
    if (!file || file.size === 0) continue;

    const path = `${folder}/${key}.png`;
    const { error } = await supabase.storage
      .from("designs")
      .upload(path, file, { contentType: "image/png", upsert: true });

    if (!error) {
      const { data } = supabase.storage.from("designs").getPublicUrl(path);
      const side = key === "mockup-frente" ? "frente" : "espalda";
      mockupUrls[side] = data.publicUrl;
    } else {
      console.error(`[SaveAssets] Error uploading ${key}:`, error);
    }
  }

  const itemsJson = formData.get("items") as string | null;
  if (itemsJson) {
    const items: Array<{
      designConfig?: Record<
        string,
        { imageUrl?: string; enabled?: boolean }
      >;
    }> = JSON.parse(itemsJson);

    for (const item of items) {
      if (!item.designConfig) continue;
      for (const [zone, entry] of Object.entries(item.designConfig)) {
        if (!entry?.enabled || !entry?.imageUrl) continue;

        const storagePath = extractStoragePath(entry.imageUrl);
        if (!storagePath) continue;

        const ext = storagePath.split(".").pop() || "png";
        const zoneName = ZONE_FILE_NAMES[zone] || zone;
        const newPath = `${folder}/${zoneName}.${ext}`;

        const { error } = await supabase.storage
          .from("designs")
          .copy(storagePath, newPath);

        if (!error) {
          const { data } = supabase.storage
            .from("designs")
            .getPublicUrl(newPath);
          organizedZoneUrls[zone] = data.publicUrl;
        } else {
          console.error(`[SaveAssets] Error copying ${zone}:`, error);
        }
      }
    }
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("id, design_snapshot")
    .eq("order_id", orderId);

  if (orderItems) {
    for (const oi of orderItems) {
      const snapshot = (oi.design_snapshot || {}) as Record<string, unknown>;
      snapshot.organized = {
        folder,
        zone_urls: organizedZoneUrls,
        mockup_urls: mockupUrls,
      };
      await supabase
        .from("order_items")
        .update({ design_snapshot: snapshot })
        .eq("id", oi.id);
    }
  }

  console.log("[SaveAssets] Done:", { folder, mockupUrls, organizedZoneUrls });
  return {};
}
