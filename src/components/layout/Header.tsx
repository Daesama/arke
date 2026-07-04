"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { NAV_LINKS } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/stores/cartStore";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-elevated bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/isotipo-color.png"
            alt="ARKE"
            width={32}
            height={32}
            className="sm:hidden"
          />
          <Image
            src="/brand/logo-horizontal-color.svg"
            alt="ARKE"
            width={120}
            height={32}
            className="hidden sm:block"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm text-text-secondary transition-colors duration-200 hover:bg-surface hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/carrito"
            className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
            aria-label="Carrito de compras"
          >
            <ShoppingCart className="h-5 w-5" />
            {mounted && totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-cyan px-1 text-[10px] font-medium text-void">
                {totalItems}
              </span>
            )}
          </Link>

          <Link href="/crear" className="hidden sm:block">
            <Button size="sm">Crear diseño</Button>
          </Link>

          <button
            type="button"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-elevated md:hidden",
          mobileMenuOpen ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/crear" onClick={() => setMobileMenuOpen(false)}>
            <Button size="sm" className="mt-2 w-full">
              Crear diseño
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
