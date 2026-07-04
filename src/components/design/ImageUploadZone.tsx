"use client";

import { useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImageUploadZoneProps {
  label: string;
  description: string;
  imagePreview: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.webp";

export function ImageUploadZone({
  label,
  description,
  imagePreview,
  onFileSelect,
  onRemove,
  disabled,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-lg border border-elevated bg-deep p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
        {imagePreview && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-magenta/10 hover:text-magenta"
            aria-label={`Eliminar imagen de ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {imagePreview ? (
        <div className="relative overflow-hidden rounded-md border border-elevated">
          <img
            src={imagePreview}
            alt={`Preview de ${label}`}
            className="h-24 w-full object-contain bg-void"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="absolute inset-0 flex items-center justify-center bg-void/60 opacity-0 transition-opacity hover:opacity-100"
          >
            <span className="rounded-md bg-surface px-3 py-1.5 text-xs text-text-primary">
              Cambiar imagen
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-elevated py-6 transition-all",
            "hover:border-cyan/50 hover:bg-cyan/5",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text-muted">
            <Upload className="h-4 w-4" />
          </div>
          <span className="text-xs text-text-secondary">Subir imagen</span>
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
  );
}
