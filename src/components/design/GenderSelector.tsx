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
              "flex-1 rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-300",
              value === g.value
                ? "border-cyan/30 bg-cyan/[0.08] text-cyan shadow-[0_0_20px_rgba(0,240,255,0.12)] backdrop-blur-sm"
                : "border-white/[0.06] text-text-secondary hover:border-cyan/20 hover:text-text-primary hover:bg-surface/30",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
