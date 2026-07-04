"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Pipette } from "lucide-react";
import { TSHIRT_COLORS } from "@/lib/utils/constants";

interface ColorSelectorProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorSelector({ value, onChange }: ColorSelectorProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  const isCustom = !TSHIRT_COLORS.some((c) => c.value === value);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-text-secondary">Color</p>
      <div className="flex flex-wrap items-center gap-2">
        {TSHIRT_COLORS.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onChange(c.value)}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-all duration-200",
              value === c.value
                ? "border-cyan shadow-glow-cyan scale-110"
                : "border-elevated hover:border-text-muted hover:scale-105",
            )}
            style={{ backgroundColor: c.value }}
            aria-label={c.name}
            title={c.name}
          />
        ))}

        <div className="relative">
          <input
            ref={pickerRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Color personalizado"
          />
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer",
              isCustom
                ? "border-cyan shadow-glow-cyan scale-110"
                : "border-elevated hover:border-text-muted hover:scale-105",
            )}
            style={{ backgroundColor: isCustom ? value : "#0A0A0F" }}
          >
            <Pipette className={cn("h-3.5 w-3.5", isCustom ? "text-white mix-blend-difference" : "text-text-muted")} />
          </div>
        </div>
      </div>
    </div>
  );
}
