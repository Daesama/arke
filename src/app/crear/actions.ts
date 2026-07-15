"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ZONE_KEYS = ["pechoBolsillo", "abdominalGrande", "espaldaGrande"] as const;

export async function uploadDesignAndSave(formData: FormData): Promise<{
  designId?: string;
  config?: Record<string, unknown>;
  primaryImageUrl?: string;
  error?: string;
}> {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión." };

  const supabase = createAdminClient();

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.id === "designs")) {
    const { error: bucketError } = await supabase.storage.createBucket(
      "designs",
      {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      },
    );
    if (bucketError) {
      console.error("Bucket creation error:", bucketError);
      return { error: `Error creando bucket: ${bucketError.message}` };
    }

  }

  const designId = crypto.randomUUID();
  const config: Record<string, unknown> = {};
  let primaryImageUrl = "";

  const genero = formData.get("genero") as string;
  const material = formData.get("material") as string;
  const color = formData.get("color") as string;
  const talla = formData.get("talla") as string;

  for (const zone of ZONE_KEYS) {
    const file = formData.get(`zone_${zone}`) as File | null;
    if (!file || file.size === 0) continue;

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${designId}/${zone}.${ext}`;


    const { error } = await supabase.storage
      .from("designs")
      .upload(path, file, { contentType: file.type });

    if (error) {
      console.error(`[Upload] Error ${zone}:`, error);
      return { error: `Error subiendo ${zone}: ${error.message}` };
    }

    const { data: urlData } = supabase.storage
      .from("designs")
      .getPublicUrl(path);

    const transformRaw = formData.get(`transform_${zone}`) as string | null;
    config[zone] = {
      imageUrl: urlData.publicUrl,
      enabled: true,
      ...(transformRaw ? { transform: JSON.parse(transformRaw) } : {}),
    };

    if (!primaryImageUrl) primaryImageUrl = urlData.publicUrl;
  }

  if (!primaryImageUrl) {
    return { error: "No se subió ninguna imagen." };
  }

  const { error: dbError } = await supabase.from("designs").insert({
    id: designId,
    user_id: user.id,
    prompt: "",
    image_url: primaryImageUrl,
    image_path: `${user.id}/${designId}`,
    config: { genero, material, color, talla, zones: config },
    is_catalog: false,
    is_public: false,
  });

  if (dbError) {
    console.error("[Upload] DB error:", dbError);
    return { error: `Error guardando diseño: ${dbError.message}` };
  }


  return { designId, config, primaryImageUrl };
}
