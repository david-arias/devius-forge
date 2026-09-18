# DEPLOY.md — Guía de despliegue en Vercel

> Mantenido por **Poseidón** (DevOps & Despliegue). Ver `handoff.md` para el estado general del proyecto y `sistema_agentes.md` para el protocolo de agentes.

_Iteración 18 ("El Puente Bifröst", 2026-09-16) — primera versión de esta guía, escrita al conectar el frontend público a Supabase de verdad y agregar Draft Mode/Preview._

## 1. Antes de desplegar — checklist local

Correr esto en local (no en un entorno remoto con FUSE — ver la nota de `handoff.md` sección 6 sobre `EPERM`/`.fuse_hidden`, que es del punto de montaje, no del código) antes del primer deploy y después de cualquier cambio grande:

```bash
npm install
npx tsc --noEmit        # o: npm run typecheck
npx eslint src           # o: npm run lint
rm -rf .next && npm run build
```

Los tres deben terminar sin errores (warnings de `react-hooks/incompatible-library` sobre `watch()` de react-hook-form son benignos y pre-existentes — ver `handoff.md`).

## 2. `package.json` / `next.config.ts` — revisión Poseidón

- **`build`:** `next build` (Turbopack). No necesita flags extra — ya corre TypeScript y linting relevante como parte del build de Next.js 16. Se agregó un script `typecheck` (`tsc --noEmit`) separado para poder correrlo rápido en CI antes del build completo, sin duplicar trabajo si ya se corrió a mano.
- **`next.config.ts`:** sólo declara `images.remotePatterns` para `*.supabase.co` (bucket `quest-images`) — no necesita nada adicional para Vercel (sin `output: "export"`, sin config custom de servidor: el proyecto usa Server Actions, Route Handlers y Draft Mode, todos soportados nativamente por el runtime de Vercel para Next.js).
- **`src/proxy.ts`** (el middleware renombrado en Next 16) se despliega automáticamente como Edge/Node Middleware — no requiere configuración manual en Vercel.

No se encontraron cambios necesarios en ninguno de los dos archivos — el proyecto ya estaba "a prueba de balas" para un build de Vercel estándar.

## 3. Variables de entorno a configurar en Vercel

Ir a **Project Settings → Environment Variables** en el dashboard de Vercel y cargar, antes del primer deploy, las mismas que están en `.env.local` (ver `.env.local.example` en la raíz para los nombres exactos y comentarios de cada una):

| Variable | Requerida | Entornos | Notas |
|---|---|---|---|
| `SUPABASE_URL` | Sí | Production, Preview, Development | **Tipo: Secret/privada.** URL del proyecto de Supabase. Sin prefijo desde la Iteración 28. |
| `SUPABASE_ANON_KEY` | Sí | Production, Preview, Development | **Tipo: Secret/privada.** `anon key` — segura de exponer porque las tablas tienen RLS habilitado (`001_init.sql`/`002_admin_tables.sql`). **Nunca** cargar una `SUPABASE_SERVICE_ROLE_KEY` — esa key bypassea RLS y el proyecto no la necesita en ningún punto (Auth vía `@supabase/ssr` con cookies alcanza con la `anon key`). |
| `SITE_URL` | Sí | Production, Preview | **Tipo: Secret/privada.** Dominio final sin barra final (`https://devius.dev`). Alimenta `metadataBase`, canonical, Open Graph, JSON-LD, `sitemap.xml` y `robots.txt`. Server-only desde la Iteración 27. |
| `DRAFT_MODE_SECRET` | Opcional | Production, Preview | **Tipo: Secret.** Segunda llave para abrir `/api/draft?secret=…` SIN sesión de admin (previews desde el celular o para un cliente). El botón "Ver Preview" del CMS no la necesita: `/api/draft` autoriza por sesión. Generar con `openssl rand -hex 32`. |

> **Ninguna variable con prefijo `NEXT_PUBLIC_` (Iteración 28).** La UI nueva de Vercel avisa al guardar variables con ese prefijo (*"Remove the public framework prefix to keep this value private…"*). Ahora TODAS las variables del proyecto se cargan sin prefijo y como **Secret**: el servidor lee `SUPABASE_URL`/`SUPABASE_ANON_KEY` y le pasa esos dos valores al navegador en runtime (`src/components/eter/SupabaseRuntimeConfig.tsx`) en vez de que Next.js los incruste en el bundle. La `anon key` sigue llegando al navegador — es imprescindible para el login del CMS, la subida de imágenes y la telemetría, y es segura mientras las tablas tengan RLS (todas la tienen). Si preferís el camino corto y guardarlas con prefijo, elegí el tipo **Config** y funciona igual: el código acepta los dos nombres.

No hace falta ninguna variable adicional para `next/og` (`opengraph-image.tsx`), Draft Mode en sí (usa cookies, no env vars propias), ni para `src/proxy.ts`.

**Importante — dominio final (Iteración 23, renombrada en la 27):** el dominio vive en `src/lib/site.ts` y se toma de `SITE_URL` (sin barra final; se acepta `NEXT_PUBLIC_SITE_URL` como fallback heredado). Si no está definida, en Vercel se usa `VERCEL_PROJECT_PRODUCTION_URL` y, como último recurso, `https://devius.dev`. Definila en Production **antes** del primer deploy: alimenta `metadataBase`, canonical, Open Graph, JSON-LD, `sitemap.xml` y `robots.txt`.

## 4. Paso a paso del primer deploy

1. **Git:** el proyecto todavía no tiene repositorio Git inicializado (ver `handoff.md`, sección 7, punto 1). Correr primero:
   ```bash
   git init
   git add .
   git commit -m "chore: scaffold inicial del proyecto (Next.js + sistema de agentes)"
   ```
   y subirlo a GitHub/GitLab/Bitbucket (Vercel se conecta a cualquiera de los tres).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importar el repositorio recién subido. Vercel detecta Next.js automáticamente (Framework Preset: Next.js) — no hace falta tocar Build Command (`next build`) ni Output Directory, quedan en default.
3. Antes de darle a **Deploy**, cargar las variables de entorno de la sección 3 (al menos las dos de Supabase — son obligatorias, el sitio no rompe sin ellas gracias al fallback a `STATIC_*` en Deméter, pero serviría contenido desactualizado en vez de los datos reales del CMS).
4. **Deploy.** El primer build corre `next build` con Turbopack — mismo comando que se verificó en el paso 1 de esta guía.
5. Una vez desplegado, confirmar en Supabase (dashboard → Authentication → Users) que existe el usuario admin real (ver "Roto / pendiente de decisión" en `handoff.md` — todavía no existe ninguno) y que las migraciones `001_init.sql` → `004_publish_flags.sql` ya corrieron (SQL Editor de Supabase, en orden) — sin `004_publish_flags.sql`, el checkbox "Publicado" de Quests/Inventario no persiste (cae al default `true` de Zod).
6. Definir `SITE_URL` con el dominio de producción, y en Supabase → Authentication → URL Configuration agregar el dominio real de Vercel (y cualquier dominio custom) a **Site URL**/**Redirect URLs**, o el login de `/admin/login` puede fallar en Production por un origen no permitido.

## 5. Preview deployments y Draft Mode (Iteración 18)

Cada Pull Request genera un Preview Deployment propio en Vercel (URL única `*.vercel.app`), con las mismas env vars marcadas para "Preview" en la sección 3. El botón "Ver Preview" del CMS (`/admin/quests`, etc.) funciona igual en cualquier entorno — Production, Preview o local — porque `/api/draft` sólo depende de una cookie (`__prerender_bypass`), no de configuración específica de Vercel.

Nota de caché: el Draft Mode de Next.js saltea automáticamente `unstable_cache` (usado por las 4 lecturas de Deméter, ver `quests.ts` etc.) mientras la cookie esté activa — no hace falta invalidar nada a mano para ver un borrador recién guardado en el preview.

## 6. Post-deploy — pendientes que no bloquean el primer deploy

Estos ítems (copiados de `handoff.md`, sección "Roto / pendiente de decisión") no impiden desplegar, pero conviene resolverlos pronto después:

- `/cv-devius.pdf` referenciado desde el botón "Descargar CV" del Hero no existe todavía en `/public` — el botón queda roto (404) hasta subirlo.
- Los enlaces de GitHub/LinkedIn/correo en `navigation.ts` son placeholders.
- No hay tests configurados (Vitest/Playwright, carpetas creadas sin instalar) — no hay CI que corra antes de cada deploy más allá del build de Vercel en sí.

## 7. Checklist final de producción (Iteración 23)

- [ ] SQL corrido en Supabase, en orden: `001` → `002` → `004` → `005` → `006` → `007` → `008` (`003` es histórico).
- [ ] Variables en Vercel, todas como **Secret** y sin prefijo: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_URL` (+ opcional `DRAFT_MODE_SECRET`). `NEXT_PUBLIC_SFX_ENABLED`/`NEXT_PUBLIC_TELEMETRY_DEV` son flags locales: no se cargan en Vercel.
- [ ] Supabase → Authentication → URL Configuration con el dominio de Vercel.
- [ ] `/admin/settings` completado (correo, GitHub, LinkedIn) — sin eso el sitio no muestra enlaces de contacto.
- [ ] Verificar tras el deploy: `/robots.txt`, `/sitemap.xml` (sólo Quests publicadas), `/admin` redirige a `/admin/login` en incógnito, una ruta inexistente muestra el 404 de la Forja.
- [ ] Enviar `https://<dominio>/sitemap.xml` en Google Search Console.
- [ ] (Iteración 24/25) Vercel → proyecto → **Analytics** y **Speed Insights** → *Enable* (plan gratuito). Los eventos custom se guardan en Supabase (`008_telemetry.sql`) y se ven en `/admin/analytics`.
