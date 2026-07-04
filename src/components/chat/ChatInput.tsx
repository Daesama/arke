"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if ((!trimmed && !imagePreview) || disabled) return;
    onSend(trimmed || "Usá esta imagen como referencia.", imagePreview ?? undefined);
    setValue("");
    setImagePreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage() {
    setImagePreview(null);
  }

  const canSend = (value.trim() || imagePreview) && !disabled;

  return (
    <div className="border-t border-elevated bg-deep p-4">
      {imagePreview && (
        <div className="mb-3 inline-flex items-start gap-2">
          <div className="relative overflow-hidden rounded-lg border border-elevated">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 w-auto object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-1 top-1 rounded-full bg-void/80 p-0.5 text-text-secondary transition-colors hover:text-magenta"
              aria-label="Quitar imagen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Adjuntar imagen"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-elevated text-text-muted transition-colors hover:border-cyan/30 hover:text-cyan disabled:opacity-50"
          aria-label="Adjuntar imagen"
        >
          <ImagePlus className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Describe tu diseño ideal..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-elevated bg-void px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/30 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            canSend
              ? "bg-cyan text-void shadow-glow-cyan hover:shadow-glow-cyan-lg"
              : "bg-surface text-text-muted",
          )}
          aria-label="Enviar mensaje"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
