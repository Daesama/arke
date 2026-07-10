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
  bgRemovalStatus?: "idle" | "downloading" | "processing" | "done";
  hasBgRemoved?: boolean;
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
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isProcessing = bgRemovalStatus === "downloading" || bgRemovalStatus === "processing";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5 rounded-xl border border-elevated/70 bg-deep/80 px-3 py-2.5 transition-colors duration-200 hover:border-elevated">
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
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-elevated/60 transition-colors",
              "hover:border-cyan/40 hover:bg-cyan/5",
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
        <div className="pl-[52px]">
          {hasBgRemoved ? (
            <button
              type="button"
              onClick={onRestoreBg}
              disabled={isProcessing}
              className="flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-violet"
            >
              <Undo2 className="h-3 w-3" />
              Restaurar fondo original
            </button>
          ) : (
            <button
              type="button"
              onClick={onRemoveBg}
              disabled={isProcessing || disabled}
              className={cn(
                "flex items-center gap-1 text-[10px] transition-colors",
                isProcessing
                  ? "text-cyan"
                  : "text-text-muted hover:text-cyan",
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="inline-block h-3 w-3 text-center leading-3">✂</span>
              )}
              {bgRemovalStatus === "downloading"
                ? "Descargando modelo..."
                : bgRemovalStatus === "processing"
                  ? "Quitando fondo..."
                  : "Quitar fondo"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
