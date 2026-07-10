"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-elevated/60 bg-deep/80 backdrop-blur-sm px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 transition-all duration-300 focus:border-cyan/50 focus:outline-none focus:ring-2 focus:ring-cyan/20 focus:shadow-[0_0_20px_rgba(0,240,255,0.08)]",
            error && "border-magenta/60 focus:border-magenta focus:ring-magenta/15",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-0.5 text-xs text-magenta">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
