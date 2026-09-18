"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

interface ColorSwatchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Valor actual del campo — se pasa explícito (además de lo que registre `react-hook-form`) para que el swatch se actualice en cada tecleo vía `watch()`. */
  value?: string;
}

/**
 * ColorSwatchInput — Hefesto, Iteración 15 (auditoría 2026-09-15,
 * Hallazgo de Medio Impacto: "accentColor/Gradiente se editan a
 * ciegas... agregar un swatch de preview junto a cada campo"). El campo
 * sigue siendo un `<input>` de texto plano (no `type="color"`: eso
 * fuerza al usuario a usar el color picker nativo del navegador en vez
 * de poder pegar/tipear un hex conocido) — el círculo de al lado es
 * puramente decorativo/informativo, `aria-hidden`.
 *
 * Mientras el hex tecleado todavía es inválido (a mitad de escribir, o
 * un typo) el swatch cae a un patrón a cuadros en vez de crashear o
 * mostrar un color arbitrario — misma idea que un canal alfa "vacío" en
 * un editor de imágenes.
 */
export const ColorSwatchInput = forwardRef<HTMLInputElement, ColorSwatchInputProps>(
  ({ className, value, ...props }, ref) => {
    const isValidHex = typeof value === "string" && HEX_RE.test(value.trim());

    return (
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={cn(
            "h-8 w-8 shrink-0 rounded-full border border-white/20 bg-[length:8px_8px]",
            !isValidHex &&
              "bg-[repeating-conic-gradient(#3a3a3a_0deg_90deg,#1f1f1f_90deg_180deg)]"
          )}
          style={isValidHex ? { backgroundColor: value } : undefined}
        />
        <input
          ref={ref}
          value={value}
          className={cn(
            "w-full rounded-md border border-white/10 bg-obsidian/60 px-3 py-2 text-sm text-parchment focus-visible:border-gold-glow/50",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
ColorSwatchInput.displayName = "ColorSwatchInput";
