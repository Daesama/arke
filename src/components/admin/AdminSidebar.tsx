"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: Package },
  { href: "/admin/productos", label: "Productos", icon: ShoppingBag },
  { href: "/admin/disenos", label: "Diseños", icon: ImageIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-elevated bg-deep lg:block">
      <div className="p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-violet">
          Admin Panel
        </p>
      </div>
      <nav className="space-y-1 px-2">
        {adminLinks.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-cyan/10 text-cyan"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary",
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
