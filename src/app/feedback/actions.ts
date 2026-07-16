"use server";

import { createClient } from "@/lib/supabase/server";

interface FeedbackResult {
  error?: string;
  success?: boolean;
}

export async function submitFeedback(formData: FormData): Promise<FeedbackResult> {
  const type = formData.get("type") as string;
  const message = (formData.get("message") as string)?.trim();
  const pageUrl = formData.get("page_url") as string;
  const userAgent = formData.get("user_agent") as string;

  if (!type || !message) {
    return { error: "Tipo y mensaje son obligatorios." };
  }

  if (message.length < 5) {
    return { error: "El mensaje debe tener al menos 5 caracteres." };
  }

  if (message.length > 2000) {
    return { error: "El mensaje no puede superar los 2000 caracteres." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    type,
    message,
    page_url: pageUrl || null,
    user_agent: userAgent || null,
  });

  if (error) {
    console.error("[feedback] Insert error:", error);
    return { error: "No se pudo enviar. Intenta de nuevo." };
  }

  return { success: true };
}
