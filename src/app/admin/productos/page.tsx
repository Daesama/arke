import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default function AdminProductosPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium text-cyan">Productos</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Tipos de camiseta disponibles
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Agregar producto
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-elevated text-text-muted">
                <th className="pb-3 font-medium">Nombre</th>
                <th className="pb-3 font-medium">Material</th>
                <th className="pb-3 font-medium">Precio</th>
                <th className="pb-3 font-medium">Colores</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-elevated/50">
                <td className="py-3 text-text-primary">Camiseta clásica algodón</td>
                <td className="py-3 text-text-secondary">Algodón 100% 180g/m²</td>
                <td className="py-3 text-text-primary">$45,000</td>
                <td className="py-3 text-text-secondary">negro, blanco, gris, navy</td>
                <td className="py-3">
                  <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-xs text-green-400">
                    Activo
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
