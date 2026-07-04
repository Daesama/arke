import { Card } from "@/components/ui/Card";
import { Image as ImageIcon } from "lucide-react";

export default function AdminDisenosPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-medium text-cyan">Diseños</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Diseños subidos por usuarios. Descargá el PNG para enviar al estampador.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-elevated py-20 text-center">
        <div className="rounded-xl bg-surface p-4 text-text-muted">
          <ImageIcon className="h-8 w-8" />
        </div>
        <p className="mt-4 font-heading text-lg font-medium text-text-primary">
          No hay diseños aún
        </p>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          Los diseños subidos por los usuarios aparecerán acá para que puedas descargarlos.
        </p>
      </div>
    </div>
  );
}
