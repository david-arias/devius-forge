-- ============================================================================
-- Devius Portfolio — tablas del panel admin (Deméter, Iteración 14 —
-- "La Forja Oculta")
-- ============================================================================
-- Sigue exactamente las mismas convenciones que `001_init.sql`: pegar en el
-- SQL Editor de supabase.com y correr una sola vez (idempotente vía
-- `create table if not exists` + `drop policy/trigger if exists`). La
-- función `set_updated_at()` YA existe desde `001_init.sql` — acá sólo se
-- le agrega un trigger nuevo por tabla, no se recrea la función.
--
-- Cada tabla refleja 1:1 el schema Zod de Deméter correspondiente:
--   character_sheet → src/lib/demeter/schemas/character.ts (CharacterSchema)
--   skill_tree      → src/lib/demeter/schemas/skill-node.ts (SkillNodeSchema)
--   inventory       → src/lib/demeter/schemas/inventory-item.ts (InventoryItemSchema)
-- Si alguno de esos tres archivos cambia de forma, esta tabla tiene que
-- actualizarse junto con él (mismo pacto que `001_init.sql` con `quest.ts`).
-- ============================================================================


-- ── 1. Tabla `character_sheet` (singleton — una sola fila) ──────────────
-- `Character` no es una colección, es LA ficha del portafolio. Se modela
-- como tabla de una sola fila (`id` fijo en 'default') en vez de una tabla
-- sin PK real, para poder reusar el mismo patrón de RLS/trigger que el
-- resto sin casos especiales.

create table if not exists public.character_sheet (
  id                 text primary key default 'default',
  name               text not null,
  character_class    text not null,
  tagline            text not null,               -- exclusivo del Hero (ver character.ts)
  bio                text[] not null default '{}', -- párrafos del Character Sheet, en orden
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.character_sheet is
  'Ficha de personaje ("Acerca de mí"). Fila única (id = ''default''). Ver src/lib/demeter/schemas/character.ts.';

drop trigger if exists character_sheet_set_updated_at on public.character_sheet;
create trigger character_sheet_set_updated_at
  before update on public.character_sheet
  for each row
  execute function public.set_updated_at();


-- ── 2. Tabla `skill_tree` ─────────────────────────────────────────────────

create table if not exists public.skill_tree (
  id                 text primary key,             -- p.ej. "lead-ux-ui-engineer"
  label              text not null,
  period             text,                          -- opcional, p.ej. "2023 — presente"
  description        text not null,
  achievements       text[] not null default '{}',  -- "XP obtenida" — bitácora de logros
  unlocked           boolean not null default true,
  sort_order         integer not null default 0,    -- orden de aparición en la timeline
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.skill_tree is
  'Nodos del Skill Tree (experiencia laboral). Ver src/lib/demeter/schemas/skill-node.ts.';

drop trigger if exists skill_tree_set_updated_at on public.skill_tree;
create trigger skill_tree_set_updated_at
  before update on public.skill_tree
  for each row
  execute function public.set_updated_at();


-- ── 3. Tabla `inventory` ──────────────────────────────────────────────────

create table if not exists public.inventory (
  id                 text primary key,             -- p.ej. "react"
  name               text not null,
  category           text not null
                       check (category in ('frontend', 'backend', 'design', 'devops', 'tools', 'animation')),
  rarity             text not null default 'common'
                       check (rarity in ('common', 'rare', 'legendary')),
  level              integer not null default 0
                       check (level >= 0 and level <= 100), -- alimenta LevelRing
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.inventory is
  'Tecnologías del stack (Inventario). Ver src/lib/demeter/schemas/inventory-item.ts.';

drop trigger if exists inventory_set_updated_at on public.inventory;
create trigger inventory_set_updated_at
  before update on public.inventory
  for each row
  execute function public.set_updated_at();


-- ── 4. Row Level Security — mismo patrón que `quests` en 001_init.sql ────
-- Lectura pública (el portafolio es 100% público), escritura sólo para un
-- usuario autenticado (vos, desde /admin — dominio Eleuthia/Éter,
-- Iteración 14). Una policy por operación, no `for all` genérico.

alter table public.character_sheet enable row level security;

drop policy if exists "character_sheet: lectura pública" on public.character_sheet;
create policy "character_sheet: lectura pública"
  on public.character_sheet
  for select
  using (true);

drop policy if exists "character_sheet: sólo autenticado puede escribir" on public.character_sheet;
create policy "character_sheet: sólo autenticado puede escribir"
  on public.character_sheet
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "character_sheet: sólo autenticado puede actualizar" on public.character_sheet;
create policy "character_sheet: sólo autenticado puede actualizar"
  on public.character_sheet
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "character_sheet: sólo autenticado puede borrar" on public.character_sheet;
create policy "character_sheet: sólo autenticado puede borrar"
  on public.character_sheet
  for delete
  using (auth.role() = 'authenticated');


alter table public.skill_tree enable row level security;

drop policy if exists "skill_tree: lectura pública" on public.skill_tree;
create policy "skill_tree: lectura pública"
  on public.skill_tree
  for select
  using (true);

drop policy if exists "skill_tree: sólo autenticado puede escribir" on public.skill_tree;
create policy "skill_tree: sólo autenticado puede escribir"
  on public.skill_tree
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "skill_tree: sólo autenticado puede actualizar" on public.skill_tree;
create policy "skill_tree: sólo autenticado puede actualizar"
  on public.skill_tree
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "skill_tree: sólo autenticado puede borrar" on public.skill_tree;
create policy "skill_tree: sólo autenticado puede borrar"
  on public.skill_tree
  for delete
  using (auth.role() = 'authenticated');


alter table public.inventory enable row level security;

drop policy if exists "inventory: lectura pública" on public.inventory;
create policy "inventory: lectura pública"
  on public.inventory
  for select
  using (true);

drop policy if exists "inventory: sólo autenticado puede escribir" on public.inventory;
create policy "inventory: sólo autenticado puede escribir"
  on public.inventory
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "inventory: sólo autenticado puede actualizar" on public.inventory;
create policy "inventory: sólo autenticado puede actualizar"
  on public.inventory
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "inventory: sólo autenticado puede borrar" on public.inventory;
create policy "inventory: sólo autenticado puede borrar"
  on public.inventory
  for delete
  using (auth.role() = 'authenticated');
