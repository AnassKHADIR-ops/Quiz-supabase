-- Academic hierarchy: university -> branch -> subject -> one QCM per year.
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (university_id, name)
);
create index if not exists branches_university_idx on public.branches(university_id);

alter table public.subjects add column if not exists branch_id uuid references public.branches(id) on delete cascade;
create index if not exists subjects_branch_idx on public.subjects(branch_id);
create unique index if not exists subjects_branch_name_idx on public.subjects(branch_id, name) where branch_id is not null;
create unique index if not exists exams_subject_year_idx on public.exams(subject_id, year) where subject_id is not null and year is not null;

alter table public.branches enable row level security;
create policy "branches readable" on public.branches for select to authenticated using (true);
create policy "teacher manages branches" on public.branches for all to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function public.get_universities_with_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', u.id, 'name', u.name, 'description', u.description, 'icon', u.icon,
    'branches', coalesce((select jsonb_agg(jsonb_build_object(
      'id', b.id, 'name', b.name, 'description', b.description,
      'subjects', coalesce((select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'level', s.level,
        'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'description', e.description, 'year', e.year, 'duration_minutes', e.duration_minutes, 'show_results', e.show_results) order by e.year desc nulls last) from public.exams e where e.subject_id = s.id and e.is_published), '[]'::jsonb)
      ) order by s.name) from public.subjects s where s.branch_id = b.id), '[]'::jsonb)
    ) order by b.name) from public.branches b where b.university_id = u.id), '[]'::jsonb)
  ) order by u.name), '[]'::jsonb)
  from public.universities u;
$$;

create or replace function public.get_university(p_university_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', u.id, 'name', u.name, 'description', u.description, 'icon', u.icon,
    'branches', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'description', b.description,
      'subjects', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'level', s.level,
        'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'year', e.year) order by e.year desc) from public.exams e where e.subject_id = s.id and e.is_published), '[]'::jsonb)
      ) order by s.name) from public.subjects s where s.branch_id = b.id), '[]'::jsonb)
    ) order by b.name) from public.branches b where b.university_id = u.id), '[]'::jsonb))
  from public.universities u where u.id = p_university_id;
$$;

create or replace function public.create_university(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.universities;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(trim(p_payload ->> 'name'), '') is null then raise exception 'University name is required'; end if;
  insert into public.universities (name, category, description, icon)
  values (trim(p_payload ->> 'name'), coalesce(nullif(p_payload ->> 'category', ''), 'Universities'), nullif(p_payload ->> 'description', ''), coalesce(nullif(p_payload ->> 'icon', ''), '🎓')) returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.create_branch(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.branches;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(p_payload ->> 'university_id', '') is null or nullif(trim(p_payload ->> 'name'), '') is null then raise exception 'University and branch name are required'; end if;
  insert into public.branches (university_id, name, description)
  values ((p_payload ->> 'university_id')::uuid, trim(p_payload ->> 'name'), nullif(p_payload ->> 'description', '')) returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.update_university(p_university_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.universities;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  update public.universities set name = case when p_payload ? 'name' then trim(p_payload ->> 'name') else name end,
    category = case when p_payload ? 'category' then p_payload ->> 'category' else category end,
    description = case when p_payload ? 'description' then nullif(p_payload ->> 'description', '') else description end,
    icon = case when p_payload ? 'icon' then coalesce(nullif(p_payload ->> 'icon', ''), icon) else icon end
  where id = p_university_id returning * into v_row;
  if not found then raise exception 'University not found'; end if; return to_jsonb(v_row);
end;
$$;

create or replace function public.update_branch(p_branch_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.branches;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  update public.branches set name = case when p_payload ? 'name' then trim(p_payload ->> 'name') else name end,
    description = case when p_payload ? 'description' then nullif(p_payload ->> 'description', '') else description end
  where id = p_branch_id returning * into v_row;
  if not found then raise exception 'Branch not found'; end if; return to_jsonb(v_row);
end;
$$;

create or replace function public.create_subject(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.subjects;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(p_payload ->> 'branch_id', '') is null or nullif(trim(p_payload ->> 'name'), '') is null then raise exception 'Branch and subject name are required'; end if;
  insert into public.subjects (branch_id, name, level)
  values ((p_payload ->> 'branch_id')::uuid, trim(p_payload ->> 'name'), nullif(p_payload ->> 'level', '')) returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.update_subject(p_subject_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.subjects;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  update public.subjects set name = case when p_payload ? 'name' then trim(p_payload ->> 'name') else name end,
    level = case when p_payload ? 'level' then nullif(p_payload ->> 'level', '') else level end
  where id = p_subject_id returning * into v_row;
  if not found then raise exception 'Subject not found'; end if; return to_jsonb(v_row);
end;
$$;

create or replace function public.create_exam(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.exams;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(p_payload ->> 'subject_id', '') is null or nullif(p_payload ->> 'year', '') is null then raise exception 'Subject and year are required'; end if;
  insert into public.exams (title, description, subject_id, university_id, year, created_by, duration_minutes, show_results, is_published)
  select coalesce(nullif(trim(p_payload ->> 'title'), ''), s.name || ' QCM ' || (p_payload ->> 'year')),
    nullif(p_payload ->> 'description', ''), s.id, b.university_id, (p_payload ->> 'year')::integer,
    auth.uid(), nullif(p_payload ->> 'duration_minutes', '')::integer,
    coalesce(nullif(p_payload ->> 'show_results', ''), 'instant'), coalesce((p_payload ->> 'is_published')::boolean, false)
  from public.subjects s join public.branches b on b.id = s.branch_id
  where s.id = (p_payload ->> 'subject_id')::uuid
  returning * into v_row;
  if not found then raise exception 'Subject not found'; end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.update_exam(p_exam_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.exams;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  update public.exams set title = case when p_payload ? 'title' then nullif(trim(p_payload ->> 'title'), '') else title end,
    description = case when p_payload ? 'description' then nullif(p_payload ->> 'description', '') else description end,
    year = case when p_payload ? 'year' then (p_payload ->> 'year')::integer else year end,
    duration_minutes = case when p_payload ? 'duration_minutes' then nullif(p_payload ->> 'duration_minutes', '')::integer else duration_minutes end,
    is_published = case when p_payload ? 'is_published' then (p_payload ->> 'is_published')::boolean else is_published end
  where id = p_exam_id returning * into v_row;
  if not found then raise exception 'QCM not found'; end if;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.get_universities_with_exams(), public.get_university(uuid), public.create_university(jsonb), public.create_branch(jsonb), public.create_subject(jsonb), public.update_university(uuid,jsonb), public.update_branch(uuid,jsonb), public.update_subject(uuid,jsonb) from public, anon;
grant execute on function public.get_universities_with_exams(), public.get_university(uuid), public.create_university(jsonb), public.create_branch(jsonb), public.create_subject(jsonb), public.update_university(uuid,jsonb), public.update_branch(uuid,jsonb), public.update_subject(uuid,jsonb) to authenticated;
