"use client";

import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewLinkProps {
  /** Ruta pública relativa a previsualizar, ej. `/quests/oraculum-dashboard-saas` o `/#inventario`. */
  slug: string;
  className?: string;
}

/**
 * PreviewLink — HEFESTO, Iteración 18 ("El Puente Bifröst").
 *
 * Botón "Ver Preview" para los formularios del CMS (`QuestForm`,
 * `InventoryForm`, `SkillsForm`, `CharacterForm`) — abre el sitio público
 * en una pestaña nueva con el Draft Mode activado, apuntando directo al
 * `slug` de la entidad que se está editando. Safe para el barrel de
 * `ui/index.ts` (nada de `next/headers` acá, a diferencia de
 * `PreviewBanner.tsx`).
 *
 * Es un `<form method="get" action="/api/draft" target="_blank">`, NO un
 * `<a>`/`<Link>`: la guía oficial de Draft Mode de Next.js pide evitar
 * `<Link>` para este flujo (lo prefetchea, activando el Draft Mode sin
 * click real) — un `<form>` nunca se prefetchea, sea cual sea su método.
 * `target="_blank"` abre la pestaña nueva mientras el formulario del CMS
 * (con cambios sin guardar) sigue intacto en la pestaña original.
 *
 * `NEXT_PUBLIC_DRAFT_MODE_SECRET` es opcional — sólo se manda si está
 * definido en build time; ver `DRAFT_MODE_SECRET` (server-only) en
 * `app/api/draft/route.ts` y la guía de despliegue de Poseidón.
 */
export function PreviewLink({ slug, className }: PreviewLinkProps) {
  const publicSecret = process.env.NEXT_PUBLIC_DRAFT_MODE_SECRET;

  return (
    <form
      action="/api/draft"
      method="get"
      target="_blank"
      className={cn("inline-flex", className)}
    >
      <input type="hidden" name="slug" value={slug} />
      {publicSecret && <input type="hidden" name="secret" value={publicSecret} />}
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-parchment-muted transition-colors duration-150 hover:border-neon/50 hover:text-neon"
      >
        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Ver Preview
      </button>
    </form>
  );
}
