import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const rateLimited = await checkRateLimit(req, "remove-bg", 15, 60);
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 });
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
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/png";
    const dataUri = `data:${mimeType};base64,${base64}`;

    const falResponse = await fetch("https://queue.fal.run/fal-ai/birefnet", {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: dataUri,
        model: "General Use (Light)",
        operating_resolution: "1024x1024",
        output_format: "png",
      }),
    });

    if (!falResponse.ok) {
      const errText = await falResponse.text().catch(() => "");
      console.error("[remove-bg] fal.ai error:", falResponse.status, errText);
      return NextResponse.json(
        { error: "Error al procesar la imagen. Intenta de nuevo." },
        { status: 502 },
      );
    }

    const data = await falResponse.json();
    const imageUrl = data.image?.url;

    if (!imageUrl) {
      console.error("[remove-bg] No image in fal.ai response:", data);
      return NextResponse.json(
        { error: "No se pudo procesar la imagen." },
        { status: 502 },
      );
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Error al descargar la imagen procesada." },
        { status: 502 },
      );
    }

    const resultBuffer = Buffer.from(await imageResponse.arrayBuffer());

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
      { error: "Error al procesar la imagen. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
