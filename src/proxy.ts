import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { readSupabaseEnv } from "@/lib/supabase/env";

/**
 * Proxy de borde — Eleuthia, Iteración 14 → blindado en la Iteración 23.
 *
 * ⚠️ Next.js 16 renombró la convención `middleware.ts` → `proxy.ts`
 * (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).
 * Este archivo ES el middleware del proyecto: no crear también un
 * `src/middleware.ts` (deprecado; dos archivos de borde compiten).
 *
 * Responsabilidades (patrón oficial de Supabase SSR para App Router):
 *  1. Refrescar el token de sesión (`auth.getUser()`) y reescribir las
 *     cookies en la respuesta — tanto en `next()` como en los redirects.
 *  2. Perímetro de `/admin/*`: sin sesión → `/admin/login?next=<ruta>`.
 *     Con sesión en `/admin/login` → `/admin` (no mostrar el login de nuevo).
 *  3. Endurecer respuestas del panel: `Cache-Control: private, no-store`
 *     (nunca cachear HTML con datos privados en un CDN) y
 *     `X-Robots-Tag: noindex, nofollow`.
 *
 * Caché de rutas públicas: el `matcher` SÓLO incluye `/admin/:path*`. El
 * proxy no se ejecuta en `/`, `/quests/*`, `sitemap.xml`, etc., así que
 * esas rutas siguen siendo estáticas/ISR (ninguna lee cookies ni recibe
 * `Set-Cookie`). El sitio público no usa sesión, por lo que no necesita
 * refresco de token.
 *
 * Defensa en profundidad: `src/app/admin/(protected)/layout.tsx` y cada
 * Server Action (`requireAdminSession`) vuelven a verificar la sesión.
 *
 * Supabase sin configurar: en vez de dejar pasar (como antes), el panel
 * queda cerrado — sólo `/admin/login` es alcanzable. El sitio público no
 * se ve afectado porque no pasa por acá.
 */

const LOGIN_PATH = "/admin/login";

function hardenAdminResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

/** Redirect que conserva las cookies de sesión que Supabase haya refrescado en `source`. */
function redirectWithCookies(url: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return hardenAdminResponse(redirect);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === LOGIN_PATH;

  const { url, anonKey } = readSupabaseEnv();

  if (!url || !anonKey) {
    if (isLoginRoute) return hardenAdminResponse(NextResponse.next({ request }));
    return hardenAdminResponse(NextResponse.redirect(new URL(LOGIN_PATH, request.url)));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Patrón oficial: actualizar la request (para lo que renderice después)
        // y recrear la respuesta con esa request antes de escribir las cookies.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // NO mover ni borrar: `getUser()` (no `getSession()`) valida el JWT contra
  // Supabase Auth y dispara el refresh del token. Nada de lógica entre
  // `createServerClient` y esta llamada.
  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    // Supabase Auth inalcanzable: tratar como anónimo (fail-closed).
    user = null;
  }

  if (!user && !isLoginRoute) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(loginUrl, response);
  }

  if (user && isLoginRoute) {
    return redirectWithCookies(new URL("/admin", request.url), response);
  }

  return hardenAdminResponse(response);
}

export const config = {
  // Sólo el panel. Las rutas públicas quedan fuera a propósito (caché estático intacto).
  matcher: ["/admin/:path*"],
};
