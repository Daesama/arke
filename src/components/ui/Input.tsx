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
            "w-full rounded-xl border border-elevated/80 bg-deep px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/70 transition-all duration-200 focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/15",
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
