import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-elevated/70 bg-surface p-6 shadow-xl shadow-void/30",
        hover && "transition-all duration-300 hover:border-cyan/20 hover:shadow-[0_0_40px_rgba(0,240,255,0.07)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
