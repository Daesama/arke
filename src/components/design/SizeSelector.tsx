"use client";

import { cn } from "@/lib/utils/cn";
import { TSHIRT_SIZES } from "@/lib/utils/constants";
import type { TshirtSize } from "@/types/database";

interface SizeSelectorProps {
  value: TshirtSize | null;
  onChange: (size: TshirtSize) => void;
}

export function SizeSelector({ value, onChange }: SizeSelectorProps) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">Talla</p>
      <div className="flex gap-1.5">
        {TSHIRT_SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s as TshirtSize)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200",
              value === s
                ? "border-cyan/40 bg-cyan/[0.08] text-cyan"
                : "border-elevated/70 text-text-secondary hover:border-elevated hover:text-text-primary",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
