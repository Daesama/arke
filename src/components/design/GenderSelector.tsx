"use client";

import { cn } from "@/lib/utils/cn";
import { TSHIRT_GENDERS } from "@/lib/utils/constants";
import type { TshirtGenero } from "@/types/database";

interface GenderSelectorProps {
  value: TshirtGenero | null;
  onChange: (gender: TshirtGenero) => void;
}

export function GenderSelector({ value, onChange }: GenderSelectorProps) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
        Género
      </p>
      <div className="flex gap-2">
        {TSHIRT_GENDERS.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => onChange(g.value as TshirtGenero)}
            className={cn(
              "flex-1 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200",
              value === g.value
                ? "border-cyan bg-cyan/10 text-cyan shadow-glow-cyan"
                : "border-elevated text-text-secondary hover:border-text-muted hover:text-text-primary",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
