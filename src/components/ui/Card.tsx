import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-elevated bg-surface p-6",
        hover && "transition-all duration-200 hover:border-cyan/30 hover:shadow-glow-cyan",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
