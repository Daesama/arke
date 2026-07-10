"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart, LogIn } from "lucide-react";
import { NAV_LINKS } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    createClient()
      .auth.getUser()
      .then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-elevated/40 bg-void/85 backdrop-blur-xl">
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
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-text-secondary transition-all duration-200 hover:bg-surface/50 hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && isLoggedIn === false && (
            <Link
              href="/auth/login"
              className="hidden items-center gap-1.5 rounded-xl border border-elevated/60 px-3.5 py-1.5 text-[13px] font-medium text-text-secondary transition-all duration-200 hover:border-cyan/25 hover:bg-cyan/5 hover:text-cyan sm:flex"
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Link>
          )}

          <Link
            href="/carrito"
            className="relative rounded-xl p-2.5 text-text-secondary transition-all duration-200 hover:bg-surface/50 hover:text-text-primary"
            aria-label="Carrito de compras"
          >
            <ShoppingCart className="h-5 w-5" />
            {mounted && totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cyan px-1 text-[10px] font-medium text-void shadow-glow-cyan">
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
          "border-t border-elevated/40 bg-void/95 backdrop-blur-xl md:hidden",
          mobileMenuOpen ? "block" : "hidden",
        )}
      >
        <nav className="flex flex-col gap-0.5 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface/60 hover:text-text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {mounted && isLoggedIn === false && (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-cyan transition-colors hover:bg-cyan/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Link>
          )}
          <Link href="/crear" onClick={() => setMobileMenuOpen(false)}>
            <Button size="sm" className="mt-3 w-full">
              Crear diseño
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
