import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de privacidad y tratamiento de datos personales de ARKE.",
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-medium text-cyan">
        Política de Privacidad
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Última actualización: julio 2026
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-secondary">
        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            1. Responsable del tratamiento
          </h2>
          <p>
            ARKE, con domicilio en Bogotá, Colombia, es el responsable del
            tratamiento de tus datos personales. Puedes contactarnos en{" "}
            <a
              href="mailto:arke.servicio@gmail.com"
              className="text-cyan hover:underline"
            >
              arke.servicio@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            2. Datos que recopilamos
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-text-primary">Datos de registro:</strong>{" "}
              nombre completo, correo electrónico y contraseña cifrada.
            </li>
            <li>
              <strong className="text-text-primary">Datos de pedido:</strong>{" "}
              dirección de envío, teléfono de contacto, método de pago
              seleccionado.
            </li>
            <li>
              <strong className="text-text-primary">Diseños:</strong> imágenes
              que subes para personalizar tus camisetas.
            </li>
            <li>
              <strong className="text-text-primary">Datos de uso:</strong>{" "}
              información técnica como tipo de navegador, dispositivo y páginas
              visitadas.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            3. Finalidad del tratamiento
          </h2>
          <p>Utilizamos tus datos para:</p>
          <ul className="mt-2 list-inside list-disc space-y-1.5">
            <li>Procesar y entregar tus pedidos.</li>
            <li>Gestionar tu cuenta de usuario.</li>
            <li>
              Enviarte notificaciones sobre el estado de tus pedidos por correo
              electrónico.
            </li>
            <li>Mejorar nuestro servicio y experiencia de usuario.</li>
            <li>Cumplir con obligaciones legales y tributarias.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            4. Base legal
          </h2>
          <p>
            El tratamiento de tus datos se realiza conforme a la Ley 1581 de
            2012 (Ley de Protección de Datos Personales de Colombia) y el
            Decreto 1377 de 2013. La base legal es tu consentimiento al crear
            una cuenta y realizar un pedido, así como la ejecución del contrato
            de compraventa.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            5. Compartición de datos
          </h2>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <strong className="text-text-primary">
                Procesador de pagos (Wompi):
              </strong>{" "}
              recibe los datos necesarios para procesar tu transacción. ARKE no
              almacena datos de tarjetas de crédito.
            </li>
            <li>
              <strong className="text-text-primary">
                Servicio de mensajería:
              </strong>{" "}
              recibe tu dirección y teléfono para realizar la entrega.
            </li>
            <li>
              <strong className="text-text-primary">
                Proveedores de infraestructura:
              </strong>{" "}
              Supabase (base de datos y autenticación) y Vercel (hosting).
            </li>
          </ul>
          <p className="mt-2">
            No vendemos, alquilamos ni compartimos tus datos con terceros para
            fines publicitarios.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            6. Seguridad
          </h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para
            proteger tus datos, incluyendo cifrado de contraseñas,
            comunicaciones HTTPS y control de acceso a la base de datos.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            7. Tus derechos
          </h2>
          <p>
            De acuerdo con la ley colombiana, tienes derecho a:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1.5">
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>
              Solicitar prueba de la autorización otorgada para el tratamiento.
            </li>
            <li>Revocar la autorización y/o solicitar la supresión de tus datos.</li>
            <li>Acceder gratuitamente a tus datos personales.</li>
          </ul>
          <p className="mt-2">
            Para ejercer estos derechos, escríbenos a{" "}
            <a
              href="mailto:arke.servicio@gmail.com"
              className="text-cyan hover:underline"
            >
              arke.servicio@gmail.com
            </a>{" "}
            indicando tu nombre completo, correo registrado y la solicitud
            específica.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            8. Cookies
          </h2>
          <p>
            Utilizamos cookies esenciales para el funcionamiento de la
            plataforma (autenticación y sesión). No utilizamos cookies de
            seguimiento ni publicidad de terceros.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            9. Retención de datos
          </h2>
          <p>
            Conservamos tus datos mientras mantengas tu cuenta activa. Los datos
            de pedidos se conservan por el tiempo exigido por la legislación
            tributaria colombiana. Puedes solicitar la eliminación de tu cuenta y
            datos en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-heading text-lg font-medium text-text-primary">
            10. Cambios a esta política
          </h2>
          <p>
            Podemos actualizar esta política periódicamente. Los cambios serán
            publicados en esta página con la fecha de actualización. Te
            recomendamos revisarla regularmente.
          </p>
        </section>
      </div>
    </div>
  );
}
