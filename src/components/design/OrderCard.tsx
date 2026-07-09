"use client";

import { Package, Calendar, MapPin, CreditCard, Check } from "lucide-react";
import { TSHIRT_COLORS } from "@/lib/utils/constants";
import type { Order, OrderItem, OrderStatus } from "@/types/database";
import type { DesignZoneConfig } from "@/types/design";
import { cn } from "@/lib/utils/cn";
import { formatCOP } from "@/lib/utils/pricing";
import { TshirtPreviewThumbnail } from "./TshirtPreviewThumbnail";

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

const PROGRESS_STEPS: { key: OrderStatus; label: string; tsKey: keyof Order }[] = [
  { key: "paid", label: "Pagado", tsKey: "paid_at" },
  { key: "in_production", label: "En producción", tsKey: "production_at" },
  { key: "shipped", label: "Enviado", tsKey: "shipped_at" },
  { key: "delivered", label: "Entregado", tsKey: "delivered_at" },
];

function OrderProgressBar({ order }: { order: Order }) {
  const currentIdx = PROGRESS_STEPS.findIndex((s) => s.key === order.status);
  if (currentIdx < 0) return null;

  return (
    <div className="flex items-start justify-between gap-0">
      {PROGRESS_STEPS.map((step, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;
        const ts = order[step.tsKey] as string | null;

        return (
          <div key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {idx > 0 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    isPast || isCurrent ? "bg-green-400/50" : "bg-elevated",
                  )}
                />
              )}
              <div
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px]",
                  isPast && "border-green-400 bg-green-400/20 text-green-400",
                  isCurrent && "border-cyan bg-cyan/20 text-cyan",
                  isFuture && "border-elevated bg-deep text-text-muted",
                )}
              >
                {isPast ? (
                  <Check className="h-3 w-3" />
                ) : isCurrent ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-text-muted/40" />
                )}
              </div>
              {idx < PROGRESS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    isPast ? "bg-green-400/50" : "bg-elevated",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "mt-1.5 text-center text-[10px] font-medium leading-tight",
                isPast && "text-green-400",
                isCurrent && "text-cyan",
                isFuture && "text-text-muted",
              )}
            >
              {step.label}
            </span>
            {ts && (
              <span className="text-[9px] text-text-muted">
                {new Date(ts).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
            <div className="flex-shrink-0">
              {(() => {
                const config = (item.design_snapshot?.config ?? null) as DesignZoneConfig | null;
                const colorHex =
                  TSHIRT_COLORS.find((c) => c.slug === item.color)?.value ?? "#1a1a1a";
                if (config && (config.pechoBolsillo?.enabled || config.abdominalGrande?.enabled || config.espaldaGrande?.enabled)) {
                  return (
                    <TshirtPreviewThumbnail
                      zoneConfig={config}
                      colorHex={colorHex}
                      className="relative aspect-[3/4] h-[100px]"
                    />
                  );
                }
                return (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-surface">
                    {item.design?.thumbnail_url || item.design?.image_url ? (
                      <img
                        src={item.design.thumbnail_url ?? item.design.image_url}
                        alt="Diseño"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-text-muted" />
                      </div>
                    )}
                  </div>
                );
              })()}
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

      {/* Progress Bar */}
      {PROGRESS_STEPS.some((s) => s.key === order.status) && (
        <div className="mt-6 rounded-lg border border-elevated bg-deep p-4">
          <OrderProgressBar order={order} />
        </div>
      )}

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
