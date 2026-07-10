"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUSES } from "@/lib/utils/constants";
import { getAllOrders } from "./actions";
import {
  Download,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Image,
  Scissors,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Order, OrderItem, OrderStatus } from "@/types/database";
import type { DesignZoneConfig } from "@/types/design";
import { TshirtPreviewThumbnail } from "@/components/design/TshirtPreviewThumbnail";
import { downloadSVGAsPNG } from "@/lib/utils/downloadPreview";
import { Shirt } from "lucide-react";

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  user_email: string | null;
}

const MATERIAL_LABELS: Record<string, string> = {
  piel_de_durazno: "Piel de Durazno",
  algodon_licrado: "Algodón Licrado",
  seda_fria: "Seda Fría",
};

const GENERO_LABELS: Record<string, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
};

const PAYMENT_STATUS_LABELS: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Pendiente", color: "text-yellow-400" },
  approved: { label: "Aprobado", color: "text-green-400" },
  declined: { label: "Rechazado", color: "text-red-400" },
  voided: { label: "Anulado", color: "text-red-400" },
  error: { label: "Error", color: "text-magenta" },
};

const ZONE_LABELS: Record<string, string> = {
  pechoBolsillo: "Pecho bolsillo",
  abdominalGrande: "Pecho grande",
  espaldaGrande: "Espalda grande",
};

const COLOR_NAMES: Record<string, string> = {
  "#1a1a1a": "Negro",
  "#1a1a2e": "Negro",
  "#f5f5f5": "Blanco",
  "#f0f0f0": "Blanco",
  "#6b7280": "Gris",
  "#808080": "Gris",
  "#6B7280": "Gris",
  "#1e3a5f": "Azul",
  "#DC2626": "Rojo",
  "#2563EB": "Azul",
  "#EAB308": "Amarillo",
  "#16A34A": "Verde",
  "#EA580C": "Naranja",
  "#7C3AED": "Morado",
  "#7F1D1D": "Rojo",
  "#4D7C0F": "Verde",
  "#38BDF8": "Azul",
  "#EC4899": "Morado",
  "#D4C5A9": "Gris",
  "#C2B280": "Gris",
  "#FFD700": "Amarillo",
  "#000000": "Negro",
  negro: "Negro",
  blanco: "Blanco",
  gris: "Gris",
  rojo: "Rojo",
  azul: "Azul",
  amarillo: "Amarillo",
  verde: "Verde",
  naranja: "Naranja",
  morado: "Morado",
};

const COLOR_HEX: Record<string, string> = {
  negro: "#1a1a1a",
  blanco: "#f5f5f5",
  gris: "#6B7280",
  rojo: "#DC2626",
  azul: "#2563EB",
  amarillo: "#EAB308",
  verde: "#16A34A",
  naranja: "#EA580C",
  morado: "#7C3AED",
};

interface OrganizedData {
  folder?: string;
  zone_urls?: Record<string, string>;
  mockup_urls?: Record<string, string>;
}

function getSnapshot(item: OrderItem) {
  const s = item.design_snapshot as Record<string, unknown> | null;
  const config = s?.config as Record<
    string,
    { imageUrl?: string; enabled?: boolean }
  > | null;

  return {
    genero: (s?.genero as string) ?? null,
    material: (s?.material as string) ?? null,
    color: (s?.color as string) ?? item.color,
    talla: (s?.talla as string) ?? item.size,
    zones: config,
    organized: (s?.organized as OrganizedData) ?? null,
  };
}

function getActiveZones(
  zones: Record<string, { imageUrl?: string; enabled?: boolean }> | null,
): string[] {
  if (!zones) return [];
  return Object.entries(zones)
    .filter(([, v]) => v?.enabled && v?.imageUrl)
    .map(([k]) => ZONE_LABELS[k] ?? k);
}

function buildSummaryText(order: OrderWithItems, item: OrderItem): string {
  const snap = getSnapshot(item);
  const colorName = COLOR_NAMES[snap.color?.toLowerCase() ?? ""] ?? snap.color;
  const activeZones = getActiveZones(snap.zones);

  const lines = [
    `PEDIDO ARKE-${order.order_number}`,
    "",
    `Genero: ${snap.genero ? (GENERO_LABELS[snap.genero] ?? snap.genero) : "-"}`,
    `Material: ${snap.material ? (MATERIAL_LABELS[snap.material] ?? snap.material) : "-"}`,
    `Color: ${colorName}`,
    `Talla: ${snap.talla ?? "-"}`,
    `Cantidad: ${item.quantity}`,
    `Zonas: ${activeZones.length > 0 ? activeZones.join(", ") : "Ninguna"}`,
    "",
    "DATOS DEL CLIENTE",
    `Nombre: ${order.shipping_name}`,
    ...(order.user_email ? [`Email: ${order.user_email}`] : []),
    `WhatsApp: ${order.shipping_phone}`,
    `Direccion: ${order.shipping_address}`,
    `Localidad: ${order.shipping_city}, ${order.shipping_department}`,
  ];

  if (order.shipping_notes) {
    lines.push(`Notas: ${order.shipping_notes}`);
  }

  return lines.join("\n");
}

function DownloadButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-1.5 text-xs font-medium text-cyan transition-colors hover:bg-cyan/10"
      onClick={(e) => e.stopPropagation()}
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
        copied
          ? "border-green-400/30 bg-green-400/10 text-green-400"
          : "border-cyan/30 bg-cyan/5 text-cyan hover:bg-cyan/10",
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copiado" : "Copiar resumen"}
    </button>
  );
}

const STATUS_FLOW: { key: OrderStatus; label: string }[] = [
  { key: "paid", label: "Pagado" },
  { key: "in_production", label: "En producción" },
  { key: "shipped", label: "Enviado" },
  { key: "delivered", label: "Entregado" },
];

function OrderStatusSelector({
  order,
  onStatusChange,
}: {
  order: OrderWithItems;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === order.status);

  async function handleClick(idx: number) {
    if (updating) return;
    const target = STATUS_FLOW[idx];
    if (!target || target.key === order.status) return;
    if (idx !== currentIdx - 1 && idx !== currentIdx + 1) return;

    setUpdating(true);
    try {
      await onStatusChange(order.id, target.key);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="rounded-lg border border-elevated bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-medium text-cyan">
          Estado del pedido
        </h3>
        {updating && (
          <Loader2 className="h-4 w-4 animate-spin text-cyan" />
        )}
      </div>
      <div className="flex items-center gap-1">
        {STATUS_FLOW.map((step, idx) => {
          const isCurrent = step.key === order.status;
          const isPast = currentIdx >= 0 && idx < currentIdx;
          const isClickable =
            !updating && (idx === currentIdx - 1 || idx === currentIdx + 1);

          return (
            <div key={step.key} className="flex items-center">
              {idx > 0 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-4 sm:w-6",
                    isPast || isCurrent ? "bg-green-400/50" : "bg-elevated",
                  )}
                />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => handleClick(idx)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  isCurrent &&
                    "border-cyan bg-cyan/10 text-cyan shadow-[0_0_8px_rgba(0,240,255,0.15)]",
                  isPast &&
                    "border-green-400/30 bg-green-400/10 text-green-400",
                  !isCurrent &&
                    !isPast &&
                    "border-elevated bg-deep text-text-muted",
                  isClickable &&
                    !isCurrent &&
                    "cursor-pointer hover:border-cyan/50 hover:text-text-secondary",
                  !isClickable && "cursor-default",
                )}
              >
                {isPast && <Check className="h-3 w-3" />}
                {isCurrent && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
                  </span>
                )}
                {step.label}
              </button>
            </div>
          );
        })}
      </div>
      {currentIdx < 0 && (
        <p className="mt-2 text-xs text-text-muted">
          Estado actual: {ORDER_STATUSES[order.status]?.label ?? order.status}
        </p>
      )}
    </div>
  );
}

function DownloadPreviewButton({
  svgRef,
  side,
  orderNumber,
}: {
  svgRef: React.RefObject<SVGSVGElement | null>;
  side: "front" | "back";
  orderNumber: number;
}) {
  const [downloading, setDownloading] = useState(false);
  const label = side === "front" ? "Descargar frente" : "Descargar espalda";
  const filename = `pedido-ARKE-${orderNumber}-preview-${side === "front" ? "frente" : "espalda"}.png`;

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (downloading || !svgRef.current) return;
    setDownloading(true);
    try {
      await downloadSVGAsPNG(svgRef.current, filename);
    } catch (err) {
      console.error("Error downloading preview:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={downloading}
      className="flex items-center gap-1.5 rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-1.5 text-xs font-medium text-cyan transition-colors hover:bg-cyan/10 disabled:opacity-50"
    >
      {downloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {downloading ? "Generando..." : label}
    </button>
  );
}

function TshirtPreviewSection({
  zones,
  color,
  orderNumber,
}: {
  zones: Record<string, { imageUrl?: string; enabled?: boolean }>;
  color: string;
  orderNumber: number;
}) {
  const frontRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGSVGElement>(null);

  const config = zones as unknown as DesignZoneConfig;
  const colorHex = COLOR_HEX[color?.toLowerCase() ?? ""] ?? "#1a1a1a";
  const frontOnly: DesignZoneConfig = {
    pechoBolsillo: config.pechoBolsillo,
    abdominalGrande: config.abdominalGrande,
  };
  const backOnly: DesignZoneConfig = {
    espaldaGrande: config.espaldaGrande,
  };
  const hasFront = !!(config.pechoBolsillo?.enabled || config.abdominalGrande?.enabled);
  const hasBack = !!config.espaldaGrande?.enabled;

  return (
    <div className="rounded-lg border border-elevated bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Shirt className="h-4 w-4 text-cyan" />
        <h3 className="font-heading text-sm font-medium text-cyan">
          Preview de la camiseta
        </h3>
      </div>
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col items-center gap-2">
          <TshirtPreviewThumbnail
            ref={frontRef}
            zoneConfig={hasFront ? frontOnly : { pechoBolsillo: undefined, abdominalGrande: undefined }}
            colorHex={colorHex}
            forceSide="front"
            className="relative aspect-[3/4] h-[200px]"
          />
          <span className="text-[10px] font-medium text-text-muted">Frente</span>
          {!hasFront && (
            <span className="text-[10px] text-text-muted/60">Sin diseño</span>
          )}
          <DownloadPreviewButton
            svgRef={frontRef}
            side="front"
            orderNumber={orderNumber}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <TshirtPreviewThumbnail
            ref={backRef}
            zoneConfig={hasBack ? backOnly : { espaldaGrande: undefined }}
            colorHex={colorHex}
            forceSide="back"
            className="relative aspect-[3/4] h-[200px]"
          />
          <span className="text-[10px] font-medium text-text-muted">Espalda</span>
          {!hasBack && (
            <span className="text-[10px] text-text-muted/60">Sin diseño</span>
          )}
          <DownloadPreviewButton
            svgRef={backRef}
            side="back"
            orderNumber={orderNumber}
          />
        </div>
      </div>
    </div>
  );
}

function OrderDetail({
  order,
  item,
}: {
  order: OrderWithItems;
  item: OrderItem;
}) {
  const snap = getSnapshot(item);
  const activeZones = getActiveZones(snap.zones);
  const colorName = COLOR_NAMES[snap.color?.toLowerCase() ?? ""] ?? snap.color;

  const summaryText = buildSummaryText(order, item);

  return (
    <div className="space-y-4">
      {/* ─── Resumen del pedido ─── */}
      <div className="rounded-lg border border-elevated bg-surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-sm font-medium text-cyan">
            Resumen del pedido
          </h3>
          <CopyButton text={summaryText} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
          <div>
            <span className="text-text-muted">Genero</span>
            <p className="mt-0.5 font-medium capitalize text-text-primary">
              {snap.genero
                ? (GENERO_LABELS[snap.genero] ?? snap.genero)
                : "-"}
            </p>
          </div>
          <div>
            <span className="text-text-muted">Material</span>
            <p className="mt-0.5 font-medium text-text-primary">
              {snap.material
                ? (MATERIAL_LABELS[snap.material] ?? snap.material)
                : "-"}
            </p>
          </div>
          <div>
            <span className="text-text-muted">Color</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className="inline-block h-4 w-4 rounded-full border border-elevated"
                style={{
                  backgroundColor: COLOR_HEX[snap.color?.toLowerCase() ?? ""] ?? "#888",
                }}
              />
              <span className="font-medium text-text-primary">
                {colorName}
              </span>
            </div>
          </div>
          <div>
            <span className="text-text-muted">Talla</span>
            <p className="mt-0.5 font-mono font-medium text-text-primary">
              {snap.talla ?? "-"}
            </p>
          </div>
          <div>
            <span className="text-text-muted">Cantidad</span>
            <p className="mt-0.5 font-mono font-medium text-text-primary">
              {item.quantity}
            </p>
          </div>
        </div>

        {activeZones.length > 0 && (
          <div className="mt-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Zonas activas
            </span>
            <p className="mt-0.5 text-xs text-text-primary">
              {activeZones.join(", ")}
            </p>
          </div>
        )}

        <div className="mt-4 border-t border-elevated pt-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Datos del cliente
          </span>
          <div className="mt-1 space-y-0.5 text-xs text-text-secondary">
            <p className="font-medium text-text-primary">
              {order.shipping_name}
            </p>
            {order.user_email && (
              <p>Email: {order.user_email}</p>
            )}
            <p>WhatsApp: {order.shipping_phone}</p>
            <p>{order.shipping_address}</p>
            <p>
              {order.shipping_city}, {order.shipping_department}
            </p>
            {order.shipping_notes && (
              <p className="text-text-muted">
                Notas: {order.shipping_notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Maqueta para el proveedor ─── */}
      {snap.organized?.mockup_urls &&
        Object.keys(snap.organized.mockup_urls).length > 0 && (
          <div className="rounded-lg border border-elevated bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Image className="h-4 w-4 text-cyan" />
              <h3 className="font-heading text-sm font-medium text-cyan">
                Maqueta para el proveedor
              </h3>
            </div>
            <p className="mb-3 text-[11px] text-text-muted">
              Preview completo con los diseños posicionados sobre la
              camiseta.
            </p>
            <div className="flex flex-wrap gap-4">
              {snap.organized.mockup_urls.frente && (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-40 w-32 overflow-hidden rounded-lg border border-elevated bg-void">
                    <img
                      src={snap.organized.mockup_urls.frente}
                      alt="Mockup frente"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-text-muted">
                    Frente
                  </span>
                  <DownloadButton
                    href={snap.organized.mockup_urls.frente}
                    label="Descargar"
                  />
                </div>
              )}
              {snap.organized.mockup_urls.espalda && (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-40 w-32 overflow-hidden rounded-lg border border-elevated bg-void">
                    <img
                      src={snap.organized.mockup_urls.espalda}
                      alt="Mockup espalda"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-text-muted">
                    Espalda
                  </span>
                  <DownloadButton
                    href={snap.organized.mockup_urls.espalda}
                    label="Descargar"
                  />
                </div>
              )}
            </div>
          </div>
        )}

      {/* ─── Preview de la camiseta ─── */}
      {snap.zones && (
        <TshirtPreviewSection
          zones={snap.zones}
          color={snap.color ?? ""}
          orderNumber={order.order_number}
        />
      )}

      {/* ─── Imágenes originales para estampar ─── */}
      {snap.zones && (
        <div className="rounded-lg border border-elevated bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Scissors className="h-4 w-4 text-cyan" />
            <h3 className="font-heading text-sm font-medium text-cyan">
              Imagenes originales para estampar
            </h3>
          </div>
          <p className="mb-3 text-[11px] text-text-muted">
            Imagenes puras de cada zona para enviar al estampador.
          </p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(snap.zones).map(([zoneKey, zoneData]) => {
              if (!zoneData?.enabled || !zoneData?.imageUrl) return null;

              const organizedUrl =
                snap.organized?.zone_urls?.[zoneKey];
              const downloadUrl = organizedUrl ?? zoneData.imageUrl;

              return (
                <div
                  key={zoneKey}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-elevated bg-void">
                    <img
                      src={zoneData.imageUrl}
                      alt={ZONE_LABELS[zoneKey] ?? zoneKey}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-text-muted">
                    {ZONE_LABELS[zoneKey] ?? zoneKey}
                  </span>
                  <DownloadButton
                    href={downloadUrl}
                    label="Descargar"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      const result = await getAllOrders();
      if (result.orders) {
        setOrders(result.orders);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      try {
        const res = await fetch("/api/orders/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: newStatus }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || "Error al actualizar estado");
          return;
        }
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o,
          ),
        );
      } catch {
        alert("Error de conexión al actualizar estado");
      }
    },
    [],
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium text-cyan">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gestion de todos los pedidos
          </p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-elevated text-text-muted">
                <th style={{ width: "8%" }} className="px-4 pb-3 font-medium">Numero</th>
                <th style={{ width: "18%" }} className="px-4 pb-3 font-medium">Cliente</th>
                <th style={{ width: "14%" }} className="px-4 pb-3 font-medium">Estado</th>
                <th style={{ width: "12%" }} className="px-4 pb-3 font-medium">Pago</th>
                <th style={{ width: "12%" }} className="px-4 pb-3 font-medium">Total</th>
                <th style={{ width: "18%" }} className="px-4 pb-3 font-medium">Referencia</th>
                <th style={{ width: "14%" }} className="px-4 pb-3 font-medium">Fecha</th>
                <th style={{ width: "4%" }} className="px-4 pb-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-text-muted"
                  >
                    Cargando pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-text-muted"
                  >
                    No hay pedidos aun.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status =
                    ORDER_STATUSES[order.status as OrderStatus];
                  const paymentInfo =
                    PAYMENT_STATUS_LABELS[order.payment_status];
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <tr key={order.id} className="group">
                      <td colSpan={8} className="p-0">
                        <table className="w-full table-fixed text-left text-sm">
                          <colgroup>
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "14%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "14%" }} />
                            <col style={{ width: "4%" }} />
                          </colgroup>
                          <tbody>
                            <tr
                              className="cursor-pointer border-b border-elevated transition-colors hover:bg-deep"
                              onClick={() =>
                                setExpandedOrder(
                                  isExpanded ? null : order.id,
                                )
                              }
                            >
                              <td className="px-4 py-3 font-mono text-text-primary">
                                #{order.order_number}
                              </td>
                              <td className="truncate px-4 py-3 text-text-secondary">
                                {order.shipping_name}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="muted"
                                  className={status?.color}
                                >
                                  {status?.label ?? order.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="muted"
                                  className={paymentInfo?.color}
                                >
                                  {paymentInfo?.label ??
                                    order.payment_status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 font-mono text-text-primary">
                                ${order.total.toLocaleString("es-CO")}
                              </td>
                              <td
                                className="truncate px-4 py-3 font-mono text-xs text-text-muted"
                                title={order.payment_reference ?? ""}
                              >
                                {order.payment_reference ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-text-muted">
                                {new Date(
                                  order.created_at,
                                ).toLocaleDateString("es-CO")}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isExpanded ? (
                                  <ChevronUp className="inline h-4 w-4 text-text-muted" />
                                ) : (
                                  <ChevronDown className="inline h-4 w-4 text-text-muted" />
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {isExpanded && (
                          <div className="border-b border-elevated bg-deep/50 px-4 py-4">
                            <div className="space-y-4">
                              <OrderStatusSelector
                                order={order}
                                onStatusChange={handleStatusChange}
                              />
                              {order.order_items.map((item) => (
                                <OrderDetail
                                  key={item.id}
                                  order={order}
                                  item={item}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
