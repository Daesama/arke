"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getReusableAdminDesigns } from "@/lib/catalog";
import { DESIGN_CATEGORIES, PRINT_ZONES, TSHIRT_COLORS } from "@/lib/utils/constants";
import type { SupabaseClient } from "@supabase/supabase-js";

const ZONE_KEYS = PRINT_ZONES.map((z) => z.key) as string[];
const CATEGORY_VALUES = DESIGN_CATEGORIES.map((c) => c.value) as string[];
const COLOR_SLUGS = TSHIRT_COLORS.map((c) => c.slug) as string[];

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];

/**
 * Todas las acciones de este panel escriben con service role (que salta
 * RLS), así que el check de admin tiene que hacerse acá explícitamente —
 * el layout de /admin protege la navegación, no la server action, que es
 * un endpoint invocable directamente.
 */
async function requireAdmin(): Promise<
  { supabase: SupabaseClient; userId: string } | { error: string }
> {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "No autorizado" };

  return { supabase, userId: user.id };
}

function revalidateCatalog() {
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
}

async function ensureDesignsBucket(supabase: SupabaseClient) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.find((b) => b.id === "designs")) return;

  await supabase.storage.createBucket("designs", {
    public: true,
    fileSizeLimit: MAX_FILE_BYTES,
    allowedMimeTypes: ALLOWED_MIME,
  });
}

/**
 * Guarda una camisa ya armada por el admin como item de catálogo.
 *
 * El FormData trae lo mismo que produce el editor de /crear (una imagen y
 * un transform por zona activa) más el color, el nombre y la categoría.
 * Género, material y talla NO se guardan: los elige el cliente al pedir,
 * y de ahí sale el precio.
 */
export async function createCatalogShirt(formData: FormData): Promise<{
  designId?: string;
  error?: string;
}> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const title = ((formData.get("title") as string) ?? "").trim();
  const category = (formData.get("category") as string) ?? "";
  const color = (formData.get("color") as string) ?? "";
  const publishNow = formData.get("is_public") === "true";
  const sortOrderRaw = (formData.get("sort_order") as string) ?? "0";

  if (!title) return { error: "Ponle un nombre a la camisa." };
  if (!COLOR_SLUGS.includes(color)) return { error: "Elige un color." };
  if (category && !CATEGORY_VALUES.includes(category)) {
    return { error: "Categoría inválida." };
  }

  // Se valida TODO antes de subir el primer archivo: si una zona falla a
  // mitad de camino quedarían imágenes huérfanas en Storage.
  const incoming: { zone: string; file: File; transform: string | null }[] = [];
  for (const zone of ZONE_KEYS) {
    const file = formData.get(`zone_${zone}`) as File | null;
    if (!file || file.size === 0) continue;
    if (file.size > MAX_FILE_BYTES) {
      return { error: `La imagen de ${zone} supera los 10MB.` };
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return { error: `Formato no soportado en ${zone}. Usa PNG, JPG o WEBP.` };
    }
    incoming.push({
      zone,
      file,
      transform: formData.get(`transform_${zone}`) as string | null,
    });
  }

  if (incoming.length === 0) {
    return { error: "Sube al menos una imagen de estampado." };
  }

  const sortOrder = Number.parseInt(sortOrderRaw, 10);

  await ensureDesignsBucket(supabase);

  const designId = crypto.randomUUID();
  const zonesConfig: Record<string, unknown> = {};
  const uploadedPaths: string[] = [];
  let primaryImageUrl = "";

  for (const { zone, file, transform } of incoming) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    // Las camisas propias viven bajo catalog/ en vez de <user_id>/ para
    // distinguirlas de las subidas de clientes de un vistazo en Storage.
    const path = `catalog/${designId}/${zone}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("designs")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      // Revierte lo ya subido antes de rendirse.
      if (uploadedPaths.length) {
        await supabase.storage.from("designs").remove(uploadedPaths);
      }
      console.error("[admin/catalogo] Error subiendo imagen:", uploadError);
      return { error: `Error subiendo ${zone}: ${uploadError.message}` };
    }

    uploadedPaths.push(path);
    const { data: urlData } = supabase.storage.from("designs").getPublicUrl(path);

    zonesConfig[zone] = {
      imageUrl: urlData.publicUrl,
      enabled: true,
      ...(transform ? { transform: JSON.parse(transform) } : {}),
    };

    if (!primaryImageUrl) primaryImageUrl = urlData.publicUrl;
  }

  const { error: dbError } = await supabase.from("designs").insert({
    id: designId,
    user_id: userId,
    prompt: "",
    image_url: primaryImageUrl,
    image_path: `catalog/${designId}`,
    config: { color, zones: zonesConfig },
    is_catalog: true,
    is_public: publishNow,
    category: category || null,
    title,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  });

  if (dbError) {
    // La fila no se creó: borra los archivos para no dejar huérfanos.
    await supabase.storage.from("designs").remove(uploadedPaths);
    console.error("[admin/catalogo] Error guardando camisa:", dbError);
    return { error: `Error guardando la camisa: ${dbError.message}` };
  }

  revalidateCatalog();
  return { designId };
}

/**
 * Convierte una camisa propia ya existente en item de catálogo.
 *
 * COPIA los archivos a `catalog/<nuevoId>/` y crea una fila nueva, en vez
 * de marcar `is_catalog = true` sobre la fila original: esa fila puede
 * estar referenciada por `order_items` (ON DELETE RESTRICT), así que
 * mutarla mezclaría el historial de un pedido con el catálogo público y
 * después no se podría sacar del catálogo.
 *
 * El `source_design_id` queda guardado en config para no ofrecer dos veces
 * la misma camisa en el selector.
 */
export async function importCatalogShirtFromExisting(input: {
  sourceDesignId: string;
  title: string;
  category: string;
  isPublic: boolean;
}): Promise<{ designId?: string; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase, userId } = auth;

  const title = input.title.trim();
  if (!title) return { error: "Ponle un nombre a la camisa." };
  if (input.category && !CATEGORY_VALUES.includes(input.category)) {
    return { error: "Categoría inválida." };
  }

  // No se confía en lo que manda el navegador: el id se busca dentro del
  // pool de camisas propias. Sin esto, un admin podría copiar al catálogo
  // el diseño de cualquier cliente pasando un id arbitrario.
  const reusable = await getReusableAdminDesigns(supabase);
  const source = reusable.find((r) => r.sourceDesignId === input.sourceDesignId);
  if (!source) {
    return { error: "Esa camisa ya no está disponible para reutilizar." };
  }
  if (source.alreadyInCatalog) {
    return { error: "Esa camisa ya está en el catálogo." };
  }

  const designId = crypto.randomUUID();
  const zonesConfig: Record<string, unknown> = {};
  const copiedPaths: string[] = [];
  let primaryImageUrl = "";

  for (const zone of ZONE_KEYS) {
    const sourcePath = source.sourcePaths[zone as keyof typeof source.sourcePaths];
    const entry = source.zones[zone as keyof typeof source.zones];
    if (!sourcePath || !entry) continue;

    const ext = sourcePath.split(".").pop()?.toLowerCase() ?? "png";
    const targetPath = `catalog/${designId}/${zone}.${ext}`;

    const { error: copyError } = await supabase.storage
      .from("designs")
      .copy(sourcePath, targetPath);

    if (copyError) {
      if (copiedPaths.length) {
        await supabase.storage.from("designs").remove(copiedPaths);
      }
      console.error("[admin/catalogo] Error copiando imagen:", copyError);
      return { error: `No se pudo copiar ${zone}: ${copyError.message}` };
    }

    copiedPaths.push(targetPath);
    const { data: urlData } = supabase.storage
      .from("designs")
      .getPublicUrl(targetPath);

    zonesConfig[zone] = {
      imageUrl: urlData.publicUrl,
      enabled: true,
      ...(entry.transform ? { transform: entry.transform } : {}),
    };

    if (!primaryImageUrl) primaryImageUrl = urlData.publicUrl;
  }

  if (!primaryImageUrl) {
    return { error: "Esa camisa no tiene imágenes copiables." };
  }

  const { error: dbError } = await supabase.from("designs").insert({
    id: designId,
    user_id: userId,
    prompt: "",
    image_url: primaryImageUrl,
    image_path: `catalog/${designId}`,
    config: {
      color: source.colorSlug,
      zones: zonesConfig,
      source_design_id: source.sourceDesignId,
    },
    is_catalog: true,
    is_public: input.isPublic,
    category: input.category || null,
    title,
    sort_order: 0,
  });

  if (dbError) {
    await supabase.storage.from("designs").remove(copiedPaths);
    console.error("[admin/catalogo] Error guardando camisa importada:", dbError);
    return { error: `Error guardando la camisa: ${dbError.message}` };
  }

  revalidateCatalog();
  return { designId };
}

export async function setCatalogDesignPublic(
  designId: string,
  isPublic: boolean,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase
    .from("designs")
    .update({ is_public: isPublic })
    .eq("id", designId)
    .eq("is_catalog", true);

  if (error) {
    console.error("[admin/catalogo] Error publicando:", error);
    return { error: error.message };
  }

  revalidateCatalog();
  return {};
}

export async function deleteCatalogDesign(
  designId: string,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const { data: design, error: readError } = await supabase
    .from("designs")
    .select("image_path, is_catalog")
    .eq("id", designId)
    .maybeSingle();

  if (readError) return { error: readError.message };
  if (!design) return { error: "El diseño ya no existe." };
  if (!design.is_catalog) return { error: "Ese diseño no es del catálogo." };

  // order_items referencia designs con ON DELETE RESTRICT: si alguien ya
  // compró este diseño, borrarlo falla. En ese caso se despublica, que
  // es lo que el admin realmente quiere (sacarlo del catálogo).
  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("design_id", designId);

  if (count && count > 0) {
    const { error } = await supabase
      .from("designs")
      .update({ is_public: false })
      .eq("id", designId);
    if (error) return { error: error.message };
    revalidateCatalog();
    return {
      error:
        "Este diseño ya tiene pedidos, no se puede borrar. Se despublicó del catálogo.",
    };
  }

  const { error: deleteError } = await supabase
    .from("designs")
    .delete()
    .eq("id", designId);

  if (deleteError) {
    console.error("[admin/catalogo] Error borrando:", deleteError);
    return { error: deleteError.message };
  }

  // image_path de un item de catálogo es la CARPETA `catalog/<id>`, no un
  // archivo: hay que listar su contenido y borrar cada objeto.
  if (design.image_path) {
    const { data: files } = await supabase.storage
      .from("designs")
      .list(design.image_path);

    if (files?.length) {
      await supabase.storage
        .from("designs")
        .remove(files.map((f) => `${design.image_path}/${f.name}`));
    }
  }

  revalidateCatalog();
  return {};
}
