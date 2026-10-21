-- Authorized series catalogue: parent movie rows remain the public series records.
create table if not exists public.series_seasons (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.movies(id) on delete cascade,
  season_number integer not null check (season_number > 0 and season_number <= 100),
  title text not null default '' check (char_length(title) <= 160),
  created_at timestamptz not null default now(),
  unique(series_id, season_number)
);
create table if not exists public.series_episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.series_seasons(id) on delete cascade,
  episode_number integer not null check (episode_number > 0 and episode_number <= 1000),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  duration_minutes integer check (duration_minutes between 1 and 1000),
  language text not null default 'Not specified' check (char_length(language) <= 60),
  source_type text not null check (source_type in ('youtube','google_drive','direct')),
  source_url text not null check (char_length(source_url) <= 2048),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(season_id, episode_number)
);
create index if not exists series_seasons_order_idx on public.series_seasons(series_id, season_number);
create index if not exists series_episodes_order_idx on public.series_episodes(season_id, episode_number);
alter table public.series_seasons enable row level security;
alter table public.series_episodes enable row level security;
revoke all on public.series_seasons, public.series_episodes from anon, authenticated;
grant select on public.series_seasons, public.series_episodes to anon, authenticated;
grant insert, update, delete on public.series_seasons, public.series_episodes to authenticated;
create policy "View seasons of published series" on public.series_seasons for select to anon, authenticated
using (exists (select 1 from public.movies m where m.id=series_id and m.published and m.category='Web Series'));
create policy "Admins manage seasons" on public.series_seasons for all to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'))
with check (exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "View published episodes of published series" on public.series_episodes for select to anon, authenticated
using (published and exists (select 1 from public.series_seasons s join public.movies m on m.id=s.series_id where s.id=season_id and m.published and m.category='Web Series'));
create policy "Admins manage episodes" on public.series_episodes for all to authenticated
using (exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'))
with check (exists (select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
