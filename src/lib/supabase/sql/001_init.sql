-- ============================================================================
-- Devius Portfolio — inicialización de Supabase (Deméter, Iteración 13)
-- ============================================================================
-- Pegar este archivo completo en el SQL Editor de supabase.com (proyecto
-- nuevo → SQL Editor → New query) y darle "Run" una sola vez. Es idempotente
-- donde tiene sentido serlo (create ... if not exists / on conflict), así
-- que correrlo dos veces no rompe nada.
--
-- Refleja 1:1 el shape de `QuestSchema` (src/lib/demeter/schemas/quest.ts) y
-- de `SupabaseQuestRowSchema` (src/lib/supabase/schema.ts) — si alguno de
-- los dos cambia, este archivo tiene que actualizarse junto con ellos.
-- No hay columna `slug` separada: `id` YA es el slug (se reutiliza tal cual
-- como param de ruta en /quests/[slug], igual que en el array estático
-- actual de src/lib/demeter/queries/quests.ts).
-- ============================================================================


-- ── 1. Tabla `quests` ────────────────────────────────────────────────────

create table if not exists public.quests (
  id                 text primary key,             -- slug, p.ej. "oraculum-dashboard-saas"
  title              text not null,
  summary            text not null,                 -- "descripción" corta de la tarjeta
  role               text not null,
  tech               text[] not null default '{}',
  href               text,                           -- link "Ver en vivo", opcional
  status             text not null default 'completed'
                       check (status in ('completed', 'in-progress')),
  accent_color       text not null,                  -- hex, p.ej. "#34d399"
  image_placeholder  jsonb not null,                 -- { "from": "#...", "to": "#..." }
  media              jsonb,                          -- QuestMedia | null — evidencia real (Iteración 9)
  testimonial        jsonb,                          -- { quote, author, role } | null
  case_study         jsonb not null,                 -- { problem, ux_process, ui_solution, impact, chapter_media? }
  sort_order         integer not null default 0,     -- orden de aparición en el Home
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.quests is
  'Proyectos del portafolio (Quests). Ver src/lib/demeter/schemas/quest.ts para el shape completo en TypeScript/Zod.';

-- `updated_at` se actualiza solo en cada UPDATE — nunca hay que setearlo a mano.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quests_set_updated_at on public.quests;
create trigger quests_set_updated_at
  before update on public.quests
  for each row
  execute function public.set_updated_at();


-- ── 2. Row Level Security ────────────────────────────────────────────────
-- El portafolio es 100% público: cualquiera puede LEER las Quests sin estar
-- autenticado. Sólo un usuario autenticado (vos, desde un futuro panel de
-- edición — dominio Eleuthia) puede escribir.

alter table public.quests enable row level security;

drop policy if exists "quests: lectura pública" on public.quests;
create policy "quests: lectura pública"
  on public.quests
  for select
  using (true);

drop policy if exists "quests: sólo autenticado puede escribir" on public.quests;
create policy "quests: sólo autenticado puede escribir"
  on public.quests
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "quests: sólo autenticado puede actualizar" on public.quests;
create policy "quests: sólo autenticado puede actualizar"
  on public.quests
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "quests: sólo autenticado puede borrar" on public.quests;
create policy "quests: sólo autenticado puede borrar"
  on public.quests
  for delete
  using (auth.role() = 'authenticated');


-- ── 3. Storage — bucket `quest-images` ───────────────────────────────────
-- Alternativa a correr esto por SQL: Dashboard → Storage → "New bucket" →
-- nombre "quest-images" → marcar "Public bucket". El SQL de abajo hace
-- exactamente eso, para no tener que ir al dashboard.

insert into storage.buckets (id, name, public)
values ('quest-images', 'quest-images', true)
on conflict (id) do nothing;

drop policy if exists "quest-images: lectura pública" on storage.objects;
create policy "quest-images: lectura pública"
  on storage.objects
  for select
  using (bucket_id = 'quest-images');

drop policy if exists "quest-images: sólo autenticado puede subir" on storage.objects;
create policy "quest-images: sólo autenticado puede subir"
  on storage.objects
  for insert
  with check (bucket_id = 'quest-images' and auth.role() = 'authenticated');

drop policy if exists "quest-images: sólo autenticado puede borrar" on storage.objects;
create policy "quest-images: sólo autenticado puede borrar"
  on storage.objects
  for delete
  using (bucket_id = 'quest-images' and auth.role() = 'authenticated');

-- Convención de paths dentro del bucket (no improvisar nombres al subir
-- desde el dashboard — el código espera exactamente esta forma de URL):
--   quest-images/<quest-id>/cover.jpg               → alimenta `media`
--   quest-images/<quest-id>/chapters/problem.jpg     → alimenta `case_study.chapter_media.problem`
--   quest-images/<quest-id>/chapters/ux-process.jpg  → alimenta `case_study.chapter_media.ux_process`
--   quest-images/<quest-id>/chapters/ui-solution.jpg → alimenta `case_study.chapter_media.ui_solution`
--   quest-images/<quest-id>/chapters/impact.jpg      → alimenta `case_study.chapter_media.impact`


-- ── 4. (Opcional) migrar las 2 Quests actuales ───────────────────────────
-- Datos reales ya escritos en src/lib/demeter/queries/quests.ts — pegarlos
-- acá como INSERT es el paso manual que falta para que la tabla no arranque
-- vacía. Se deja comentado a propósito: correlo sólo cuando quieras migrar
-- de verdad (mientras tanto, el sitio sigue sirviendo el array estático,
-- así que no hay apuro ni riesgo en dejarlo para después).

-- insert into public.quests (id, title, summary, role, tech, status, accent_color, image_placeholder, case_study, sort_order)
-- values (
--   'oraculum-dashboard-saas',
--   'Oraculum — Dashboard SaaS de Analítica',
--   '...',
--   'UX Lead & Frontend Engineer',
--   array['Next.js','TypeScript','Tailwind CSS','Framer Motion','Zustand'],
--   'completed',
--   '#34d399',
--   '{"from": "#0a0a0f", "to": "#0f6b4f"}'::jsonb,
--   '{"problem": "...", "ux_process": "...", "ui_solution": "...", "impact": "..."}'::jsonb,
--   0
-- );
