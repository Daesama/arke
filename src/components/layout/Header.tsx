"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ShoppingCart,
  LogIn,
  LogOut,
  User,
  Package,
  ChevronDown,
  MessageSquareMore,
} from "lucide-react";
import { NAV_LINKS } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/stores/cartStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FeedbackModal } from "./FeedbackModal";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) =>
        setUser(data.user ? { email: data.user.email ?? "" } : null),
      );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user ? { email: session.user.email ?? "" } : null,
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-void/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/isotipo-color.png"
            alt="ARKE"
            width={32}
            height={32}
            className="animate-logo-shimmer sm:hidden"
          />
          <Image
            src="/brand/logo-horizontal-color.svg"
            alt="ARKE"
            width={120}
            height={32}
            className="hidden animate-logo-shimmer sm:block"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link-animate rounded-lg px-3.5 py-2 text-[13px] font-medium text-text-secondary transition-all duration-300 hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && !user && (
            <Link
              href="/auth/login"
              className="hidden items-center gap-1.5 rounded-xl border border-elevated/60 px-3.5 py-1.5 text-[13px] font-medium text-text-secondary transition-all duration-200 hover:border-cyan/25 hover:bg-cyan/5 hover:text-cyan sm:flex"
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Link>
          )}

          {mounted && user && (
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-elevated/60 px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-all duration-200 hover:border-cyan/25 hover:bg-cyan/5 hover:text-text-primary"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan/10 text-cyan">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="max-w-[120px] truncate">{user.email}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    dropdownOpen && "rotate-180",
                  )}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-elevated bg-deep shadow-xl shadow-black/30">
                  <div className="border-b border-elevated px-4 py-3">
                    <p className="text-xs text-text-muted">Cuenta</p>
                    <p className="mt-0.5 truncate text-sm text-text-primary">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/pedidos"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                    >
                      <Package className="h-4 w-4" />
                      Mis pedidos
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-magenta/80 transition-colors hover:bg-magenta/5 hover:text-magenta"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="hidden rounded-xl p-2.5 text-text-secondary transition-all duration-200 hover:bg-violet/10 hover:text-violet sm:block"
            aria-label="Sugerencias y reportes"
            title="Sugerencias"
          >
            <MessageSquareMore className="h-5 w-5" />
          </button>

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
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t border-white/[0.06] bg-void/90 backdrop-blur-2xl md:hidden",
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

          {mounted && !user && (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-cyan transition-colors hover:bg-cyan/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Link>
          )}

          {mounted && user && (
            <div className="mt-2 border-t border-elevated pt-3">
              <div className="mb-2 flex items-center gap-2 px-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/10 text-cyan">
                  <User className="h-4 w-4" />
                </div>
                <span className="truncate text-sm text-text-primary">
                  {user.email}
                </span>
              </div>
              <Link
                href="/pedidos"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface/60 hover:text-text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Package className="h-4 w-4" />
                Mis pedidos
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-magenta/80 transition-colors hover:bg-magenta/5 hover:text-magenta"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setFeedbackOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-violet transition-colors hover:bg-violet/5"
          >
            <MessageSquareMore className="h-4 w-4" />
            Sugerencias
          </button>

          <Link href="/crear" onClick={() => setMobileMenuOpen(false)}>
            <Button size="sm" className="mt-3 w-full">
              Crear diseño
            </Button>
          </Link>
        </nav>
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
