import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

const footerLinks = [
  {
    title: "Producto",
    links: [
      { label: "Crear diseño", href: "/crear" },
      { label: "Catálogo", href: "/catalogo" },
      { label: "Mis pedidos", href: "/pedidos" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "Preguntas frecuentes", href: "/faq" },
      { label: "Envíos", href: "/envios" },
      { label: "Devoluciones", href: "/devoluciones" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "/terminos" },
      { label: "Política de privacidad", href: "/privacidad" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-elevated bg-deep">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/brand/logo-horizontal-color.svg"
              alt="ARKE"
              width={100}
              height={28}
            />
            <p className="mt-4 text-sm text-text-muted">
              Camisetas personalizadas con tu propio diseño. Sube tu imagen y
              nosotros la estampamos.
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-cyan/60">
              Tu imagen. Tu camisa.
            </p>

            <div className="mt-5 space-y-2.5">
              <a
                href="mailto:arke.servicio@gmail.com"
                className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-cyan"
              >
                <Mail className="h-4 w-4" />
                arke.servicio@gmail.com
              </a>
              <a
                href="https://instagram.com/arke_tienda"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-cyan"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                @arke_tienda
              </a>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="font-heading text-sm font-medium text-text-primary">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted transition-colors hover:text-cyan"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-elevated pt-8 sm:flex-row">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} ARKE. Todos los derechos
            reservados.
          </p>
          <p className="text-xs text-text-muted">Hecho en Bogotá, Colombia</p>
        </div>
      </div>
    </footer>
  );
}
