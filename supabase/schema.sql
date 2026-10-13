-- Run in Supabase SQL Editor. Media bucket remains PRIVATE.
create extension if not exists pgcrypto;
create table if not exists public.user_profiles(user_id uuid primary key references auth.users(id) on delete cascade,role text not null default 'viewer' check(role in ('viewer','admin')),created_at timestamptz not null default now());
alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from anon,authenticated;
grant select on public.user_profiles to authenticated;
create policy "Read own profile" on public.user_profiles for select to authenticated using(user_id=(select auth.uid()));
-- Intentionally no client insert/update policy on user_profiles: users cannot grant themselves admin.
create table if not exists public.movies(id uuid primary key default gen_random_uuid(),title text not null check(char_length(title) between 1 and 160),category text not null check(category in ('Bollywood','Hollywood','Web Series','South Indian','Documentary','Short Film','Other')),release_year int check(release_year between 1888 and 2100),language text not null default 'Not specified' check(char_length(language)<=60),genre text not null default 'Other' check(char_length(genre)<=80),description text not null default '' check(char_length(description)<=2000),poster_url text not null check(char_length(poster_url)<=2048),video_path text not null unique check(char_length(video_path)<=500),published boolean not null default false,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists movies_published_created_idx on public.movies(published,created_at desc);
create index if not exists movies_category_published_idx on public.movies(category,published);
alter table public.movies enable row level security;
revoke all on public.movies from anon,authenticated;
grant select on public.movies to anon,authenticated;
grant insert,update,delete on public.movies to authenticated;
create policy "Public sees published titles" on public.movies for select to anon,authenticated using(published=true);
create policy "Admins see all titles" on public.movies for select to authenticated using(exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "Admins insert titles" on public.movies for insert to authenticated with check(created_by=(select auth.uid()) and exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "Admins update titles" on public.movies for update to authenticated using(exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check(exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "Admins delete titles" on public.movies for delete to authenticated using(exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('cinemora-media','cinemora-media',false,2147483648,array['video/mp4','video/webm','video/quicktime','application/vnd.apple.mpegurl','video/mp2t','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false;
create policy "Admins upload Cinemora media" on storage.objects for insert to authenticated with check(bucket_id='cinemora-media' and exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "Admins update Cinemora media" on storage.objects for update to authenticated using(bucket_id='cinemora-media' and exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin')) with check(bucket_id='cinemora-media' and exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
create policy "Admins delete Cinemora media" on storage.objects for delete to authenticated using(bucket_id='cinemora-media' and exists(select 1 from public.user_profiles p where p.user_id=(select auth.uid()) and p.role='admin'));
-- After creating your own Auth account, bootstrap its admin profile manually:
-- insert into public.user_profiles(user_id,role) select id,'admin' from auth.users where email='YOUR-ADMIN-EMAIL' on conflict(user_id) do update set role='admin';
-- Never place the service_role key in browser code or Git.
