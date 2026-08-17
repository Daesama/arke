import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/utils/rateLimit";

/**
 * Firma de integridad para el widget de Wompi.
 *
 * El monto NO se acepta del cliente. Antes se firmaba el amountInCents
 * que mandara el navegador, así que cualquiera podía pedir una firma
 * válida por $1.500 para su propio pedido de $45.000 y pagar eso: la
 * firma era correcta y el webhook, que solo empareja por referencia,
 * marcaba el pedido como pagado. Ahora el monto sale de la fila de
 * orders y lo que mande el cliente se ignora.
 */
export async function POST(req: Request) {
  const rateLimited = await checkRateLimit(req, "wompi-sign", 10, 60);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { reference } = await req.json();

    const secret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!reference) {
      return NextResponse.json(
        { error: "reference es requerido" },
        { status: 400 },
      );
    }

    if (!secret) {
      return NextResponse.json(
        { error: "WOMPI_INTEGRITY_SECRET no configurado" },
        { status: 500 },
      );
    }

    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, total, payment_status")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (orderError) {
      console.error("Wompi sign: error consultando pedido:", orderError);
      return NextResponse.json(
        { error: "Error generando firma" },
        { status: 500 },
      );
    }

    // Mismo error para "no existe" y "es de otro": nadie sondea referencias ajenas.
    if (!order || order.user_id !== user.id) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 },
      );
    }

    if (order.payment_status === "approved") {
      return NextResponse.json(
        { error: "Este pedido ya fue pagado" },
        { status: 409 },
      );
    }

    const amountInCents = order.total * 100;
    const stringToHash = `${reference}${amountInCents}COP${secret}`;
    const signature = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");

    // Se devuelve el monto para que el widget abra exactamente con el
    // que se firmó, sin depender de lo que el cliente traía calculado.
    return NextResponse.json({ signature, reference, amountInCents });
  } catch (error) {
    console.error("Wompi sign error:", error);
    return NextResponse.json(
      { error: "Error generando firma" },
      { status: 500 },
    );
  }
}
