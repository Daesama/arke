"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ZONE_KEYS = ["pechoBolsillo", "abdominalGrande", "espaldaGrande"] as const;

export async function createFreeOrder(formData: FormData): Promise<{
  orderNumber?: number;
  error?: string;
}> {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "No autorizado" };

  const genero = formData.get("genero") as string;
  const material = formData.get("material") as string;
  const color = formData.get("color") as string;
  const talla = formData.get("talla") as string;
  const shippingName = formData.get("shipping_name") as string;
  const shippingPhone = formData.get("shipping_phone") as string;
  const shippingAddress = formData.get("shipping_address") as string;
  const shippingBarrio = formData.get("shipping_barrio") as string;
  const shippingLocalidad = formData.get("shipping_localidad") as string;
  const shippingNotes = (formData.get("shipping_notes") as string) || null;

  if (!genero || !material || !color || !talla) {
    return { error: "Faltan datos de la camiseta" };
  }
  if (!shippingName || !shippingPhone || !shippingAddress || !shippingBarrio || !shippingLocalidad) {
    return { error: "Faltan datos de envío" };
  }

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.id === "designs")) {
    await supabase.storage.createBucket("designs", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
  }

  const designId = crypto.randomUUID();
  const config: Record<string, unknown> = {};
  let primaryImageUrl = "";

  for (const zone of ZONE_KEYS) {
    const file = formData.get(`zone_${zone}`) as File | null;
    if (!file || file.size === 0) continue;

    const ext = file.name.split(".").pop() ?? "png";
    const path = `admin/${designId}/${zone}.${ext}`;

    const { error } = await supabase.storage
      .from("designs")
      .upload(path, file, { contentType: file.type });

    if (error) {
      return { error: `Error subiendo ${zone}: ${error.message}` };
    }

    const { data: urlData } = supabase.storage
      .from("designs")
      .getPublicUrl(path);

    const transformRaw = formData.get(`transform_${zone}`) as string | null;
    config[zone] = {
      imageUrl: urlData.publicUrl,
      enabled: true,
      ...(transformRaw ? { transform: JSON.parse(transformRaw) } : {}),
    };
    if (!primaryImageUrl) primaryImageUrl = urlData.publicUrl;
  }

  if (!primaryImageUrl) {
    return { error: "Sube al menos una imagen de estampado" };
  }

  const { error: designError } = await supabase.from("designs").insert({
    id: designId,
    user_id: user.id,
    prompt: "Pedido gratis (admin)",
    image_url: primaryImageUrl,
    image_path: `admin/${designId}`,
    config: { genero, material, color, talla, zones: config },
    is_catalog: false,
    is_public: false,
  });

  if (designError) {
    return { error: `Error guardando diseño: ${designError.message}` };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", "camiseta-clasica-algodon")
    .single();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "paid",
      shipping_name: shippingName,
      shipping_phone: shippingPhone,
      shipping_address: `${shippingAddress}, Barrio ${shippingBarrio}`,
      shipping_city: shippingLocalidad,
      shipping_department: "Bogotá D.C.",
      shipping_notes: shippingNotes,
      payment_method: "admin_gratis",
      payment_status: "approved",
      payment_reference: `GRATIS-${Date.now()}`,
      subtotal: 0,
      shipping_cost: 0,
      discount: 0,
      total: 0,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return { error: `Error creando pedido: ${orderError?.message}` };
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: product?.id ?? null,
    design_id: designId,
    quantity: 1,
    size: talla,
    color,
    print_position: "pecho",
    unit_price: 0,
    design_snapshot: {
      prompt: "Pedido gratis (admin)",
      image_url: primaryImageUrl,
      config,
      genero,
      material,
      color,
      talla,
    },
  });

  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: `Error creando item: ${itemError.message}` };
  }

  return { orderNumber: order.order_number };
}
