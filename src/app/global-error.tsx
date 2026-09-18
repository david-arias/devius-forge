"use client";

import { useEffect } from "react";
import { ForgeStatusScreen } from "@/components/hefesto/ui";
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}

/**
 * Último recurso — Hades, Iteración 23. Sólo se activa si falla el ROOT
 * layout (p. ej. `getNavigationForView()`), por eso reemplaza el documento
 * completo: define su propio `<html>/<body>`, importa `globals.css` y no
 * depende de Navbar/Footer, fuentes de `next/font` ni de Supabase.
 */
export default function GlobalError({ error, retry, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Hades] Error capturado por app/global-error.tsx", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col bg-obsidian font-serif text-parchment antialiased">
        <title>La Forja se apagó · Devius</title>
        <div aria-hidden className="forge-atmosphere" />
        <ForgeStatusScreen
          code="500"
          eyebrow="Interferencia mágica detectada"
          title="La Forja entera se ha apagado"
          description="Un error inesperado detuvo todo el taller. Reintentá en un momento; si persiste, ya estamos avivando las brasas."
          footnote={error.digest ? <p>Código de runa: {error.digest}</p> : null}
        >
          <button
            type="button"
            onClick={() => (retry ?? reset)?.()}
            className="rounded-md bg-gradient-to-r from-emerald-glow to-gold-glow px-6 py-3 text-sm font-semibold text-obsidian"
          >
            Intentar de nuevo
          </button>
          {/* <a> plano (no <Link>): el router de la app puede estar roto — recarga completa. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- navegación dura intencional */}
          <a href="/" className="rounded-md border border-white/15 px-6 py-3 text-sm text-parchment">
            Volver al inicio
          </a>
        </ForgeStatusScreen>
      </body>
    </html>
  );
}
