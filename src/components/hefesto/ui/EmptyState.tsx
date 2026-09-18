import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * EmptyState — Hefesto, Iteración 19 ("Data Real"). Lo que ve el
 * visitante cuando una tabla de Supabase todavía está vacía: en vez de
 * contenido inventado, una "forja apagada" sobria y en tono con el sitio.
 * Server-safe (sin hooks) — usable desde cualquier sección.
 */
export function EmptyState({ icon: Icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-glow/10 blur-3xl"
      />
      <span className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-obsidian-soft text-gold-glow/80">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="relative font-display text-lg text-parchment">{title}</p>
      {description && (
        <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-parchment-muted">{description}</p>
      )}
      {children}
    </div>
  );
}
