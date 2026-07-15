"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Mail } from "lucide-react";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      },
    );

    if (resetError) {
      if (resetError.message.includes("rate limit")) {
        setError("Demasiados intentos. Espera unos minutos e intenta de nuevo.");
      } else {
        setError("No pudimos enviar el email. Verifica que el correo sea correcto.");
      }
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-cyan/10 p-4 text-cyan">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-medium text-text-primary">
            Revisa tu email
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            Enviamos un link de recuperación a{" "}
            <strong className="text-text-primary">{email}</strong>. Haz clic en
            el link para crear una nueva contraseña.
          </p>
          <p className="mt-4 text-xs text-text-muted">
            ¿No lo ves? Revisa tu carpeta de spam.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-cyan hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al login
          </Link>
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
            Recupera tu contraseña
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Ingresa tu email y te enviamos un link para restablecerla
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

          {error && (
            <p className="rounded-lg bg-magenta/10 px-4 py-2 text-sm text-magenta">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={loading} className="w-full">
            Enviar link de recuperación
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
