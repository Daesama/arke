"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogIn, ShoppingCart } from "lucide-react";
import { TshirtPreview } from "@/components/design/TshirtPreview";
import { GenderSelector } from "@/components/design/GenderSelector";
import { MaterialSelector } from "@/components/design/MaterialSelector";
import { SizeSelector } from "@/components/design/SizeSelector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase/client";
import { DESIGN_CATEGORIES, PRINT_ZONES } from "@/lib/utils/constants";
import {
  calcularSubtotal,
  formatCOP,
  getActiveZonesFromConfig,
  getDesglose,
} from "@/lib/utils/pricing";
import type { CatalogDesign } from "@/types/design";
import type { TshirtGenero, TshirtMaterial, TshirtSize } from "@/types/database";

const ZONE_LABELS = Object.fromEntries(
  PRINT_ZONES.map((z) => [z.key, z.label]),
) as Record<string, string>;

/**
 * Detalle de una camisa ya hecha por ARKE.
 *
 * El preview usa el MISMO TshirtPreview de /crear, pero **sin** pasarle los
 * callbacks `on*TransformChange` ni los `*Upload`. Esa ausencia es lo que
 * lo deja en solo-lectura: el arte no se puede arrastrar, escalar, quitar
 * ni reemplazar. El toggle frente/espalda sí sigue vivo, que es lo único
 * que el cliente necesita mover acá.
 */
export function CatalogItemDetail({ design }: { design: CatalogDesign }) {
  const [genero, setGenero] = useState<TshirtGenero | null>(null);
  const [material, setMaterial] = useState<TshirtMaterial | null>(null);
  const [size, setSize] = useState<TshirtSize | null>(null);
  const [side, setSide] = useState<"front" | "back">(
    design.zones.pechoBolsillo?.imageUrl || design.zones.abdominalGrande?.imageUrl
      ? "front"
      : "back",
  );
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const handleSideChange = useCallback((s: "front" | "back") => setSide(s), []);

  const activeZones = getActiveZonesFromConfig(design.zones);
  const breakdown = getDesglose(material, genero, activeZones);
  const subtotal =
    genero && material ? calcularSubtotal(material, genero, activeZones) : 0;

  const canOrder = !!genero && !!material && !!size;

  const previews = {
    pechoBolsillo: design.zones.pechoBolsillo?.imageUrl ?? null,
    abdominalGrande: design.zones.abdominalGrande?.imageUrl ?? null,
    espaldaGrande: design.zones.espaldaGrande?.imageUrl ?? null,
  };

  async function handleAddToCart() {
    if (!canOrder || adding) return;
    setAdding(true);

    // La camisa de catálogo YA existe como fila en `designs`, así que a
    // diferencia de /crear no hay nada que subir: solo se referencia. Pero
    // el pedido sí necesita usuario, así que se pide sesión igual.
    const {
      data: { user },
    } = await createClient().auth.getUser();

    if (!user) {
      setShowAuthModal(true);
      setAdding(false);
      return;
    }

    addItem({
      productId: "camiseta-clasica-algodon",
      designId: design.id,
      designImageUrl: design.imageUrl,
      designPrompt: design.title,
      genero: genero!,
      material: material!,
      color: design.colorSlug,
      size: size!,
      printPosition: "pecho",
      designConfig: design.zones,
      quantity: 1,
      unitPrice: subtotal,
    });

    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  function buttonLabel(): string {
    if (added) return "¡Agregada al carrito!";
    if (!genero) return "Elige un género";
    if (!material) return "Elige un material";
    if (!size) return "Elige una talla";
    return `Agregar al carrito — ${formatCOP(subtotal)}`;
  }

  const categoryLabel = design.category
    ? DESIGN_CATEGORIES.find((c) => c.value === design.category)?.label
    : null;

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4 backdrop-blur-xl">
          <div className="gradient-border w-full max-w-sm rounded-2xl bg-surface/50 p-8 text-center shadow-2xl shadow-void/60 backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan/10 text-cyan">
              <LogIn className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-xl font-medium text-text-primary">
              Inicia sesión para continuar
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Necesitas una cuenta para hacer pedidos.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(`/catalogo/${design.id}`)}`}
              >
                <Button className="w-full">Iniciar sesión</Button>
              </Link>
              <Link
                href={`/auth/registro?redirect=${encodeURIComponent(`/catalogo/${design.id}`)}`}
              >
                <Button variant="secondary" className="w-full">
                  Crear cuenta
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="mt-1 text-sm text-text-muted transition-colors hover:text-text-secondary"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-cyan"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Preview grande, no editable, con toggle frente/espalda */}
        <div className="gradient-border flex flex-col items-center justify-center rounded-2xl bg-deep/60 p-6 backdrop-blur-sm">
          <TshirtPreview
            zones={previews}
            color={design.colorHex}
            side={side}
            onSideChange={handleSideChange}
            pechoTransform={design.zones.pechoBolsillo?.transform}
            abdominalTransform={design.zones.abdominalGrande?.transform}
            espaldaTransform={design.zones.espaldaGrande?.transform}
            emptyLabels={{
              front: "Sin estampado en el frente",
              back: "Sin estampado en la espalda",
            }}
          />
        </div>

        {/* Datos y pedido */}
        <div className="space-y-6">
          <div>
            {categoryLabel && (
              <Badge variant="violet" className="mb-3">
                {categoryLabel}
              </Badge>
            )}
            <h1 className="font-heading text-2xl font-medium text-text-primary sm:text-3xl">
              {design.title}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Diseño de ARKE, listo para estampar. Elige género, material y
              talla; el estampado y el color ya están definidos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeZones.map((zone) => (
              <span
                key={zone}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/20 bg-cyan/5 px-2.5 py-1 text-[11px] text-cyan"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_rgba(0,240,255,0.5)]" />
                {ZONE_LABELS[zone] ?? zone}
              </span>
            ))}
          </div>

          <div className="space-y-4">
            <GenderSelector value={genero} onChange={setGenero} />
            <MaterialSelector value={material} onChange={setMaterial} />
            <SizeSelector value={size} onChange={setSize} />
          </div>

          {breakdown.items.length > 0 && (
            <div className="space-y-1 rounded-xl border border-elevated/60 bg-deep/40 px-4 py-3">
              {breakdown.items.map((line) => (
                <div key={line.label} className="flex justify-between text-xs">
                  <span
                    className={
                      line.type === "estampado" ? "text-cyan" : "text-text-secondary"
                    }
                  >
                    {line.label}
                  </span>
                  <span className="font-mono text-text-muted">
                    {formatCOP(line.price)}
                  </span>
                </div>
              ))}
              <div className="border-t border-elevated pt-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-text-primary">Total</span>
                  <span className="font-mono font-medium text-text-primary">
                    {formatCOP(breakdown.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            className="w-full"
            size="lg"
            variant={added ? "secondary" : "primary"}
            disabled={!canOrder || adding}
            isLoading={adding}
          >
            {!adding && <ShoppingCart className="h-4 w-4" />}
            {buttonLabel()}
          </Button>
        </div>
      </div>
    </div>
  );
}
