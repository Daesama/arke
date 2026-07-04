"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUSES, TSHIRT_MATERIALS } from "@/lib/utils/constants";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Order, OrderItem, OrderStatus } from "@/types/database";

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

const MATERIAL_LABELS: Record<string, string> = {
  piel_de_durazno: "Piel de Durazno",
  algodon_licrado: "Algodón Licrado",
  seda_fria: "Seda Fría",
};

const ZONE_LABELS: Record<string, string> = {
  pechoBolsillo: "Pecho bolsillo",
  abdominalGrande: "Abdominal grande",
  espaldaGrande: "Espalda grande",
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (data) setOrders(data as OrderWithItems[]);
      setLoading(false);
    }
    fetchOrders();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium text-cyan">Pedidos</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gestión de todos los pedidos
          </p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-elevated text-text-muted">
                <th className="pb-3 font-medium">Número</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    No hay pedidos aún.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = ORDER_STATUSES[order.status as OrderStatus];
                  const isExpanded = expandedOrder === order.id;

                  return (
                    <tr key={order.id} className="group">
                      <td colSpan={6} className="p-0">
                        <div
                          className="flex cursor-pointer items-center border-b border-elevated px-4 py-3 transition-colors hover:bg-deep"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <span className="w-24 font-mono text-text-primary">#{order.order_number}</span>
                          <span className="w-40 text-text-secondary">{order.shipping_name}</span>
                          <span className="w-32">
                            <Badge variant="muted" className={status?.color}>
                              {status?.label ?? order.status}
                            </Badge>
                          </span>
                          <span className="w-32 font-mono text-text-primary">
                            ${order.total.toLocaleString("es-CO")}
                          </span>
                          <span className="flex-1 text-text-muted">
                            {new Date(order.created_at).toLocaleDateString("es-CO")}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-text-muted" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-text-muted" />
                          )}
                        </div>

                        {isExpanded && (
                          <div className="border-b border-elevated bg-deep/50 px-4 py-4">
                            {order.order_items.map((item) => {
                              const config = item.design_snapshot?.config as Record<string, unknown> | undefined;
                              const genero = config?.genero as string | undefined;
                              const materialKey = config?.material as string | undefined;
                              const color = (config?.color ?? item.color) as string;
                              const talla = (config?.talla ?? item.size) as string;
                              const zones = config?.zones as Record<string, { imageUrl?: string; enabled?: boolean }> | undefined;

                              return (
                                <div key={item.id} className="rounded-lg border border-elevated bg-surface p-4">
                                  <div className="flex flex-wrap gap-4 text-xs">
                                    {/* Género */}
                                    <div>
                                      <span className="text-text-muted">Género</span>
                                      <p className="mt-0.5 font-medium text-text-primary capitalize">
                                        {genero ?? "—"}
                                      </p>
                                    </div>

                                    {/* Material */}
                                    <div>
                                      <span className="text-text-muted">Material</span>
                                      <p className="mt-0.5 font-medium text-text-primary">
                                        {materialKey ? (MATERIAL_LABELS[materialKey] ?? materialKey) : "—"}
                                      </p>
                                    </div>

                                    {/* Color */}
                                    <div>
                                      <span className="text-text-muted">Color</span>
                                      <div className="mt-0.5 flex items-center gap-1.5">
                                        <span
                                          className="inline-block h-4 w-4 rounded-full border border-elevated"
                                          style={{ backgroundColor: color.startsWith("#") ? color : `var(--color-${color}, #888)` }}
                                        />
                                        <span className="font-medium text-text-primary capitalize">{color}</span>
                                      </div>
                                    </div>

                                    {/* Talla */}
                                    <div>
                                      <span className="text-text-muted">Talla</span>
                                      <p className="mt-0.5 font-mono font-medium text-text-primary">{talla}</p>
                                    </div>

                                    {/* Cantidad */}
                                    <div>
                                      <span className="text-text-muted">Cantidad</span>
                                      <p className="mt-0.5 font-mono font-medium text-text-primary">{item.quantity}</p>
                                    </div>
                                  </div>

                                  {/* Zone images */}
                                  {zones && (
                                    <div className="mt-4">
                                      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                                        Zonas de estampado
                                      </span>
                                      <div className="mt-2 flex flex-wrap gap-3">
                                        {Object.entries(zones).map(([zoneKey, zoneData]) => {
                                          if (!zoneData?.enabled || !zoneData?.imageUrl) return null;
                                          return (
                                            <div key={zoneKey} className="flex flex-col items-center gap-1.5">
                                              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-elevated bg-void">
                                                <img
                                                  src={zoneData.imageUrl}
                                                  alt={ZONE_LABELS[zoneKey] ?? zoneKey}
                                                  className="h-full w-full object-contain"
                                                />
                                              </div>
                                              <span className="text-[10px] text-text-muted">
                                                {ZONE_LABELS[zoneKey] ?? zoneKey}
                                              </span>
                                              <a
                                                href={zoneData.imageUrl}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 rounded-md border border-elevated px-2 py-0.5 text-[10px] text-cyan transition-colors hover:bg-cyan/10"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <Download className="h-3 w-3" />
                                                Descargar
                                              </a>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
