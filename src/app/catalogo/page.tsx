import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCatalogDesigns } from "@/lib/catalog";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";

export const metadata: Metadata = {
  title: "Catálogo — Diseños ARKE",
  description:
    "Diseños creados por ARKE listos para estampar. Elige uno y personaliza tu camiseta.",
};

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const supabase = await createClient();
  const designs = await getCatalogDesigns(supabase);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet">
          Catálogo
        </p>
        <h1 className="mt-2 font-heading text-2xl font-medium text-cyan sm:text-3xl">
          Diseños ARKE
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Nuestros propios diseños, listos para estampar. Elige uno y
          personaliza tu camiseta.
        </p>
      </div>

      <CatalogGrid designs={designs} />
    </div>
  );
}
