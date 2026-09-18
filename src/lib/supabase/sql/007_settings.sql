-- ============================================================================
-- Devius Portfolio — Iteración 22 ("Ajustes Globales")
-- Tabla singleton con los enlaces de contacto que consumen Navbar, Footer,
-- Hero (CTA "Iniciar Quest") y el JSON-LD del layout.
-- Idempotente: pegar en el SQL Editor de Supabase y correr una vez.
-- Refleja src/lib/demeter/schemas/settings.ts (GlobalSettingsSchema).
-- Requiere `public.set_updated_at()` (definida en 001_init.sql).
-- ============================================================================

create table if not exists public.global_settings (
  -- Singleton: la PK sólo admite 'default' → imposible crear una 2ª fila.
  id            text primary key default 'default' check (id = 'default'),
  email         text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  github_url    text check (github_url is null or github_url ~* '^https://'),
  linkedin_url  text check (linkedin_url is null or linkedin_url ~* '^https://'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.global_settings is
  'Ajustes globales del sitio (fila única id = ''default''). Lectura pública, escritura sólo autenticados.';

drop trigger if exists global_settings_set_updated_at on public.global_settings;
create trigger global_settings_set_updated_at
  before update on public.global_settings
  for each row
  execute function public.set_updated_at();

alter table public.global_settings enable row level security;

revoke all on public.global_settings from anon, authenticated;
grant select on public.global_settings to anon, authenticated;
grant insert, update on public.global_settings to authenticated;

drop policy if exists "global_settings_select_public" on public.global_settings;
create policy "global_settings_select_public"
  on public.global_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "global_settings_insert_authenticated" on public.global_settings;
create policy "global_settings_insert_authenticated"
  on public.global_settings
  for insert
  to authenticated
  with check (id = 'default');

drop policy if exists "global_settings_update_authenticated" on public.global_settings;
create policy "global_settings_update_authenticated"
  on public.global_settings
  for update
  to authenticated
  using (id = 'default')
  with check (id = 'default');

-- Fila inicial vacía (se completa desde /admin/settings). No pisa datos existentes.
insert into public.global_settings (id) values ('default')
on conflict (id) do nothing;
