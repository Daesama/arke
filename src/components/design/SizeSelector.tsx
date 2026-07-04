"use client";

import { cn } from "@/lib/utils/cn";
import { TSHIRT_SIZES } from "@/lib/utils/constants";
import type { TshirtSize } from "@/types/database";

interface SizeSelectorProps {
  value: TshirtSize;
  onChange: (size: TshirtSize) => void;
}

export function SizeSelector({ value, onChange }: SizeSelectorProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-text-secondary">Talla</p>
      <div className="flex flex-wrap gap-1.5">
        {TSHIRT_SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s as TshirtSize)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition-all duration-200",
              value === s
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-elevated text-text-secondary hover:border-text-muted hover:text-text-primary",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
