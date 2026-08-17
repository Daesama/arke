"use server";

import { RateLimiterMemory } from "rate-limiter-flexible";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  ENVIO,
  calcularSubtotal,
  getActiveZonesFromConfig,
} from "@/lib/utils/pricing";
import { resolveDiscount, type AppliedDiscount } from "@/lib/discounts";
import type { TshirtGenero, TshirtMaterial } from "@/types/database";
import type { DesignZoneConfig } from "@/types/design";

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

/** 10 intentos de código por cuenta cada minuto. */
const intentosDeCodigo = new RateLimiterMemory({ points: 10, duration: 60 });

const MATERIALES: TshirtMaterial[] = [
  "piel_de_durazno",
  "algodon_licrado",
  "seda_fria",
];
const GENEROS: TshirtGenero[] = ["mujer", "hombre"];
const MAX_QUANTITY = 20;

/**
 * Precio de un item calculado por el servidor.
 *
 * El carrito vive en localStorage (Zustand persist), así que unitPrice y
 * quantity llegan bajo control del cliente y NO se pueden usar para
 * cobrar: editar localStorage bastaría para pedir una camiseta a $1.000.
 * Acá se rearma el precio desde la misma tabla que ve el usuario en
 * /crear y /catalogo, con material, género y zonas de estampado.
 *
 * Devuelve null si el item viene mal formado, y entonces el pedido no
 * se crea.
 */
function precioItemServidor(
  item: CartItemData,
): { unitPrice: number; quantity: number } | null {
  const material = item.material as TshirtMaterial;
  const genero = item.genero as TshirtGenero;

  if (!MATERIALES.includes(material)) return null;
  if (!GENEROS.includes(genero)) return null;

  const zones = getActiveZonesFromConfig(
    (item.designConfig ?? undefined) as DesignZoneConfig | undefined,
  );
  if (zones.length === 0) return null;

  const quantity = Math.floor(Number(item.quantity));
  if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return null;
  }

  return { unitPrice: calcularSubtotal(material, genero, zones), quantity };
}

/**
 * Valida un código para mostrárselo al usuario mientras llena el
 * checkout. Es solo para la UI — el descuento que de verdad se cobra lo
 * vuelve a calcular createOrder, así que manipular esta respuesta desde
 * el navegador no cambia el precio.
 */
export async function validarCodigoDescuento(
  code: string,
  subtotal: number,
): Promise<{ code?: string; amount?: number; label?: string; error?: string }> {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Inicia sesión para usar un código." };

  // Los códigos son palabras cortas y adivinables, así que se limita el
  // ritmo de intentos por cuenta para que no se puedan enumerar.
  try {
    await intentosDeCodigo.consume(user.id);
  } catch {
    return { error: "Demasiados intentos. Espera un momento." };
  }

  const { discount, error } = await resolveDiscount(code, subtotal, user.id);
  if (error || !discount) return { error: error ?? "Código inválido." };

  return discount;
}

export async function createOrder(
  shipping: ShippingData,
  items: CartItemData[],
  discountCode?: string | null,
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

  if (items.length === 0) {
    return { error: "Tu carrito está vacío." };
  }

  // Precios del servidor: lo que mande el carrito es solo una sugerencia.
  const precios = items.map(precioItemServidor);
  if (precios.some((p) => p === null)) {
    console.error("[Checkout] Item inválido en el carrito", {
      userId: user.id,
    });
    return {
      error: "Hay un producto inválido en tu carrito. Vacíalo y vuelve a armarlo.",
    };
  }

  const preciosOk = precios as { unitPrice: number; quantity: number }[];
  const subtotal = preciosOk.reduce(
    (sum, p) => sum + p.unitPrice * p.quantity,
    0,
  );

  // El descuento se recalcula acá aunque el checkout ya lo haya validado:
  // esta es la cuenta de la que sale amountInCents, o sea lo que se le
  // firma a Wompi. Si el código venció entre que lo escribió y pagó, o
  // viene inventado desde el navegador, simplemente cobramos el total.
  let descuento: AppliedDiscount | null = null;
  if (discountCode) {
    const { discount } = await resolveDiscount(discountCode, subtotal, user.id);
    descuento = discount ?? null;
  }

  const total = subtotal + ENVIO - (descuento?.amount ?? 0);

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
      discount: descuento?.amount ?? 0,
      discount_code: descuento?.code ?? null,
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

  const orderItems = items.map((item, i) => ({
    order_id: order.id,
    product_id: slugToId[item.productId] ?? null,
    design_id: item.designId || null,
    quantity: preciosOk[i].quantity,
    size: item.size,
    color: item.color,
    print_position: item.printPosition || "pecho",
    unit_price: preciosOk[i].unitPrice,
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

  return {};
}
