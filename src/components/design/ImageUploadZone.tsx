"use client";

import { useRef } from "react";
import { Upload, X, Loader2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImageUploadZoneProps {
  label: string;
  description: string;
  imagePreview: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  onRemoveBg?: () => void;
  onRestoreBg?: () => void;
  bgRemovalStatus?: "idle" | "processing" | "done" | "error";
  hasBgRemoved?: boolean;
  bgRemovalError?: string | null;
}

const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.webp";

export function ImageUploadZone({
  label,
  imagePreview,
  onFileSelect,
  onRemove,
  disabled,
  onRemoveBg,
  onRestoreBg,
  bgRemovalStatus = "idle",
  hasBgRemoved = false,
  bgRemovalError,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isProcessing = bgRemovalStatus === "processing";
  const hasError = bgRemovalStatus === "error";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-deep/50 px-3 py-2.5 backdrop-blur-sm transition-all duration-300 hover:border-cyan/15 hover:bg-deep/70">
        {imagePreview ? (
          <div
            className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-elevated/60 bg-void"
            onClick={() => inputRef.current?.click()}
          >
            <img
              src={imagePreview}
              alt={label}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "dash-animate flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
              "hover:bg-cyan/5",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <Upload className="h-3.5 w-3.5 text-text-muted" />
          </button>
        )}

        <span className="flex-1 text-xs font-medium text-text-primary truncate">{label}</span>

        {imagePreview ? (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-magenta/10 hover:text-magenta"
            aria-label={`Eliminar ${label}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="shrink-0 rounded-lg border border-elevated/60 px-2.5 py-1 text-[10px] font-medium text-text-secondary transition-colors hover:border-cyan/30 hover:text-cyan hover:bg-cyan/5"
          >
            Subir
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleChange}
          className="hidden"
          aria-label={`Subir imagen para ${label}`}
        />
      </div>

      {imagePreview && onRemoveBg && (
        <div className="mt-1 space-y-1">
          {hasBgRemoved ? (
            <button
              type="button"
              onClick={onRestoreBg}
              disabled={isProcessing}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet/25 bg-violet/5 px-3 py-2 text-xs font-medium text-violet transition-all duration-200 hover:border-violet/40 hover:bg-violet/10"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Restaurar fondo original
            </button>
          ) : (
            <button
              type="button"
              onClick={onRemoveBg}
              disabled={isProcessing || disabled}
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                hasError
                  ? "border-magenta/30 bg-magenta/5 text-magenta"
                  : isProcessing
                    ? "border-cyan/30 bg-cyan/5 text-cyan"
                    : "border-cyan/25 bg-cyan/5 text-cyan hover:border-cyan/40 hover:bg-cyan/10 hover:shadow-[0_0_12px_rgba(0,240,255,0.1)]",
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="text-sm leading-none">&#9986;</span>
              )}
              {isProcessing
                ? "Quitando fondo..."
                : hasError
                  ? "Reintentar quitar fondo"
                  : "Quitar fondo"}
            </button>
          )}
          {hasError && bgRemovalError && (
            <p className="px-1 text-[10px] text-magenta/80">{bgRemovalError}</p>
          )}
        </div>
      )}
    </div>
  );
}
