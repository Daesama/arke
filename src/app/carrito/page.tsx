"use client";

import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cartStore";
import { TSHIRT_COLORS } from "@/lib/utils/constants";

function formatCOP(cents: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

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
          Creá un diseño con IA y agregalo a tu carrito.
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
        {items.map((item) => (
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
                  Camiseta con diseño IA
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {TSHIRT_COLORS.find((c) => c.slug === item.color)?.name} / {item.size} / {item.printPosition}
                </p>
              </div>

              <div className="flex items-center justify-between">
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
                  <p className="text-sm font-medium text-text-primary">
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
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-elevated bg-surface p-6">
        <div className="flex items-center justify-between">
          <p className="text-text-secondary">Total</p>
          <p className="font-heading text-xl font-medium text-text-primary">
            {formatCOP(totalPrice())}
          </p>
        </div>
        <Link href="/checkout" className="mt-4 block">
          <Button size="lg" className="w-full">
            Ir al checkout
          </Button>
        </Link>
      </div>
    </div>
  );
}
