import Link from "next/link";
import Image from "next/image";

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
      { label: "Preguntas frecuentes", href: "#" },
      { label: "Contacto", href: "#" },
      { label: "Envíos", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos", href: "#" },
      { label: "Privacidad", href: "#" },
      { label: "Devoluciones", href: "#" },
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
              Camisetas personalizadas con tu propio diseño. Subí tu imagen y nosotros la estampamos.
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-cyan/60">
              Tu Diseño, Tu Estilo
            </p>
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
            &copy; {new Date().getFullYear()} ARKE. Todos los derechos reservados.
          </p>
          <p className="text-xs text-text-muted">Hecho en Colombia 🇨🇴</p>
        </div>
      </div>
    </footer>
  );
}
