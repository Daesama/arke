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
    <div className="flex items-center gap-2.5 rounded-lg border border-elevated bg-deep px-2.5 py-2">
      {imagePreview ? (
        <div
          className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border border-elevated bg-void"
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
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-elevated transition-colors",
            "hover:border-cyan/50 hover:bg-cyan/5",
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
          className="shrink-0 rounded-md border border-elevated px-2 py-1 text-[10px] text-text-secondary transition-colors hover:border-cyan/50 hover:text-cyan"
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
  );
}
