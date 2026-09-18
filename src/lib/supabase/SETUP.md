# Conectar Supabase — 3 pasos (Apolo, Iteración 13)

1. **Pegar el SQL.** En [supabase.com](https://supabase.com), creá el proyecto (si todavía no existe). Andá a **SQL Editor → New query**, pegá el contenido completo de `src/lib/supabase/sql/001_init.sql` y tocá **Run**. Esto crea la tabla `quests`, activa RLS y crea el bucket `quest-images` con sus políticas — todo de una vez.

2. **Sacar las credenciales.** En el mismo proyecto: **Project Settings → API**. Ahí están:
   - **Project URL** → es tu `SUPABASE_URL`.
   - **anon / public key** (bajo "Project API keys") → es tu `SUPABASE_ANON_KEY`. **Nunca** copies la `service_role` key a ningún archivo del proyecto.

3. **Pegarlas en `.env.local`.** En la raíz del repo, copiá `.env.local.example` a un archivo nuevo llamado `.env.local` (este último no se sube a git) y completá las dos variables con los valores del paso 2. Reiniciá `npm run dev` para que Next.js las lea.

Con esto, el proyecto de Supabase ya existe y tiene la tabla lista — el sitio sigue sirviendo los datos estáticos de `src/lib/demeter/queries/quests.ts` hasta que alguien reemplace `fetchQuestsFromSource()` por el adaptador de `src/lib/supabase/schema.ts` (ver la Iteración 12 en `handoff.md`), así que no hay apuro ni riesgo de romper nada mientras tanto.
