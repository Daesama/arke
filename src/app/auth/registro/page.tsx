"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegistroPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-cyan/10 p-4 text-cyan">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-medium text-text-primary">
            ¡Revisá tu email!
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            Te enviamos un link de confirmación a <strong className="text-text-primary">{email}</strong>.
            Hacé click para activar tu cuenta.
          </p>
          <Link href="/auth/login" className="mt-6 inline-block text-sm text-cyan hover:underline">
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
            Creá tu cuenta
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Empezá a diseñar tus camisetas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullName"
            label="Nombre completo"
            type="text"
            placeholder="Tu nombre"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <p className="rounded-lg bg-magenta/10 px-4 py-2 text-sm text-magenta">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={loading} className="w-full">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/auth/login" className="text-cyan hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  );
}
