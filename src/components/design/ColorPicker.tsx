"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200",
          open
            ? "border-cyan shadow-glow-cyan scale-110"
            : "border-elevated hover:border-text-muted hover:scale-105",
          "bg-surface",
        )}
        aria-label="Elegir color personalizado"
        title="Color personalizado"
      >
        <Pipette className="h-3.5 w-3.5 text-text-secondary" />
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 rounded-xl border border-elevated bg-surface p-3 shadow-xl shadow-void/50">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-md border border-elevated"
              style={{ backgroundColor: value }}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
              }}
              className="w-full rounded-md border border-elevated bg-deep px-2 py-1 font-mono text-xs text-text-primary outline-none focus:border-cyan"
              maxLength={7}
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
