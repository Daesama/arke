import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ENVIO } from "@/lib/utils/pricing";

export async function POST(req: Request) {
  try {
    const { shipping, items } = await req.json();

    console.log("=== TEST ORDER: INICIO ===");
    console.log("Shipping:", JSON.stringify(shipping));
    console.log("Items:", JSON.stringify(items));

    // Auth: get current user
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      console.log("=== TEST ORDER: ERROR - No user ===");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.log("User ID:", user.id);

    const supabase = createAdminClient();

    // Ensure product exists
    const slug = items[0]?.productId ?? "camiseta-clasica-algodon";
    let { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!product) {
      console.log("Product not found, creating:", slug);
      const { data: newProduct, error: prodErr } = await supabase
        .from("products")
        .insert({
          name: "Camiseta Clásica Algodón",
          slug,
          description: "Camiseta 100% algodón",
          base_price: 4500000,
          material: "Algodón 100%",
        })
        .select("id")
        .single();

      if (prodErr || !newProduct) {
        console.log("=== TEST ORDER: ERROR creating product ===", prodErr);
        return NextResponse.json({ error: `Error creando producto: ${prodErr?.message}` });
      }
      product = newProduct;
    }
    console.log("Product ID:", product.id);

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0,
    );
    const total = subtotal + ENVIO;

    // Insert order
    console.log("=== INSERTANDO ORDER ===");
    const orderPayload = {
      user_id: user.id,
      status: "paid",
      shipping_name: shipping.name,
      shipping_phone: shipping.whatsapp,
      shipping_address: `${shipping.address}, Barrio ${shipping.barrio}`,
      shipping_city: shipping.localidad,
      shipping_department: "Bogotá D.C.",
      shipping_notes: shipping.notes || null,
      payment_method: "cash_on_delivery" as const,
      payment_status: "approved",
      subtotal,
      shipping_cost: ENVIO,
      discount: 0,
      total,
    };
    console.log("Order payload:", JSON.stringify(orderPayload));

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id, order_number")
      .single();

    console.log("=== RESULTADO ORDER ===");
    console.log("Data:", JSON.stringify(order));
    console.log("Error:", JSON.stringify(orderError));

    if (orderError || !order) {
      return NextResponse.json({
        error: `Error insertando order: ${orderError?.message ?? "sin datos"}`,
      });
    }

    // Insert order items
    console.log("=== INSERTANDO ORDER_ITEMS ===");
    const orderItems = items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      product_id: product.id,
      design_id: (item.designId && String(item.designId).length > 0) ? item.designId : null,
      quantity: item.quantity ?? 1,
      size: item.size ?? "M",
      color: item.color ?? "#000000",
      print_position: item.printPosition ?? "pecho",
      unit_price: item.unitPrice ?? 0,
      design_snapshot: {
        prompt: item.designPrompt ?? "",
        image_url: item.designImageUrl ?? "",
        config: item.designConfig ?? {},
        genero: item.genero ?? "unisex",
        material: item.material ?? "algodon",
        color: item.color ?? "#000000",
        talla: item.size ?? "M",
      },
    }));
    console.log("Items payload:", JSON.stringify(orderItems));

    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    console.log("=== RESULTADO ORDER_ITEMS ===");
    console.log("Data:", JSON.stringify(itemsData));
    console.log("Error:", JSON.stringify(itemsError));

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({
        error: `Error insertando items: ${itemsError.message}`,
      });
    }

    const reference = `TEST-${order.order_number}-${Date.now()}`;
    await supabase
      .from("orders")
      .update({ payment_reference: reference })
      .eq("id", order.id);

    console.log("=== TEST ORDER: OK ===", order.id, reference);
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      reference,
    });
  } catch (err) {
    console.error("=== TEST ORDER: CATCH ===", err);
    return NextResponse.json(
      { error: `Error inesperado: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
