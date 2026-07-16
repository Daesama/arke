"use client";

import { useState, useEffect } from "react";
import { X, Bug, Lightbulb, MessageCircle, Send, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { submitFeedback } from "@/app/feedback/actions";

const TYPES = [
  { value: "error", label: "Reportar error", icon: Bug, color: "magenta" },
  { value: "idea", label: "Sugerencia", icon: Lightbulb, color: "cyan" },
  { value: "otro", label: "Otro", icon: MessageCircle, color: "violet" },
] as const;

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<string>("error");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType("error");
      setMessage("");
      setSent(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit() {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("type", type);
    formData.set("message", message);
    formData.set("page_url", window.location.href);
    formData.set("user_agent", navigator.userAgent);

    const result = await submitFeedback(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
    setTimeout(onClose, 2000);
  }

  const placeholders: Record<string, string> = {
    error: "Describe el error que encontraste. Ej: al subir una imagen la página se congela...",
    idea: "Cuéntanos tu idea o sugerencia para mejorar ARKE...",
    otro: "Escríbenos lo que quieras...",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="fixed inset-0 bg-void/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-t-2xl border border-elevated bg-deep shadow-2xl shadow-black/40 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="font-heading text-lg font-medium text-text-primary">
            {sent ? "Gracias" : "Ayúdanos a mejorar"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="rounded-2xl bg-green-400/10 p-3">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-sm text-text-secondary">Tu mensaje fue enviado. Lo revisaremos pronto.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all duration-200",
                        isActive
                          ? t.color === "magenta"
                            ? "border-magenta/40 bg-magenta/10 text-magenta"
                            : t.color === "cyan"
                              ? "border-cyan/40 bg-cyan/10 text-cyan"
                              : "border-violet/40 bg-violet/10 text-violet"
                          : "border-elevated bg-surface/50 text-text-muted hover:border-elevated hover:text-text-secondary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={placeholders[type]}
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-elevated/60 bg-void/50 px-4 py-3 text-sm text-text-primary placeholder-text-muted backdrop-blur-sm transition-all duration-300 focus:border-cyan/50 focus:outline-none focus:ring-2 focus:ring-cyan/20"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">
                  {message.length}/2000
                </span>
                <span className="text-[11px] text-text-muted">
                  No necesitas cuenta para enviar
                </span>
              </div>

              {error && (
                <p className="rounded-lg border border-magenta/20 bg-magenta/[0.07] px-3 py-2 text-xs text-magenta">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!message.trim() || loading}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  message.trim() && !loading
                    ? "bg-cyan text-void hover:shadow-glow-cyan"
                    : "bg-elevated/60 text-text-muted cursor-not-allowed",
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
