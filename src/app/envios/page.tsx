import type { Metadata } from "next";
import { MapPin, Clock, Package, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Envíos",
  description:
    "Información sobre envíos, tiempos de entrega y cobertura de ARKE en Bogotá.",
};

const info = [
  {
    icon: MapPin,
    title: "Cobertura",
    description:
      "Realizamos envíos a toda Bogotá, Colombia. Estamos trabajando para expandir nuestra cobertura a otras ciudades del país.",
    accent: "text-cyan",
    bg: "bg-cyan/10",
  },
  {
    icon: Clock,
    title: "Tiempos de entrega",
    description:
      "Tu pedido se entrega en 3 a 7 días hábiles después de confirmado el pago. El tiempo incluye producción (estampado) y envío.",
    accent: "text-violet",
    bg: "bg-violet/10",
  },
  {
    icon: Package,
    title: "Seguimiento",
    description:
      "Recibirás actualizaciones por correo electrónico cuando tu pedido cambie de estado: pagado, en producción, enviado y entregado.",
    accent: "text-cyan",
    bg: "bg-cyan/10",
  },
  {
    icon: AlertCircle,
    title: "Importante",
    description:
      "Asegúrate de ingresar una dirección de entrega correcta y completa. ARKE no se responsabiliza por entregas fallidas debido a datos incorrectos.",
    accent: "text-magenta",
    bg: "bg-magenta/10",
  },
];

export default function EnviosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-medium text-cyan">Envíos</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Todo lo que necesitas saber sobre la entrega de tu camiseta
      </p>

      <div className="mt-10 space-y-4">
        {info.map((item) => (
          <div
            key={item.title}
            className="flex gap-4 rounded-xl border border-elevated/60 bg-surface/30 px-6 py-5"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.accent}`}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-medium text-text-primary">
                {item.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-elevated/60 bg-surface/30 px-6 py-5">
        <h2 className="font-heading text-base font-medium text-text-primary">
          Pago contraentrega
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Ofrecemos pago contraentrega en Bogotá. Pagas cuando recibas tu
          camiseta en la puerta de tu casa. Esta opción está disponible durante
          el checkout.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-cyan/15 bg-cyan/5 px-6 py-5 text-center">
        <p className="text-sm text-text-secondary">
          ¿Tienes preguntas sobre tu envío? Escríbenos a{" "}
          <a
            href="mailto:arke.servicio@gmail.com"
            className="font-medium text-cyan hover:underline"
          >
            arke.servicio@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
