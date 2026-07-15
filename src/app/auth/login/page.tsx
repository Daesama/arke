"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const callbackError = searchParams.get("error");

  useEffect(() => {
    if (callbackError === "verification") {
      setError(
        "El link de verificación expiró o es inválido. Intenta registrarte de nuevo.",
      );
    }
  }, [callbackError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes("Email not confirmed")) {
        setError(
          "Tu email no ha sido verificado. Revisa tu bandeja de entrada.",
        );
      } else {
        setError("Email o contraseña incorrectos.");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      const safeRedirect = redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/crear";
      router.push(safeRedirect);
      router.refresh();
    }, 1200);
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-cyan/10 p-4 text-cyan animate-pulse">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-medium text-text-primary">
            ¡Bienvenido de vuelta!
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            Preparando todo para ti...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/brand/isotipo-color.png"
            alt="ARKE"
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <h1 className="font-heading text-2xl font-medium text-text-primary">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Ingresa a tu cuenta para seguir creando
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-1.5 text-right">
              <Link
                href="/auth/recuperar"
                className="text-xs text-text-muted transition-colors hover:text-cyan"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-magenta/10 px-4 py-2 text-sm text-magenta">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={loading} className="w-full">
            Ingresar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          ¿No tienes cuenta?{" "}
          <Link
            href={`/auth/registro${redirect ? `?redirect=${redirect}` : ""}`}
            className="text-cyan hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
