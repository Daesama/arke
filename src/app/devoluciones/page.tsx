import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devoluciones",
  description:
    "Política de devoluciones y garantía de ARKE para camisetas personalizadas.",
};

export default function DevolucionesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-medium text-cyan">
        Devoluciones y Garantía
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Nuestra política para que compres con confianza
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-secondary">
        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            Productos personalizados
          </h2>
          <p>
            Dado que cada camiseta se fabrica según tu diseño, no aceptamos
            devoluciones por cambio de opinión, error en la selección de talla o
            color por parte del comprador. Te recomendamos revisar la
            previsualización con cuidado antes de confirmar tu pedido.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            Defectos de fabricación
          </h2>
          <p>Si tu camiseta llega con alguno de estos problemas, realizamos cambio sin costo:</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5">
            <li>Estampado desalineado, borroso o con colores incorrectos.</li>
            <li>Talla incorrecta enviada por error nuestro.</li>
            <li>Daños visibles en la tela o costuras defectuosas.</li>
            <li>Color de camiseta diferente al seleccionado.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            Cómo hacer una reclamación
          </h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-medium text-cyan">
                1
              </span>
              <p>
                Envía un correo a{" "}
                <a
                  href="mailto:arke.servicio@gmail.com"
                  className="text-cyan hover:underline"
                >
                  arke.servicio@gmail.com
                </a>{" "}
                dentro de las <strong className="text-text-primary">48 horas</strong>{" "}
                siguientes a recibir tu pedido.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-medium text-cyan">
                2
              </span>
              <p>
                Incluye fotos claras del producto mostrando el defecto, tu
                número de pedido y una breve descripción del problema.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan/10 text-xs font-medium text-cyan">
                3
              </span>
              <p>
                Evaluaremos tu caso en máximo 48 horas hábiles y te
                contactaremos con la solución.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            No aplica garantía cuando
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>El diseño subido por el usuario es de baja resolución.</li>
            <li>
              El daño es causado por mal uso, lavado incorrecto o desgaste
              natural.
            </li>
            <li>La reclamación se realiza fuera del plazo de 48 horas.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            Cuidados recomendados
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>Lavar al revés con agua fría.</li>
            <li>No usar blanqueador.</li>
            <li>Secar a la sombra.</li>
            <li>Planchar al revés sin pasar directamente sobre el estampado.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
