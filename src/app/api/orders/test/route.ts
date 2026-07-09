import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ENVIO } from "@/lib/utils/pricing";

export async function POST(req: Request) {
  try {
    const { shipping, items } = await req.json();

    console.log("=== TEST ORDER: INICIO ===");
    console.log("Shipping:", JSON.stringify(shipping));
    console.log("Items:", JSON.stringify(items));

    // Auth: get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("=== TEST ORDER: ERROR - No user ===");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    console.log("User ID:", user.id);

    // Use admin client for insert operations to bypass RLS recursion
    const supabaseAdmin = createAdminClient();

    // Ensure product exists
    const slug = items[0]?.productId ?? "camiseta-clasica-algodon";
    let { data: product } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!product) {
      console.log("Product not found, skipping product check for test");
      // For test, we'll use a placeholder product ID
      product = { id: "00000000-0000-0000-0000-000000000000" };
    }
    console.log("Product ID:", product.id);

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0,
    );
    const total = subtotal + ENVIO;

    // Insert order using admin client to bypass RLS
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
      payment_method: "wompi_card" as const,
      payment_status: "approved",
      subtotal,
      shipping_cost: ENVIO,
      discount: 0,
      total,
    };
    console.log("Order payload:", JSON.stringify(orderPayload));

    const { data: order, error: orderError } = await supabaseAdmin
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

    // Insert order items — design_id is NOT NULL in schema, so create a placeholder if missing
    console.log("=== INSERTANDO ORDER_ITEMS ===");
    const orderItems = [];
    for (const item of items as Record<string, unknown>[]) {
      let designId = (item.designId && String(item.designId).length > 0)
        ? String(item.designId)
        : null;

      if (!designId) {
        console.log("No designId, creating placeholder design...");
        const { data: design, error: designErr } = await supabaseAdmin
          .from("designs")
          .insert({
            user_id: user.id,
            prompt: String(item.designPrompt ?? "Test order"),
            image_url: String(item.designImageUrl ?? ""),
            image_path: `test/${user.id}/test-${Date.now()}`,
            config: item.designConfig ?? {},
            is_catalog: false,
            is_public: false,
            ai_provider: "gemini",
          })
          .select("id")
          .single();

        if (designErr || !design) {
          console.log("Error creating placeholder design:", designErr);
          await supabaseAdmin.from("orders").delete().eq("id", order.id);
          return NextResponse.json({
            error: `Error creando design placeholder: ${designErr?.message}`,
          });
        }
        designId = design.id;
        console.log("Placeholder design created:", designId);
      }

      orderItems.push({
        order_id: order.id,
        product_id: product.id,
        design_id: designId,
        quantity: item.quantity ?? 1,
        size: item.size ?? "M",
        color: item.color ?? "negro",
        print_position: item.printPosition ?? "pecho",
        unit_price: item.unitPrice ?? 0,
        design_snapshot: {
          prompt: item.designPrompt ?? "",
          image_url: item.designImageUrl ?? "",
          config: item.designConfig ?? {},
          genero: item.genero ?? "unisex",
          material: item.material ?? "algodon",
          color: item.color ?? "negro",
          talla: item.size ?? "M",
        },
      });
    }
    console.log("Items payload:", JSON.stringify(orderItems));

    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems)
      .select();

    console.log("=== RESULTADO ORDER_ITEMS ===");
    console.log("Data:", JSON.stringify(itemsData));
    console.log("Error:", JSON.stringify(itemsError));

    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({
        error: `Error insertando items: ${itemsError.message}`,
      });
    }

    const reference = `TEST-${order.order_number}-${Date.now()}`;
    await supabaseAdmin
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
