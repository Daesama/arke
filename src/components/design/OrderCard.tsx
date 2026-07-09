"use client";

import { Package, Calendar, MapPin, CreditCard } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/utils/constants";
import type { Order, OrderItem } from "@/types/database";
import { cn } from "@/lib/utils/cn";
import { formatCOP } from "@/lib/utils/pricing";

interface OrderCardProps {
  order: Order & {
    order_items: (OrderItem & {
      design: { id: string; image_url: string; thumbnail_url: string | null } | null;
    })[];
  };
}

const statusConfig = {
  pending: { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  paid: { label: "Pagado", color: "text-cyan", bg: "bg-cyan/10", border: "border-cyan/30" },
  in_production: { label: "En producción", color: "text-violet", bg: "bg-violet/10", border: "border-violet/30" },
  shipped: { label: "Enviado", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  delivered: { label: "Entregado", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/30" },
  cancelled: { label: "Cancelado", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  refunded: { label: "Reembolsado", color: "text-text-muted", bg: "bg-text-muted/10", border: "border-text-muted/30" },
};

export function OrderCard({ order }: OrderCardProps) {
  const status = statusConfig[order.status] || statusConfig.pending;
  const date = new Date(order.created_at).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-elevated bg-surface p-6 transition-all duration-200 hover:border-cyan/30">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-elevated p-2.5">
            <Package className="h-5 w-5 text-text-secondary" />
          </div>
          <div>
            <p className="font-heading text-lg font-medium text-text-primary">
              Pedido #{order.order_number}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
            status.bg,
            status.border,
            status.color,
          )}
        >
          {status.label}
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 space-y-3">
        {order.order_items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-lg bg-deep p-3 transition-colors hover:bg-elevated"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface">
              {item.design?.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.design.thumbnail_url}
                  alt="Diseño"
                  className="h-full w-full object-cover"
                />
              ) : item.design?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.design.image_url}
                  alt="Diseño"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-text-muted" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                Camiseta {item.color} - Talla {item.size}
              </p>
              <p className="text-xs text-text-secondary">
                Cantidad: {item.quantity} × {formatCOP(item.unit_price)}
              </p>
            </div>

            <p className="text-sm font-medium text-text-primary">
              {formatCOP(item.quantity * item.unit_price)}
            </p>
          </div>
        ))}
      </div>

      {/* Shipping Info */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted" />
          <div className="min-w-0">
            <p className="text-text-secondary">Dirección de envío</p>
            <p className="truncate text-text-primary">{order.shipping_address}</p>
            <p className="text-xs text-text-secondary">
              {order.shipping_city}, {order.shipping_department}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted" />
          <div className="min-w-0">
            <p className="text-text-secondary">Método de pago</p>
            <p className="text-text-primary">
              {order.payment_method.replace("wompi_", "").toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="mt-6 border-t border-elevated pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Total</span>
          <span className="font-heading text-lg font-medium text-cyan">
            {formatCOP(order.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
