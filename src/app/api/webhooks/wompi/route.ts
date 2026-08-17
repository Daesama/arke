import { NextResponse } from "next/server";
import { verifyWompiSignature } from "@/lib/wompi/webhook";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function POST(req: Request) {
  const rateLimited = await checkRateLimit(req, "wompi-webhook", 30, 60);
  if (rateLimited) return rateLimited;
  const body = await req.text();
  const signature = req.headers.get("x-event-checksum") ?? "";
  const timestamp = req.headers.get("x-event-timestamp") ?? "";

  if (!verifyWompiSignature(body, signature, timestamp)) {
    console.error("Wompi webhook: invalid signature");
    return NextResponse.json({ received: true });
  }

  try {
    const event = JSON.parse(body);
    const transaction = event.data?.transaction;

    if (!transaction) {
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();
    const reference = transaction.reference;
    let status = transaction.status;

    // Segundo cerrojo sobre el monto: la firma de integridad ya ata el
    // valor a la referencia, pero si por lo que sea llega un APPROVED
    // por menos de lo que vale el pedido, no se marca como pagado.
    if (status === "APPROVED") {
      const { data: order } = await supabase
        .from("orders")
        .select("total")
        .eq("payment_reference", reference)
        .maybeSingle();

      const pagado = Number(transaction.amount_in_cents);
      const esperado = order ? order.total * 100 : null;

      if (esperado === null || !Number.isFinite(pagado) || pagado < esperado) {
        console.error("[Wompi webhook] Monto insuficiente, no se marca pagado", {
          reference,
          pagado,
          esperado,
        });
        status = "PAGO_INCOMPLETO";
      }
    }

    let paymentStatus: string;
    let orderStatus: string;

    switch (status) {
      case "APPROVED":
        paymentStatus = "approved";
        orderStatus = "paid";
        break;
      case "DECLINED":
        paymentStatus = "declined";
        orderStatus = "pending";
        break;
      case "VOIDED":
        paymentStatus = "voided";
        orderStatus = "cancelled";
        break;
      case "ERROR":
        paymentStatus = "error";
        orderStatus = "pending";
        break;
      default:
        paymentStatus = "pending";
        orderStatus = "pending";
    }

    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        ...(status === "APPROVED" && { paid_at: new Date().toISOString() }),
      })
      .eq("payment_reference", reference);
  } catch (error) {
    console.error("Wompi webhook processing error:", error);
  }

  return NextResponse.json({ received: true });
}
