import { NextResponse } from "next/server";
import { generateImage } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { prompt, userPrompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await generateImage(prompt);

    const supabaseAdmin = createAdminClient();
    const timestamp = Date.now();
    const imagePath = `${user.id}/${timestamp}.png`;
    let storedUrl = result.imageUrl;

    if (result.imageUrl.startsWith("data:")) {
      const base64Data = result.imageUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      const { error: uploadError } = await supabaseAdmin.storage
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

      const { data: publicUrl } = supabaseAdmin.storage
        .from("designs")
        .getPublicUrl(imagePath);
      storedUrl = publicUrl.publicUrl;
    }

    let designId: string | null = null;

    const { data: designRow, error: insertError } = await supabaseAdmin
      .from("designs")
      .insert({
        user_id: user.id,
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
    console.error("Generate error:", err.message);

    const isModeration = err.code === "moderation_blocked" ||
      err.error?.code === "moderation_blocked" ||
      (typeof err.message === "string" && err.message.includes("safety system"));

    const userMessage = isModeration
      ? "El diseño fue bloqueado por el filtro de seguridad. Intenta con otra descripción."
      : "Error generando el diseño. Intenta de nuevo.";

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
