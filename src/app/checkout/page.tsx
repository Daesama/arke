"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CreditCard, Building2, Smartphone, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCOP } from "@/lib/utils/pricing";

const paymentMethods = [
  { id: "wompi_card", label: "Tarjeta", icon: CreditCard },
  { id: "wompi_pse", label: "PSE", icon: Building2 },
  { id: "wompi_nequi", label: "Nequi", icon: Smartphone },
  { id: "cash_on_delivery", label: "Contraentrega", icon: Truck },
] as const;

export default function CheckoutPage() {
  const { items, totalPrice } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState("wompi_card");
  const [loading, setLoading] = useState(false);

  const shipping = 0;
  const total = totalPrice() + shipping;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: Integrar Wompi + crear orden en Supabase
    setTimeout(() => setLoading(false), 2000);
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-muted">No hay items en tu carrito.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-heading text-2xl font-medium text-cyan">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
        {/* Shipping info */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <h2 className="mb-4 font-heading text-lg font-medium text-text-primary">
              Datos de envío
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="name" label="Nombre completo" placeholder="Tu nombre" required />
              <Input id="phone" label="Teléfono" type="tel" placeholder="300 123 4567" required />
              <Input id="address" label="Dirección" placeholder="Calle 123 #45-67" required className="sm:col-span-2" />
              <Input id="city" label="Ciudad" placeholder="Bogotá" required />
              <Input id="department" label="Departamento" placeholder="Cundinamarca" required />
              <Input id="notes" label="Notas (opcional)" placeholder="Apto 301, llamar antes" />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-heading text-lg font-medium text-text-primary">
              Método de pago
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-all",
                    paymentMethod === method.id
                      ? "border-cyan bg-cyan/10 text-cyan"
                      : "border-elevated text-text-secondary hover:border-text-muted",
                  )}
                >
                  <method.icon className="h-5 w-5" />
                  {method.label}
                </button>
              ))}
            </div>
            {paymentMethod === "cash_on_delivery" && (
              <p className="mt-3 text-xs text-text-muted">
                Pagás al recibir tu pedido. Aplica solo para Bogotá y ciudades principales.
              </p>
            )}
          </Card>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <h2 className="mb-4 font-heading text-lg font-medium text-text-primary">
              Resumen
            </h2>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    Camiseta personalizada x{item.quantity}
                  </span>
                  <span className="text-text-primary">
                    {formatCOP(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-elevated pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">{formatCOP(totalPrice())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Envío</span>
                <span className="text-cyan text-xs">Incluido</span>
              </div>
              <div className="flex justify-between border-t border-elevated pt-2">
                <span className="font-medium text-text-primary">Total</span>
                <span className="font-heading text-lg font-medium text-cyan">
                  {formatCOP(total)}
                </span>
              </div>
            </div>

            <Button type="submit" isLoading={loading} size="lg" className="mt-6 w-full">
              Pagar {formatCOP(total)}
            </Button>

            <p className="mt-3 text-center text-xs text-text-muted">
              Pago seguro procesado por Wompi
            </p>
          </Card>
        </div>
      </form>
    </div>
  );
}
