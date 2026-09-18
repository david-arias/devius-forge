# Eleuthia — Identidad & Autorización

Dominio exclusivo de Eleuthia. Para este portafolio público, su alcance inicial es acotado:

- Autenticación del panel de administración — **implementado en la Iteración 14** ("La Forja Oculta") vía Supabase Auth (email/password) + `@supabase/ssr`. Ver `src/lib/supabase/server.ts` (cliente SSR con cookies), `src/proxy.ts` (antes `middleware.ts` — Next.js 16 renombró la convención; refresca la sesión y redirige a `/admin/login` sin sesión) y `src/app/admin/login/page.tsx`.
- Protección de rutas privadas (`/admin`) — dos capas: `src/proxy.ts` (perimetral) + `src/app/admin/(protected)/layout.tsx` (server-side, defense in depth).
- Manejo seguro de cookies/tokens de sesión — delegado íntegramente a `@supabase/ssr`, sin código propio de parsing de cookies.

Pendiente (ver `handoff.md` → Iteración 14): crear el usuario admin real en el dashboard de Supabase Auth (o vía SQL) — sin eso, `/admin/login` no tiene con qué autenticar todavía.
