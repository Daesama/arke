"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Library, Plus, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TshirtPreviewThumbnail } from "@/components/design/TshirtPreviewThumbnail";
import { CatalogShirtBuilder } from "@/components/admin/CatalogShirtBuilder";
import { cn } from "@/lib/utils/cn";
import { DESIGN_CATEGORIES } from "@/lib/utils/constants";
import {
  deleteCatalogDesign,
  importCatalogShirtFromExisting,
  setCatalogDesignPublic,
} from "@/app/admin/catalogo/actions";
import type { CatalogDesign, ReusableShirt } from "@/types/design";
import type { DesignCategory } from "@/types/database";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  DESIGN_CATEGORIES.map((c) => [c.value, c.label]),
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CatalogManager({
  designs,
  reusable,
}: {
  designs: CatalogDesign[];
  reusable: ReusableShirt[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const available = useMemo(
    () => reusable.filter((r) => !r.alreadyInCatalog),
    [reusable],
  );

  const [builderOpen, setBuilderOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario de importación (camisa anterior → catálogo).
  const [picked, setPicked] = useState<ReusableShirt | null>(null);
  const [importTitle, setImportTitle] = useState("");
  const [importCategory, setImportCategory] = useState<DesignCategory | "">("");
  const [importPublish, setImportPublish] = useState(true);
  const [importing, setImporting] = useState(false);

  function resetImport() {
    setPicked(null);
    setImportTitle("");
    setImportCategory("");
    setImportPublish(true);
  }

  async function handleImport() {
    if (!picked || importing) return;
    setError(null);
    if (!importTitle.trim()) return setError("Ponle un nombre a la camisa.");

    setImporting(true);
    const result = await importCatalogShirtFromExisting({
      sourceDesignId: picked.sourceDesignId,
      title: importTitle.trim(),
      category: importCategory,
      isPublic: importPublish,
    });
    setImporting(false);

    if (result.error) return setError(result.error);

    resetImport();
    setPickerOpen(false);
    router.refresh();
  }

  function handleTogglePublic(design: CatalogDesign) {
    startTransition(async () => {
      const result = await setCatalogDesignPublic(design.id, !design.isPublic);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  function handleDelete(design: CatalogDesign) {
    startTransition(async () => {
      const result = await deleteCatalogDesign(design.id);
      // deleteCatalogDesign devuelve mensaje también cuando despublica en
      // vez de borrar (camisa con pedidos), por eso se muestra siempre.
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          {designs.length} {designs.length === 1 ? "camisa" : "camisas"} ·{" "}
          {designs.filter((d) => d.isPublic).length} publicadas
          {available.length > 0 && <> · {available.length} propias sin usar</>}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={available.length === 0}
            title={
              available.length === 0
                ? "No hay camisas propias anteriores sin usar"
                : undefined
            }
            onClick={() => {
              setPickerOpen((open) => !open);
              setBuilderOpen(false);
              resetImport();
            }}
          >
            <Library className="h-4 w-4" />
            Usar camisa anterior
          </Button>
          <Button
            size="sm"
            variant={builderOpen ? "secondary" : "primary"}
            onClick={() => {
              setBuilderOpen((open) => !open);
              setPickerOpen(false);
            }}
          >
            {builderOpen ? (
              <>
                <X className="h-4 w-4" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Crear camisa
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-magenta/20 bg-magenta/[0.07] px-4 py-3 text-sm text-magenta">
          {error}
        </div>
      )}

      {builderOpen && <CatalogShirtBuilder onCancel={() => setBuilderOpen(false)} />}

      {/* Reutilizar una camisa propia anterior */}
      {pickerOpen && (
        <Card className="space-y-5">
          <div>
            <p className="font-heading text-sm font-medium text-text-primary">
              Camisas propias anteriores
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Solo camisas hechas por el equipo (autor con rol admin) — nunca de
              clientes. Se copian las imágenes al catálogo; el diseño original y
              sus pedidos quedan intactos.
            </p>
          </div>

          {available.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              No hay camisas propias sin usar.
            </p>
          ) : (
            <div className="grid max-h-[400px] gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-5">
              {available.map((shirt) => (
                <button
                  key={shirt.sourceDesignId}
                  type="button"
                  onClick={() => {
                    setPicked(shirt);
                    setError(null);
                  }}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-deep/60 text-left transition-all",
                    picked?.sourceDesignId === shirt.sourceDesignId
                      ? "border-cyan bg-cyan/[0.05]"
                      : "border-elevated/60 hover:border-cyan/40",
                  )}
                >
                  <TshirtPreviewThumbnail
                    zoneConfig={shirt.zones}
                    colorHex={shirt.colorHex}
                    className="relative aspect-[3/4] w-full"
                  />
                  <div className="border-t border-elevated/60 px-2.5 py-2">
                    <p className="font-mono text-[10px] text-text-muted">
                      {formatDate(shirt.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {picked && (
            <div className="space-y-4 border-t border-elevated/60 pt-5">
              <Input
                id="import-title"
                label="Nombre"
                placeholder="Ej: Neón Samurái"
                value={importTitle}
                onChange={(e) => setImportTitle(e.target.value)}
                maxLength={80}
              />

              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Categoría
                </p>
                <div className="flex flex-wrap gap-2">
                  <ChipButton
                    active={importCategory === ""}
                    onClick={() => setImportCategory("")}
                  >
                    Sin categoría
                  </ChipButton>
                  {DESIGN_CATEGORIES.map((cat) => (
                    <ChipButton
                      key={cat.value}
                      active={importCategory === cat.value}
                      onClick={() => setImportCategory(cat.value)}
                    >
                      {cat.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={importPublish}
                  onChange={(e) => setImportPublish(e.target.checked)}
                  className="h-4 w-4 accent-cyan"
                />
                Publicar de una vez en /catalogo
              </label>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={resetImport} disabled={importing}>
                  Quitar selección
                </Button>
                <Button size="sm" onClick={handleImport} isLoading={importing}>
                  Agregar al catálogo
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Camisas del catálogo */}
      {designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-elevated py-16 text-center">
          <p className="font-heading text-lg font-medium text-text-primary">
            Todavía no hay camisas en el catálogo
          </p>
          <p className="mt-2 max-w-sm text-sm text-text-secondary">
            Crea una nueva o reutiliza una anterior; aparecerá en el catálogo
            apenas la publiques.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {designs.map((design) => (
            <div
              key={design.id}
              className={cn(
                "gradient-border gradient-border-subtle overflow-hidden rounded-2xl bg-surface/40 backdrop-blur-xl",
                !design.isPublic && "opacity-60",
              )}
            >
              <div className="bg-deep/70 p-2">
                <TshirtPreviewThumbnail
                  zoneConfig={design.zones}
                  colorHex={design.colorHex}
                  className="relative aspect-[3/4] w-full"
                />
              </div>
              <div className="space-y-3 p-4">
                <p className="truncate text-sm font-medium text-text-primary">
                  {design.title}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {design.category && (
                    <Badge variant="violet">
                      {CATEGORY_LABELS[design.category] ?? design.category}
                    </Badge>
                  )}
                  <Badge variant={design.isPublic ? "cyan" : "muted"}>
                    {design.isPublic ? "Publicada" : "Borrador"}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => handleTogglePublic(design)}
                  >
                    {design.isPublic ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Publicar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={isPending}
                    onClick={() => handleDelete(design)}
                    aria-label={`Borrar ${design.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs transition-all",
        active
          ? "border-cyan bg-cyan/10 text-cyan"
          : "border-elevated text-text-secondary hover:border-text-muted",
      )}
    >
      {children}
    </button>
  );
}
