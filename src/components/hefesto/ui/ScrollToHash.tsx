"use client";

import { useEffect } from "react";

/**
 * ScrollToHash — Minerva (Iteración 12, fix del botón "Volver a Quests").
 *
 * El bug real: `<Link href="/#quests">` en `/quests/[slug]` navega bien
 * (cambia de ruta, la URL termina en `/#quests`), pero Next.js App Router
 * hace la navegación como soft-navigation client-side — no un load de
 * página completo — así que el scroll-to-anchor NATIVO del navegador
 * (el que el HTML te da gratis con un `<a href="#id">` normal) nunca se
 * dispara: ese mecanismo depende de un parseo de documento nuevo, que acá
 * no ocurre. El resultado observado es "el link no hace scroll" o hace un
 * scroll inconsistente según qué tan rápido termine de pintar la home.
 *
 * Fix: se monta UNA vez en `page.tsx` (Home) y, en su primer efecto, lee
 * `window.location.hash` a mano y hace el scroll manualmente con
 * `scrollIntoView`. Como la Home es completamente estática (SSG, ver
 * `generateStaticParams` en Iteración 8) el elemento con ese id ya existe
 * en el DOM para cuando este efecto corre — no hace falta poll/retry.
 *
 * No interfiere con la navegación por ancla DENTRO de la misma página
 * (Navbar → `#quests` estando ya en `/`): ese caso es same-page, lo sigue
 * resolviendo el navegador de forma nativa + `scroll-smooth` en `<html>`
 * (`globals.css`) — este componente sólo cubre el caso cross-route.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;

    const target = document.getElementById(id);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  return null;
}
