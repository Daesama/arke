import { Card } from "@/components/ui/Card";
import { Package, DollarSign, Users, Image as ImageIcon } from "lucide-react";

const stats = [
  { label: "Pedidos totales", value: "0", icon: Package, color: "text-cyan" },
  { label: "Ingresos", value: "$0", icon: DollarSign, color: "text-green-400" },
  { label: "Usuarios", value: "0", icon: Users, color: "text-violet" },
  { label: "Diseños subidos", value: "0", icon: ImageIcon, color: "text-magenta" },
];

export default function AdminDashboard() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-medium text-cyan">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Resumen general de ARKE
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="mt-1 font-heading text-2xl font-medium text-text-primary">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg bg-surface p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-medium text-text-primary">
          Pedidos recientes
        </h2>
        <p className="text-sm text-text-muted">
          No hay pedidos aún. Los pedidos aparecerán acá cuando los usuarios empiecen a comprar.
        </p>
      </Card>
    </div>
  );
}
