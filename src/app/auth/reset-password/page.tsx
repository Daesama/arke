"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(
        updateError.message.includes("same")
          ? "La nueva contraseña debe ser diferente a la anterior."
          : "Error al actualizar la contraseña. Intenta de nuevo.",
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/crear?welcome=true");
      router.refresh();
    }, 2000);
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-green-500/10 p-4 text-green-400">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-medium text-text-primary">
            Contraseña actualizada
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            Tu contraseña fue cambiada exitosamente. Redirigiendo...
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
            Nueva contraseña
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Elige una contraseña nueva para tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="password"
            label="Nueva contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Input
            id="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <p className="rounded-lg bg-magenta/10 px-4 py-2 text-sm text-magenta">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={loading} className="w-full">
            Guardar contraseña
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          ¿Recordaste tu contraseña?{" "}
          <Link href="/auth/login" className="text-cyan hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
