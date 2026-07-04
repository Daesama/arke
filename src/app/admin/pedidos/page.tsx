import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminPedidosPage() {
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
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="py-8 text-center text-text-muted">
                  No hay pedidos aún.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
