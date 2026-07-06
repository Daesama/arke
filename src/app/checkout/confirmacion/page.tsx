import { getTransaction } from "@/lib/wompi/client";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  let transaction = null;

  if (searchParams.id) {
    try {
      const res = await getTransaction(searchParams.id);
      transaction = res.data;
    } catch {
      // Will show error state
    }
  }

  const status = transaction?.status as string | undefined;
  const reference = (transaction?.reference ?? "") as string;
  const orderNumber = reference.split("-")[1] ?? "";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <div className="flex flex-col items-center py-8 text-center">
          {status === "APPROVED" && (
            <>
              <div className="rounded-full bg-green-400/10 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
              <h1 className="mt-6 font-heading text-2xl font-medium text-text-primary">
                ¡Pago confirmado!
              </h1>
              <p className="mt-2 text-text-secondary">
                Tu pedido #{orderNumber} ha sido procesado exitosamente.
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Te notificaremos por WhatsApp cuando tu camiseta esté en camino.
              </p>
              <Link
                href="/pedidos"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-cyan px-6 py-2.5 font-heading text-sm font-medium text-void shadow-glow-cyan transition-all hover:shadow-glow-cyan-lg"
              >
                Ver mis pedidos
              </Link>
            </>
          )}

          {status === "PENDING" && (
            <>
              <div className="rounded-full bg-yellow-400/10 p-4">
                <Clock className="h-12 w-12 text-yellow-400" />
              </div>
              <h1 className="mt-6 font-heading text-2xl font-medium text-text-primary">
                Procesando tu pago
              </h1>
              <p className="mt-2 text-text-secondary">
                Tu pago está siendo verificado. Esto puede tomar unos minutos.
              </p>
              <p className="mt-1 font-mono text-sm text-text-muted">
                Referencia: {reference}
              </p>
              <Link
                href="/pedidos"
                className="mt-8 inline-flex items-center justify-center rounded-lg border border-elevated bg-surface px-6 py-2.5 font-heading text-sm font-medium text-text-primary transition-all hover:bg-deep"
              >
                Ver mis pedidos
              </Link>
            </>
          )}

          {(status === "DECLINED" ||
            status === "ERROR" ||
            status === "VOIDED") && (
            <>
              <div className="rounded-full bg-magenta/10 p-4">
                <XCircle className="h-12 w-12 text-magenta" />
              </div>
              <h1 className="mt-6 font-heading text-2xl font-medium text-text-primary">
                Pago no aprobado
              </h1>
              <p className="mt-2 text-text-secondary">
                No pudimos procesar tu pago. Puedes intentarlo de nuevo.
              </p>
              <Link
                href="/checkout"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-cyan px-6 py-2.5 font-heading text-sm font-medium text-void shadow-glow-cyan transition-all hover:shadow-glow-cyan-lg"
              >
                Reintentar pago
              </Link>
            </>
          )}

          {!status && (
            <>
              <div className="rounded-full bg-magenta/10 p-4">
                <XCircle className="h-12 w-12 text-magenta" />
              </div>
              <h1 className="mt-6 font-heading text-2xl font-medium text-text-primary">
                Error al verificar el pago
              </h1>
              <p className="mt-2 text-text-secondary">
                No pudimos verificar el estado de tu transacción.
              </p>
              <Link
                href="/pedidos"
                className="mt-8 inline-flex items-center justify-center rounded-lg border border-elevated bg-surface px-6 py-2.5 font-heading text-sm font-medium text-text-primary transition-all hover:bg-deep"
              >
                Ver mis pedidos
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
