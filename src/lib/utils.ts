import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classnames condicionales con merge de utilidades Tailwind. Uso libre para cualquier agente. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
