"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguageStore } from "@/lib/minerva/language-store";
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from "@/lib/i18n/constants";

/**
 * LanguageSync — Minerva, Iteración 31. Sin salida visual (mismo rol que
 * `PrintModeSync.tsx`, montado una sola vez en `SiteChrome`). Su trabajo:
 * mantener la cookie `devius-locale` (que SÍ pueden leer los Server
 * Components, vía `getLocale()`) sincronizada con `useLanguageStore`
 * (localStorage, sólo cliente).
 *
 * Transición fluida (pedido de Hefesto): al cambiar el idioma NO se hace
 * una navegación completa (`location.reload()`) — se escribe la cookie y
 * se llama a `router.refresh()`, que vuelve a pedir sólo los Server
 * Components de la ruta actual (sin perder el estado de cliente: scroll,
 * paneles abiertos, audio, etc.) y trae el contenido ya en el idioma
 * nuevo. `useRef` evita disparar un `refresh()` en el montaje inicial
 * (cuando `locale` sólo se está hidratando desde `localStorage`, no
 * cambió por una acción real del usuario) — sólo refresca en cambios
 * posteriores, y sólo si la cookie actual no coincide ya (primera visita
 * con `localStorage` más nuevo que la cookie, u otra pestaña que cambió
 * el idioma).
 */
export function LanguageSync() {
  const locale = useLanguageStore((state) => state.locale);
  const router = useRouter();
  const isFirstRun = useRef(true);

  useEffect(() => {
    function readCookieLocale(): string | undefined {
      return document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${LOCALE_COOKIE_NAME}=`))
        ?.split("=")[1];
    }

    const cookieLocale = readCookieLocale();
    if (cookieLocale === locale) {
      isFirstRun.current = false;
      return;
    }

    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;

    // En el montaje inicial (primera hidratación del store desde
    // localStorage) alcanza con dejar la cookie escrita para la PRÓXIMA
    // navegación — la página actual ya se sirvió con el idioma anterior,
    // así que un `refresh()` acá causaría un parpadeo de contenido justo
    // al entrar. Sólo se refresca cuando el cambio pasa DESPUÉS del
    // primer render (el usuario tocó el toggle).
    if (!isFirstRun.current) {
      router.refresh();
    }
    isFirstRun.current = false;
  }, [locale, router]);

  return null;
}
