import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "gradient-border gradient-border-subtle rounded-2xl bg-surface/40 backdrop-blur-xl p-6 shadow-xl shadow-void/40",
        hover &&
          "transition-all duration-300 hover:scale-[1.02] hover:bg-surface/50 hover:shadow-[0_0_50px_rgba(0,240,255,0.08)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
