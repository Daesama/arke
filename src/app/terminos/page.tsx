import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones de uso de ARKE, plataforma de camisetas personalizadas en Bogotá.",
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-medium text-cyan">
        Términos y Condiciones
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Última actualización: julio 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-secondary">
        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            1. Aceptación de los términos
          </h2>
          <p>
            Al acceder y utilizar la plataforma ARKE (arkei.co), aceptas estos
            términos y condiciones en su totalidad. Si no estás de acuerdo con
            alguna parte, te pedimos que no utilices nuestros servicios.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            2. Descripción del servicio
          </h2>
          <p>
            ARKE es una plataforma de e-commerce que permite a los usuarios
            crear camisetas personalizadas subiendo sus propias imágenes,
            eligiendo color, talla y material, y recibiéndolas en la ciudad de
            Bogotá, Colombia.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            3. Registro y cuenta
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              Debes proporcionar información veraz y actualizada al crear tu
              cuenta.
            </li>
            <li>
              Eres responsable de mantener la confidencialidad de tu contraseña.
            </li>
            <li>
              ARKE se reserva el derecho de suspender o cancelar cuentas que
              violen estos términos.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            4. Pedidos y pagos
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              Los precios están expresados en pesos colombianos (COP) e incluyen
              IVA cuando aplique.
            </li>
            <li>
              Una vez confirmado el pago, el pedido entra en producción y no
              puede ser cancelado.
            </li>
            <li>
              Aceptamos pagos a través de Wompi (tarjeta de crédito/débito, PSE,
              Nequi, Daviplata) y contraentrega en Bogotá.
            </li>
            <li>
              El costo de envío se muestra antes de confirmar tu pedido.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            5. Diseños y propiedad intelectual
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              El usuario es responsable de los diseños que sube a la plataforma.
            </li>
            <li>
              No se aceptan diseños que infrinjan derechos de autor, marcas
              registradas o contengan material ilegal, ofensivo o
              discriminatorio.
            </li>
            <li>
              ARKE se reserva el derecho de rechazar cualquier diseño que viole
              esta política sin obligación de reembolso.
            </li>
            <li>
              Los diseños subidos por el usuario son de su propiedad. ARKE no
              los utilizará para otros fines sin autorización.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            6. Envíos
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              Actualmente realizamos envíos únicamente dentro de Bogotá,
              Colombia.
            </li>
            <li>
              El tiempo estimado de entrega es de 3 a 7 días hábiles después de
              confirmado el pago.
            </li>
            <li>
              ARKE no se hace responsable por demoras ocasionadas por la empresa
              de mensajería o por información de entrega incorrecta.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            7. Devoluciones y garantía
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              Por tratarse de productos personalizados, no se aceptan
              devoluciones por cambio de opinión.
            </li>
            <li>
              Si el producto llega con defectos de fabricación o errores de
              estampado atribuibles a ARKE, realizamos cambio sin costo
              adicional.
            </li>
            <li>
              Las reclamaciones deben realizarse dentro de las 48 horas
              siguientes a la entrega, enviando fotos del producto a{" "}
              <a
                href="mailto:arke.servicio@gmail.com"
                className="text-cyan hover:underline"
              >
                arke.servicio@gmail.com
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            8. Limitación de responsabilidad
          </h2>
          <p>
            ARKE no será responsable por daños indirectos, incidentales o
            consecuentes derivados del uso de la plataforma. Nuestro servicio se
            proporciona &quot;tal cual&quot; y no garantizamos disponibilidad
            ininterrumpida.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            9. Modificaciones
          </h2>
          <p>
            ARKE puede modificar estos términos en cualquier momento. Los
            cambios se publicarán en esta página y entrarán en vigencia
            inmediatamente. El uso continuado de la plataforma después de los
            cambios constituye aceptación de los mismos.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            10. Contacto
          </h2>
          <p>
            Para cualquier consulta sobre estos términos, escríbenos a{" "}
            <a
              href="mailto:arke.servicio@gmail.com"
              className="text-cyan hover:underline"
            >
              arke.servicio@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
