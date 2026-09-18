import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "cta";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-emerald-glow text-obsidian shadow-[0_0_0_1px_rgba(52,211,153,0.4)] hover:bg-emerald-glow/90 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.55),0_0_24px_-4px_rgba(52,211,153,0.55)]",
  secondary:
    "border border-gold-deep bg-transparent text-gold-glow hover:bg-gold-glow/10 hover:border-gold-glow/70 hover:shadow-[0_0_18px_-6px_rgba(232,196,104,0.5)]",
  ghost: "bg-transparent text-parchment hover:bg-carbon-elevated",
  /** CTA épico — gradiente esmeralda→dorado, para el único llamado a la acción de la página (Hero/Navbar/Footer). */
  cta: "bg-gradient-to-r from-emerald-glow to-gold-glow font-semibold text-obsidian shadow-[0_0_0_1px_rgba(255,255,255,0.18)] hover:brightness-110 hover:shadow-[0_0_32px_-6px_rgba(52,211,153,0.55),0_0_32px_-6px_rgba(232,196,104,0.45)]",
};

/**
 * Button — átomo del sistema de diseño (Hefesto). Ver MASTER.md.
 * Siempre visible el focus ring (heredado de :focus-visible global).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
