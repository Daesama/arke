import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { orderId, status } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const updateData: Record<string, unknown> = { status };

  if (status === "in_production")
    updateData.production_at = new Date().toISOString();
  if (status === "shipped")
    updateData.shipped_at = new Date().toISOString();
  if (status === "delivered")
    updateData.delivered_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
