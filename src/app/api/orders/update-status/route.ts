import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = ["pending", "paid", "in_production", "shipped", "delivered", "cancelled"];

export async function POST(req: Request) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { orderId, status } = await req.json();

  if (!orderId || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "in_production") updateData.production_at = new Date().toISOString();
  if (status === "shipped") updateData.shipped_at = new Date().toISOString();
  if (status === "delivered") updateData.delivered_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
