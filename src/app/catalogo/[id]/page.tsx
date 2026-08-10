import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublishedCatalogDesign } from "@/lib/catalog";
import { CatalogItemDetail } from "@/components/catalog/CatalogItemDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const design = await getPublishedCatalogDesign(await createClient(), params.id);
  if (!design) return { title: "Camisa no encontrada — ARKE" };

  return {
    title: `${design.title} — Catálogo ARKE`,
    description: `${design.title}: diseño de ARKE listo para estampar. Elige género, material y talla.`,
  };
}

export default async function CatalogoItemPage({
  params,
}: {
  params: { id: string };
}) {
  const design = await getPublishedCatalogDesign(await createClient(), params.id);

  // Un borrador o un id inventado caen acá: 404 en vez de página vacía.
  if (!design) notFound();

  return <CatalogItemDetail design={design} />;
}
