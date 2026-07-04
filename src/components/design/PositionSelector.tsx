"use client";

import { cn } from "@/lib/utils/cn";
import { PRINT_POSITIONS } from "@/lib/utils/constants";
import type { PrintPosition } from "@/types/database";

interface PositionSelectorProps {
  value: PrintPosition;
  onChange: (position: PrintPosition) => void;
}

export function PositionSelector({ value, onChange }: PositionSelectorProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-text-secondary">Posición</p>
      <div className="flex flex-wrap gap-1.5">
        {PRINT_POSITIONS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value as PrintPosition)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition-all duration-200",
              value === p.value
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-elevated text-text-secondary hover:border-text-muted hover:text-text-primary",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
