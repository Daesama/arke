import { cn } from "@/lib/utils/cn";

type BadgeVariant = "cyan" | "violet" | "magenta" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  cyan: "bg-cyan/10 text-cyan border-cyan/20",
  violet: "bg-violet/10 text-violet border-violet/20",
  magenta: "bg-magenta/10 text-magenta border-magenta/20",
  muted: "bg-elevated text-text-muted border-elevated",
};

export function Badge({ children, variant = "cyan", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wider",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
