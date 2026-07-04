"use client";

import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import { TSHIRT_COLORS, TSHIRT_MATERIALS } from "@/lib/utils/constants";
import { formatCOP, getActiveZonesFromConfig, getPriceBreakdown } from "@/lib/utils/pricing";

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-xl bg-surface p-4 text-text-muted">
          <ShoppingCart className="h-10 w-10" />
        </div>
        <h1 className="mt-4 font-heading text-xl font-medium text-text-primary">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Subí tu diseño y agregalo a tu carrito.
        </p>
        <Link href="/crear" className="mt-6">
          <Button>Crear diseño</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-heading text-2xl font-medium text-cyan">
        Tu carrito
      </h1>

      <div className="space-y-4">
        {items.map((item) => {
          const activeZones = getActiveZonesFromConfig(item.designConfig);
          const breakdown = getPriceBreakdown(activeZones);

          return (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-elevated bg-surface p-4"
            >
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-deep">
                {item.designImageUrl && (
                  <img
                    src={item.designImageUrl}
                    alt="Diseño"
                    className="h-full w-full object-contain p-2"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Camiseta personalizada
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {item.genero === "mujer" ? "Mujer" : "Hombre"}
                    {" / "}
                    {TSHIRT_MATERIALS.find((m) => m.value === item.material)?.label ?? item.material}
                    {" / "}
                    {TSHIRT_COLORS.find((c) => c.slug === item.color)?.name ?? item.color}
                    {" / "}
                    {item.size}
                  </p>

                  {/* Price breakdown */}
                  <div className="mt-2 space-y-0.5">
                    {breakdown.items.map((line) => (
                      <div key={line.label} className="flex justify-between text-[11px]">
                        <span className="text-text-muted">{line.label}</span>
                        <span className="font-mono text-text-muted">{formatCOP(line.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="rounded-md border border-elevated p-1 text-text-secondary transition-colors hover:border-text-muted disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm text-text-primary">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="rounded-md border border-elevated p-1 text-text-secondary transition-colors hover:border-text-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="font-mono text-sm font-medium text-cyan">
                      {formatCOP(item.unitPrice * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-text-muted transition-colors hover:text-magenta"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-elevated bg-surface p-6">
        <div className="flex items-center justify-between">
          <p className="text-text-secondary">Total</p>
          <p className="font-heading text-xl font-medium text-cyan">
            {formatCOP(totalPrice())}
          </p>
        </div>
        <Link href="/checkout" className="mt-4 block">
          <Button size="lg" className="w-full">
            Ir al checkout — {formatCOP(totalPrice())}
          </Button>
        </Link>
      </div>
    </div>
  );
}
