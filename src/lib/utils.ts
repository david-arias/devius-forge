import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classnames condicionales con merge de utilidades Tailwind. Uso libre para cualquier agente. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * `slugify()` — Iteración 34 ("Debugging y Expansión de Media", Apolo).
 * El campo `id` de una Quest ES el slug (`/quests/[slug]`, ver
 * `QuestFormSchema`) — antes era texto libre sin normalizar, así que
 * cualquier cosa que no fuera ya un slug perfecto (espacios, mayúsculas,
 * acentos, o peor, una `/` que Next.js interpreta como separador de ruta)
 * producía una URL que nunca iba a matchear `[slug]` y terminaba en 404.
 * Se usa en `QuestForm.tsx` para normalizar el campo `id` en vivo
 * (`onChange`) — lo que el editor tipea siempre se convierte en un slug
 * válido antes de llegar a Supabase.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos/diacríticos (á→a, ñ→n vía NFD no cubre ñ del todo, pero cubre la mayoría)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // cualquier cosa que no sea a-z0-9 (espacios, /, ?, acentos residuales) → "-"
    .replace(/^-+|-+$/g, ""); // sin guiones colgando en los extremos
}
