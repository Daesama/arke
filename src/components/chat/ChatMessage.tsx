"use client";

import { cn } from "@/lib/utils/cn";
import { Sparkles, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface ChatMessageProps {
  message: ChatMessageType;
  onGenerate?: (prompt: string) => void;
  isGenerating?: boolean;
}

export function ChatMessage({ message, onGenerate, isGenerating }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex gap-3", !isAssistant && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isAssistant ? "bg-violet/10 text-violet" : "bg-cyan/10 text-cyan",
        )}
      >
        {isAssistant ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      <div className="flex max-w-[80%] flex-col gap-2">
        {message.imageBase64 && (
          <div
            className={cn(
              "overflow-hidden rounded-xl border",
              isAssistant ? "border-elevated" : "border-cyan/20",
            )}
          >
            <img
              src={message.imageBase64}
              alt="Imagen adjunta"
              className="h-32 w-auto object-cover"
            />
          </div>
        )}

        {message.content && (
          <div
            className={cn(
              "rounded-xl px-4 py-3 text-sm leading-relaxed",
              isAssistant
                ? "border border-cyan/10 bg-deep text-text-primary"
                : "bg-elevated text-text-primary",
            )}
          >
            {message.content}
          </div>
        )}

        {message.generatePrompt && onGenerate && (
          <button
            type="button"
            onClick={() => onGenerate(message.generatePrompt!)}
            disabled={isGenerating}
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
              isGenerating
                ? "bg-surface text-text-muted"
                : "bg-cyan text-void shadow-glow-cyan hover:shadow-glow-cyan-lg",
            )}
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generando..." : "Generar diseño"}
          </button>
        )}
      </div>
    </div>
  );
}
