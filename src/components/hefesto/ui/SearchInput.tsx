"use client";

import { Search } from "lucide-react";
import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

/**
 * SearchInput — Hefesto, Iteración 17 ("Escalabilidad del CMS", Fase 3
 * de la auditoría: "Vista colapsada + buscador para Inventario y Quests
 * cuando superen ~6–8 elementos"). Input controlado con ícono de lupa,
 * mismo lenguaje visual que el resto de los campos del CMS (fondo
 * obsidiana, borde sutil, glow dorado en foco) en vez de un input nativo
 * sin estilo. Filtra en el cliente — ninguna de las 3 secciones tiene
 * volumen como para justificar una búsqueda server-side todavía.
 */
export function SearchInput({ value, onChange, className, placeholder, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment-muted/70"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? "Buscar…"}
        className="w-full rounded-md border border-white/10 bg-obsidian/60 py-2 pl-9 pr-3 text-sm text-parchment placeholder:text-parchment-muted/50 focus-visible:border-gold-glow/50"
        {...props}
      />
    </div>
  );
}
