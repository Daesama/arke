import { createAdminClient } from "@/lib/supabase/admin";
import { getCatalogDesigns, getReusableAdminDesigns } from "@/lib/catalog";
import { CatalogManager } from "@/components/admin/CatalogManager";

export const dynamic = "force-dynamic";

export default async function AdminCatalogoPage() {
  const supabase = createAdminClient();

  const [designs, reusable] = await Promise.all([
    getCatalogDesigns(supabase, { includeDrafts: true }),
    getReusableAdminDesigns(supabase),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-medium text-cyan">
          Catálogo ARKE
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Nuestros diseños propios. Los publicados aparecen en /catalogo y el
          cliente los abre directo en el editor.
        </p>
      </div>

      <CatalogManager designs={designs} reusable={reusable} />
    </div>
  );
}
