"use client";

import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import { TSHIRT_COLORS, TSHIRT_MATERIALS } from "@/lib/utils/constants";
import { formatCOP, getActiveZonesFromConfig, getDesglose, ENVIO } from "@/lib/utils/pricing";

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-2xl bg-surface/40 p-5 text-text-muted backdrop-blur-xl">
          <ShoppingCart className="h-10 w-10" />
        </div>
        <h1 className="mt-5 font-heading text-xl font-medium text-text-primary">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Sube tu diseño y agrégalo a tu carrito.
        </p>
        <Link href="/crear" className="mt-8">
          <Button>Crear diseño</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-heading text-2xl font-medium text-text-primary sm:text-3xl">
        Tu carrito
      </h1>
      <p className="mb-8 text-sm text-text-muted">{items.length} {items.length === 1 ? "artículo" : "artículos"}</p>

      <div className="space-y-3">
        {items.map((item) => {
          const activeZones = getActiveZonesFromConfig(item.designConfig);
          const breakdown = getDesglose(item.material, item.genero, activeZones);

          return (
            <div
              key={item.id}
              className="gradient-border gradient-border-subtle flex gap-4 rounded-2xl bg-surface/30 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] hover:bg-surface/40"
            >
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-deep">
                {(item.previewBase64 || item.designImageUrl) && (
                  <img
                    src={item.previewBase64 ?? item.designImageUrl}
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

                  <div className="mt-2 space-y-0.5">
                    {breakdown.items.map((line) => (
                      <div key={line.label} className="flex justify-between text-[11px]">
                        <span className={line.type === "estampado" ? "text-cyan" : "text-text-muted"}>
                          {line.label}
                        </span>
                        <span className="font-mono text-text-muted">{formatCOP(line.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="rounded-md border border-white/[0.06] p-1.5 text-text-secondary transition-all duration-300 hover:border-cyan/20 hover:bg-surface/30 disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center font-mono text-sm text-text-primary">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="rounded-lg border border-elevated/70 p-1.5 text-text-secondary transition-all duration-200 hover:border-elevated hover:bg-surface"
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

      <div className="gradient-border mt-8 rounded-2xl bg-surface/30 p-6 backdrop-blur-xl">
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-mono text-text-primary">{formatCOP(totalPrice())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Envío Bogotá</span>
            <span className="font-mono text-text-muted">{formatCOP(ENVIO)}</span>
          </div>
          <div className="border-t border-elevated/50 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-text-primary">Total</span>
              <span className="font-heading text-xl font-medium text-cyan">
                {formatCOP(totalPrice() + ENVIO)}
              </span>
            </div>
          </div>
        </div>
        <Link href="/checkout" className="mt-5 block">
          <Button size="lg" className="w-full">
            Ir al checkout — {formatCOP(totalPrice() + ENVIO)}
          </Button>
        </Link>
      </div>
    </div>
  );
}
