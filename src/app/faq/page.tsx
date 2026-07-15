import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes",
  description:
    "Respuestas a las preguntas más comunes sobre camisetas personalizadas en ARKE.",
};

const faqs = [
  {
    question: "¿Cómo funciona ARKE?",
    answer:
      "Subes tu propia imagen, eliges el color, talla y material de tu camiseta, previsualizas cómo queda y haces tu pedido. Nosotros nos encargamos de estamparla y enviarla a tu puerta en Bogotá.",
  },
  {
    question: "¿Qué formato de imagen puedo subir?",
    answer:
      "Aceptamos JPG, PNG y WebP. Para mejores resultados, recomendamos imágenes de alta resolución (mínimo 1000×1000 px). También puedes usar la herramienta de quitar fondo para que tu diseño quede limpio sobre la camiseta.",
  },
  {
    question: "¿Cuánto tarda en llegar mi pedido?",
    answer:
      "El tiempo estimado de entrega es de 3 a 7 días hábiles después de confirmado el pago. Te enviaremos actualizaciones por correo electrónico sobre el estado de tu pedido.",
  },
  {
    question: "¿A dónde hacen envíos?",
    answer:
      "Actualmente realizamos envíos únicamente dentro de Bogotá, Colombia. Estamos trabajando para expandir nuestra cobertura pronto.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos tarjeta de crédito/débito, PSE, Nequi y Daviplata a través de Wompi. También ofrecemos la opción de pago contraentrega en Bogotá.",
  },
  {
    question: "¿Qué materiales de camiseta ofrecen?",
    answer:
      "Ofrecemos tres materiales: Piel de Durazno (suave al tacto, ligera), Algodón Licrado (clásica, cómoda y flexible) y Seda Fría (fresca, ideal para clima cálido).",
  },
  {
    question: "¿Puedo usar cualquier imagen?",
    answer:
      "Puedes usar tus propias imágenes, fotos o diseños. No se aceptan imágenes que infrinjan derechos de autor, marcas registradas o contengan material ofensivo. ARKE se reserva el derecho de rechazar diseños que violen esta política.",
  },
  {
    question: "¿El estampado se daña con el lavado?",
    answer:
      "Nuestros estampados son de alta calidad y duraderos. Recomendamos lavar la camiseta al revés, con agua fría y sin blanqueador para máxima durabilidad.",
  },
  {
    question: "¿Puedo devolver mi camiseta?",
    answer:
      "Por tratarse de productos personalizados, no aceptamos devoluciones por cambio de opinión. Si el producto llega con defectos de fabricación, realizamos cambio sin costo. Las reclamaciones deben hacerse dentro de 48 horas de la entrega a arke.servicio@gmail.com.",
  },
  {
    question: "¿Cómo los contacto?",
    answer:
      "Puedes escribirnos a arke.servicio@gmail.com o por Instagram en @arke_tienda. Respondemos en menos de 24 horas.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-medium text-cyan">
        Preguntas Frecuentes
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Todo lo que necesitas saber sobre ARKE
      </p>

      <div className="mt-10 space-y-6">
        {faqs.map((faq) => (
          <div
            key={faq.question}
            className="rounded-xl border border-elevated/60 bg-surface/30 px-6 py-5"
          >
            <h2 className="font-heading text-base font-medium text-text-primary">
              {faq.question}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-cyan/15 bg-cyan/5 px-6 py-5 text-center">
        <p className="text-sm text-text-secondary">
          ¿No encontraste lo que buscabas? Escríbenos a{" "}
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
