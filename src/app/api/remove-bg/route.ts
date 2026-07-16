import { NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rateLimited = await checkRateLimit(req, "remove-bg", 15, 60);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No se envió una imagen" }, { status: 400 });
    }

    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return NextResponse.json(
        { error: `La imagen supera el límite de ${maxSizeMB} MB` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || "image/png" });

    const resultBlob = await removeBackground(blob);

    const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(resultBuffer.length),
      },
    });
  } catch (err) {
    console.error("[remove-bg] Error:", err);
    return NextResponse.json(
      { error: "Error al procesar la imagen. Intenta con otra imagen." },
      { status: 500 },
    );
  }
}
