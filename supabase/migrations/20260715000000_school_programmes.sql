-- Per-year curriculum ("programme") reference documents attached to a school
-- (used today only by the "Concours d'enseignement" school under Bac+2, but
-- modeled generically so any school can carry programmes later). Documents
-- are hosted externally (e.g. Google Drive) — we only store the link, never
-- the file itself, to avoid consuming the Supabase Storage free-tier quota.
-- A school+year can have several documents (e.g. split in parts), told apart
-- by an optional label.

-- Tear down a possible earlier version of this migration (the first draft
-- uploaded files to a Supabase Storage bucket) so this file is safe to run
-- regardless of what already ran.
drop policy if exists "programme pdfs readable" on storage.objects;
drop policy if exists "staff upload programme pdfs" on storage.objects;
drop policy if exists "staff update programme pdfs" on storage.objects;
drop policy if exists "staff delete programme pdfs" on storage.objects;
-- Note: the now-unused "programmes" Storage bucket itself is left in place —
-- Postgres blocks direct deletes on storage.buckets (must go through the
-- Storage API/dashboard). It's empty and harmless; remove it manually from
-- Supabase Studio → Storage if you want it gone.
drop function if exists public.upsert_school_programme(jsonb);
drop table if exists public.school_programmes cascade;

create table public.school_programmes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  year integer not null,
  label text,
  document_url text not null,
  created_at timestamptz not null default now()
);
create index if not exists school_programmes_school_year_idx on public.school_programmes(school_id, year);

alter table public.school_programmes enable row level security;
create policy "programmes readable" on public.school_programmes for select to authenticated using (true);
create policy "staff manage programmes" on public.school_programmes for all to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function public.create_school_programme(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.school_programmes;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(p_payload ->> 'school_id', '') is null or nullif(p_payload ->> 'year', '') is null or nullif(p_payload ->> 'document_url', '') is null then
    raise exception 'School, year and document link are required';
  end if;
  insert into public.school_programmes (school_id, year, label, document_url)
  values ((p_payload ->> 'school_id')::uuid, (p_payload ->> 'year')::integer, nullif(trim(p_payload ->> 'label'), ''), p_payload ->> 'document_url')
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.update_school_programme(p_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.school_programmes;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  update public.school_programmes set
    year = case when p_payload ? 'year' then (p_payload ->> 'year')::integer else year end,
    label = case when p_payload ? 'label' then nullif(trim(p_payload ->> 'label'), '') else label end,
    document_url = case when p_payload ? 'document_url' then p_payload ->> 'document_url' else document_url end
  where id = p_id returning * into v_row;
  if not found then raise exception 'Programme not found'; end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.delete_school_programme(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  delete from public.school_programmes where id = p_id;
  if not found then raise exception 'Programme not found'; end if;
end;
$$;

-- Extend the school read models with their programme documents.
create or replace function public.get_schools_with_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'name', s.name, 'type', s.type, 'description', s.description, 'icon', s.icon,
    'subjects', coalesce((select jsonb_agg(jsonb_build_object(
      'id', sub.id, 'name', sub.name, 'level', sub.level,
      'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'description', e.description, 'year', e.year, 'duration_minutes', e.duration_minutes, 'show_results', e.show_results) order by e.year desc nulls last) from public.exams e where e.subject_id = sub.id and e.is_published), '[]'::jsonb)
    ) order by sub.name) from public.subjects sub where sub.school_id = s.id), '[]'::jsonb),
    'programmes', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'year', p.year, 'label', p.label, 'document_url', p.document_url) order by p.year desc, p.label) from public.school_programmes p where p.school_id = s.id), '[]'::jsonb)
  ) order by s.name), '[]'::jsonb)
  from public.schools s;
$$;

create or replace function public.get_school(p_school_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', s.id, 'name', s.name, 'type', s.type, 'description', s.description, 'icon', s.icon,
    'subjects', coalesce((select jsonb_agg(jsonb_build_object('id', sub.id, 'name', sub.name, 'level', sub.level,
      'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'year', e.year) order by e.year desc) from public.exams e where e.subject_id = sub.id and e.is_published), '[]'::jsonb)
    ) order by sub.name) from public.subjects sub where sub.school_id = s.id), '[]'::jsonb),
    'programmes', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'year', p.year, 'label', p.label, 'document_url', p.document_url) order by p.year desc, p.label) from public.school_programmes p where p.school_id = s.id), '[]'::jsonb))
  from public.schools s where s.id = p_school_id;
$$;

revoke all on function public.create_school_programme(jsonb), public.update_school_programme(uuid,jsonb), public.delete_school_programme(uuid) from public, anon;
grant execute on function public.create_school_programme(jsonb), public.update_school_programme(uuid,jsonb), public.delete_school_programme(uuid) to authenticated;
