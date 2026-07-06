"use client";

import { Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PedidosPage() {
  // TODO: Fetch user orders from Supabase
  const orders: unknown[] = [];

  if (orders.length === 0) {
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
    </div>
  );
}
