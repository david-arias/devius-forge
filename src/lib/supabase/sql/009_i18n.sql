-- ────────────────────────────────────────────────────────────────────────
-- 009_i18n.sql — Deméter, Iteración 31 ("Expansión Global")
-- ────────────────────────────────────────────────────────────────────────
-- Soporte bilingüe (Español/Inglés) sin romper la estructura de rutas
-- actual (sin prefijos /es//en/): el idioma se resuelve por cookie
-- (`devius-locale`, ver `src/lib/i18n/get-locale.ts`) y cada tabla guarda
-- el contenido en inglés en columnas "_en" HERMANAS de las columnas base
-- (español), NUNCA reemplazándolas. Todas las columnas nuevas son
-- NULLABLE y sin default: una fila sin traducir sigue funcionando exacto
-- igual que antes — el adaptador de lectura (Deméter) hace
-- `columna_en ?? columna_base` fila por fila (ver `schema.ts`,
-- `quests.ts`, `character.ts`, `skill-tree.ts`).
--
-- Nota de adaptación (Deméter): el pedido original mencionaba
-- `title_en`/`description_en`/`content_en` para `quests` como ejemplo
-- ilustrativo. La tabla real (`001_init.sql`/`004_publish_flags.sql`) no
-- tiene una columna `description` ni `content` — tiene `title`,
-- `summary`, `role` y un objeto `case_study` (JSONB) con 4 capítulos
-- (`problem`/`ux_process`/`ui_solution`/`impact`). Esta migración sigue
-- la forma REAL de la tabla: `title_en`, `summary_en`, `role_en` (planas,
-- como sus pares en español) y `case_study_en` (un único JSONB con la
-- misma forma que `case_study`, para no crear 4 columnas sueltas que se
-- puedan desincronizar entre sí).
--
-- Nota de alcance (Deméter): `inventory.name` (p.ej. "React", "Figma",
-- "PostgreSQL") son nombres propios de tecnologías/herramientas — no se
-- traducen entre idiomas, así que esta migración NO le agrega columna
-- `_en`. Si en el futuro se necesitara localizar la descripción larga de
-- un ítem de inventario, se agregaría entonces (hoy `InventoryItemSchema`
-- no tiene un campo de descripción libre, sólo `name`/`category`/`rarity`/`level`).

-- ── quests ────────────────────────────────────────────────────────────
alter table public.quests
  add column if not exists title_en text,
  add column if not exists summary_en text,
  add column if not exists role_en text,
  add column if not exists case_study_en jsonb;

comment on column public.quests.title_en is 'Título en inglés (i18n, Iteración 31). NULL = usar title (fallback ES).';
comment on column public.quests.summary_en is 'Resumen en inglés (i18n, Iteración 31). NULL = usar summary (fallback ES).';
comment on column public.quests.role_en is 'Rol en inglés (i18n, Iteración 31). NULL = usar role (fallback ES).';
comment on column public.quests.case_study_en is 'Caso de estudio en inglés (i18n, Iteración 31) — misma forma que case_study (problem/ux_process/ui_solution/impact). Claves ausentes o NULL = usar el capítulo en español (fallback por capítulo, no todo-o-nada).';

-- ── character_sheet ───────────────────────────────────────────────────
alter table public.character_sheet
  add column if not exists character_class_en text,
  add column if not exists tagline_en text,
  add column if not exists bio_en text[];

comment on column public.character_sheet.character_class_en is 'Clase de personaje en inglés (i18n, Iteración 31). NULL = usar character_class (fallback ES).';
comment on column public.character_sheet.tagline_en is 'Tagline en inglés (i18n, Iteración 31). NULL = usar tagline (fallback ES).';
comment on column public.character_sheet.bio_en is 'Bio (array de párrafos) en inglés (i18n, Iteración 31). NULL = usar bio (fallback ES).';

-- ── skill_tree ────────────────────────────────────────────────────────
alter table public.skill_tree
  add column if not exists label_en text,
  add column if not exists description_en text,
  add column if not exists achievements_en text[];

comment on column public.skill_tree.label_en is 'Label en inglés (i18n, Iteración 31). NULL = usar label (fallback ES).';
comment on column public.skill_tree.description_en is 'Descripción en inglés (i18n, Iteración 31). NULL = usar description (fallback ES).';
comment on column public.skill_tree.achievements_en is 'Logros en inglés (i18n, Iteración 31). NULL = usar achievements (fallback ES).';

-- No hace falta tocar RLS: las policies existentes de 001_init.sql/002_admin_tables.sql
-- ya cubren la tabla completa (lectura pública / escritura sólo authenticated),
-- así que las columnas nuevas heredan la misma protección sin cambios.
