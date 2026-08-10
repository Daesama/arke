import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CatalogDesign,
  DesignZone,
  DesignZoneConfig,
  DesignZoneEntry,
  ReusableShirt,
} from "@/types/design";
import type { DesignCategory, TshirtColor } from "@/types/database";
import { PRINT_ZONES, TSHIRT_COLORS } from "@/lib/utils/constants";

/** Columnas que necesita el catálogo — nunca `select("*")` sobre designs. */
const CATALOG_COLUMNS =
  "id, title, image_url, config, category, is_public, sort_order, created_at";

interface CatalogRow {
  id: string;
  title: string | null;
  image_url: string;
  config: {
    color?: string;
    zones?: DesignZoneConfig;
  } | null;
  category: string | null;
  is_public: boolean;
  sort_order: number;
  created_at: string;
}

/** Negro es el default de la marca: fondos oscuros, identidad no negociable. */
const FALLBACK_COLOR = TSHIRT_COLORS[0];

function toCatalogDesign(row: CatalogRow): CatalogDesign {
  const slug = (row.config?.color as TshirtColor | undefined) ?? FALLBACK_COLOR.slug;
  const swatch = TSHIRT_COLORS.find((c) => c.slug === slug) ?? FALLBACK_COLOR;

  return {
    id: row.id,
    title: row.title?.trim() || "Camisa ARKE",
    colorHex: swatch.value,
    colorSlug: slug,
    zones: row.config?.zones ?? {},
    imageUrl: row.image_url,
    category: (row.category as DesignCategory | null) ?? null,
    isPublic: row.is_public,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/**
 * Diseños propios de ARKE. `includeDrafts` solo debe usarse desde el
 * panel admin (con service role); el catálogo público lo deja en false
 * para no exponer borradores.
 */
export async function getCatalogDesigns(
  supabase: SupabaseClient,
  { includeDrafts = false }: { includeDrafts?: boolean } = {},
): Promise<CatalogDesign[]> {
  let query = supabase
    .from("designs")
    .select(CATALOG_COLUMNS)
    .eq("is_catalog", true)
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (!includeDrafts) query = query.eq("is_public", true);

  const { data, error } = await query;

  if (error) {
    console.error("[catalog] Error cargando diseños:", error);
    return [];
  }

  return (data as CatalogRow[]).map(toCatalogDesign);
}

/**
 * Extrae el path dentro del bucket a partir de la URL pública que guardó
 * Storage. Se necesita el path (no la URL) para poder copiar el objeto
 * server-side sin volver a descargar la imagen.
 */
export function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/designs/";
  const at = url.indexOf(marker);
  if (at === -1) return null;

  const raw = url.slice(at + marker.length).split("?")[0];
  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Diseños propios ya existentes, listos para reutilizarse en el catálogo.
 *
 * "Propio" = el autor del diseño es un perfil con role = 'admin'. Ese es
 * el criterio en vez del prefijo del path (`admin/`), porque ese prefijo
 * solo lo pone /admin/pedido-gratis: un diseño que el admin subió desde
 * /crear queda bajo `<userId>/` y también es nuestro.
 *
 * Requiere service role (lee diseños de otros usuarios y perfiles).
 */
export async function getReusableAdminDesigns(
  supabase: SupabaseClient,
): Promise<ReusableShirt[]> {
  const { data: admins, error: adminsError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (adminsError || !admins?.length) {
    if (adminsError) console.error("[catalog] Error leyendo admins:", adminsError);
    return [];
  }

  const { data: rows, error } = await supabase
    .from("designs")
    .select("id, config, created_at")
    .eq("is_catalog", false)
    .in(
      "user_id",
      admins.map((a) => a.id as string),
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[catalog] Error leyendo camisas propias:", error);
    return [];
  }

  // Diseños ya importados, para no ofrecer dos veces la misma camisa.
  const { data: catalogRows } = await supabase
    .from("designs")
    .select("config")
    .eq("is_catalog", true);

  const importedIds = new Set(
    (catalogRows ?? [])
      .map((r) => (r.config as { source_design_id?: string } | null)?.source_design_id)
      .filter((id): id is string => !!id),
  );

  const shirts: ReusableShirt[] = [];

  for (const row of rows ?? []) {
    const config = row.config as
      | { color?: string; zones?: Record<string, DesignZoneEntry> }
      | null;
    if (!config?.zones) continue;

    const zones: DesignZoneConfig = {};
    const sourcePaths: Partial<Record<DesignZone, string>> = {};

    for (const { key } of PRINT_ZONES) {
      const entry = config.zones[key];
      if (!entry?.imageUrl) continue;

      // Sin path no se puede copiar el objeto en Storage: se omite esa
      // zona en vez de ofrecer una camisa que fallaría al importar.
      const sourcePath = storagePathFromPublicUrl(entry.imageUrl);
      if (!sourcePath) continue;

      zones[key] = { ...entry, enabled: true };
      sourcePaths[key] = sourcePath;
    }

    if (Object.keys(zones).length === 0) continue;

    const slug = (config.color as TshirtColor | undefined) ?? FALLBACK_COLOR.slug;
    const swatch = TSHIRT_COLORS.find((c) => c.slug === slug) ?? FALLBACK_COLOR;

    shirts.push({
      sourceDesignId: row.id as string,
      colorSlug: slug,
      colorHex: swatch.value,
      zones,
      sourcePaths,
      createdAt: row.created_at as string,
      alreadyInCatalog: importedIds.has(row.id as string),
    });
  }

  return shirts;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Una camisa publicada por id — usada por /catalogo/<id>. */
export async function getPublishedCatalogDesign(
  supabase: SupabaseClient,
  id: string,
): Promise<CatalogDesign | null> {
  // El id viene de la URL: si no es un UUID, Postgres tira 22P02 en vez
  // de devolver vacío. Se descarta antes de consultar.
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await supabase
    .from("designs")
    .select(CATALOG_COLUMNS)
    .eq("id", id)
    .eq("is_catalog", true)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    console.error("[catalog] Error cargando diseño:", error);
    return null;
  }

  return data ? toCatalogDesign(data as CatalogRow) : null;
}
