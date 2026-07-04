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
          <label htmlFor={id} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-elevated bg-deep px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/30",
            error && "border-magenta focus:border-magenta focus:ring-magenta/30",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-magenta">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
