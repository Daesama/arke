"use client";

import { cn } from "@/lib/utils/cn";
import { TSHIRT_MATERIALS } from "@/lib/utils/constants";
import type { TshirtMaterial } from "@/types/database";

interface MaterialSelectorProps {
  value: TshirtMaterial | null;
  onChange: (material: TshirtMaterial) => void;
}

export function MaterialSelector({ value, onChange }: MaterialSelectorProps) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
        Material
      </p>
      <div className="flex flex-col gap-1.5">
        {TSHIRT_MATERIALS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value as TshirtMaterial)}
            className={cn(
              "rounded-lg border px-3.5 py-2.5 text-left transition-all duration-300",
              value === m.value
                ? "border-cyan/30 bg-cyan/5 shadow-[0_0_20px_rgba(0,240,255,0.1)] backdrop-blur-sm"
                : "border-white/[0.06] bg-deep/60 hover:border-cyan/15 hover:bg-deep/80",
            )}
          >
            <span
              className={cn(
                "text-xs font-medium",
                value === m.value ? "text-cyan" : "text-text-primary",
              )}
            >
              {m.label}
            </span>
            <span
              className={cn(
                "mt-0.5 block text-[10px]",
                value === m.value ? "text-cyan/60" : "text-text-muted",
              )}
            >
              {m.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
