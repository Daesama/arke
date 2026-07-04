import { NextResponse } from "next/server";
import { verifyWompiSignature } from "@/lib/wompi/webhook";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-event-checksum") ?? "";
    const timestamp = req.headers.get("x-event-timestamp") ?? "";

    if (!verifyWompiSignature(body, signature, timestamp)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const transaction = event.data?.transaction;

    if (!transaction) {
      return NextResponse.json({ error: "No transaction data" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const paymentRef = transaction.reference;
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
        payment_reference: transaction.id,
        status: orderStatus,
        ...(status === "APPROVED" && { paid_at: new Date().toISOString() }),
      })
      .eq("payment_reference", paymentRef);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
