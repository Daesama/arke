import { NextResponse } from "next/server";
import { generateImage } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { prompt, userPrompt, userId } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await generateImage(prompt);

    const supabase = createAdminClient();
    const timestamp = Date.now();
    const folder = userId || "anonymous";
    const imagePath = `${folder}/${timestamp}.png`;
    let storedUrl = result.imageUrl;

    if (result.imageUrl.startsWith("data:")) {
      const base64Data = result.imageUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(imagePath, buffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        return NextResponse.json(
          { error: "Error subiendo la imagen a storage." },
          { status: 500 },
        );
      }

      const { data: publicUrl } = supabase.storage
        .from("designs")
        .getPublicUrl(imagePath);
      storedUrl = publicUrl.publicUrl;
    }

    let designId: string | null = null;

    const { data: designRow, error: insertError } = await supabase
      .from("designs")
      .insert({
        user_id: userId || null,
        prompt: userPrompt || prompt,
        ai_prompt: prompt,
        ai_provider: result.provider,
        ai_model: result.model,
        image_url: storedUrl,
        image_path: imagePath,
        generation_time_ms: result.generationTimeMs,
        is_catalog: false,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
    } else {
      designId = designRow.id;
    }

    return NextResponse.json({
      imageUrl: storedUrl,
      designId,
      provider: result.provider,
      generationTimeMs: result.generationTimeMs,
    });
  } catch (error) {
    const err = error as { message?: string; status?: number; code?: string; error?: { code?: string; message?: string } };
    console.error("=== GENERATE ERROR ===");
    console.error("Mensaje:", err.message);
    console.error("Status:", err.status);
    console.error("Código:", err.code);
    console.error("Error interno:", err.error?.code, err.error?.message);

    const isModeration = err.code === "moderation_blocked" ||
      err.error?.code === "moderation_blocked" ||
      (typeof err.message === "string" && err.message.includes("safety system"));

    const userMessage = isModeration
      ? "El diseño fue bloqueado por el filtro de seguridad. Intentá con otra descripción."
      : "Error generando el diseño. Intentá de nuevo.";

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
