import type { ReactNode } from "react";

type Variant = "accent" | "neutral" | "muted";

const variantClass: Record<Variant, string> = {
  accent: "bg-accent-soft text-accent",
  neutral: "bg-background text-foreground-2",
  muted: "bg-line text-muted",
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  withDot?: boolean;
  className?: string;
};

export function Badge({
  children,
  variant = "neutral",
  withDot = false,
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${variantClass[variant]} ${className}`}
    >
      {withDot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
