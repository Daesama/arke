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
    const status = transaction.status;

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
