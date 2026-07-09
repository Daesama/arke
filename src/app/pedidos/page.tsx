"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderCard } from "@/components/design/OrderCard";
import Link from "next/link";
import { getUserOrders } from "./actions";
import type { Order } from "@/types/database";

export default function PedidosPage() {
  const [orders, setOrders] = useState<(Order & { order_items: any[] })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const result = await getUserOrders();
        if (result.error) {
          setError(result.error);
        } else {
          setOrders(result.orders || []);
        }
      } catch (err) {
        setError("Error al cargar pedidos");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="rounded-xl bg-surface p-4 text-text-muted">
          <Package className="h-10 w-10 animate-pulse" />
        </div>
        <p className="mt-4 text-sm text-text-secondary">Cargando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-xl bg-surface p-4 text-magenta">
          <Package className="h-10 w-10" />
        </div>
        <h1 className="mt-4 font-heading text-xl font-medium text-text-primary">
          Error al cargar pedidos
        </h1>
        <p className="mt-2 text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-xl bg-surface p-4 text-text-muted">
          <Package className="h-10 w-10" />
        </div>
        <h1 className="mt-4 font-heading text-xl font-medium text-text-primary">
          No tienes pedidos aún
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Cuando hagas tu primera compra, tus pedidos aparecerán acá.
        </p>
        <Link href="/crear" className="mt-6">
          <Button>Crear mi primer diseño</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-heading text-2xl font-medium text-cyan">
        Mis pedidos
      </h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
