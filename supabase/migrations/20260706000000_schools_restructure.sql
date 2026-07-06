-- Replace université/branche with a single flat École entity carrying a type
-- (post_bac | bac_plus_2). Per product decision, existing catalog data is wiped
-- (results/answers cascade away with their exams) and rebuilt on the new shape.
delete from public.exams;        -- cascades to questions, choices, results, answers
delete from public.universities; -- cascades to branches, then to subjects

alter table public.universities rename to schools;
alter table public.schools drop column category;
alter table public.schools add column type text not null check (type in ('post_bac', 'bac_plus_2'));

alter policy "universities readable" on public.schools rename to "schools readable";
alter policy "staff manage universities" on public.schools rename to "staff manage schools";

alter table public.exams rename column university_id to school_id;

alter table public.subjects drop column branch_id;
alter table public.subjects add column school_id uuid references public.schools(id) on delete cascade;
create unique index if not exists subjects_school_name_idx on public.subjects(school_id, name) where school_id is not null;

drop table public.branches;

drop function if exists public.create_branch(jsonb);
drop function if exists public.update_branch(uuid, jsonb);
drop function if exists public.delete_branch(uuid);
drop function if exists public.get_universities_with_exams();
drop function if exists public.get_university(uuid);
drop function if exists public.create_university(jsonb);
drop function if exists public.update_university(uuid, jsonb);
drop function if exists public.delete_university(uuid);

create or replace function public.get_schools_with_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'name', s.name, 'type', s.type, 'description', s.description, 'icon', s.icon,
    'subjects', coalesce((select jsonb_agg(jsonb_build_object(
      'id', sub.id, 'name', sub.name, 'level', sub.level,
      'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'description', e.description, 'year', e.year, 'duration_minutes', e.duration_minutes, 'show_results', e.show_results) order by e.year desc nulls last) from public.exams e where e.subject_id = sub.id and e.is_published), '[]'::jsonb)
    ) order by sub.name) from public.subjects sub where sub.school_id = s.id), '[]'::jsonb)
  ) order by s.name), '[]'::jsonb)
  from public.schools s;
$$;

create or replace function public.get_school(p_school_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', s.id, 'name', s.name, 'type', s.type, 'description', s.description, 'icon', s.icon,
    'subjects', coalesce((select jsonb_agg(jsonb_build_object('id', sub.id, 'name', sub.name, 'level', sub.level,
      'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'year', e.year) order by e.year desc) from public.exams e where e.subject_id = sub.id and e.is_published), '[]'::jsonb)
    ) order by sub.name) from public.subjects sub where sub.school_id = s.id), '[]'::jsonb))
  from public.schools s where s.id = p_school_id;
$$;

create or replace function public.create_school(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.schools;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(trim(p_payload ->> 'name'), '') is null then raise exception 'School name is required'; end if;
  if nullif(p_payload ->> 'type', '') is null then raise exception 'School type is required'; end if;
  insert into public.schools (name, type, description, icon)
  values (trim(p_payload ->> 'name'), p_payload ->> 'type', nullif(p_payload ->> 'description', ''), coalesce(nullif(p_payload ->> 'icon', ''), '🎓'))
  returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.update_school(p_school_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.schools;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  update public.schools set
    name = case when p_payload ? 'name' then trim(p_payload ->> 'name') else name end,
    type = case when p_payload ? 'type' then p_payload ->> 'type' else type end,
    description = case when p_payload ? 'description' then nullif(p_payload ->> 'description', '') else description end,
    icon = case when p_payload ? 'icon' then coalesce(nullif(p_payload ->> 'icon', ''), icon) else icon end
  where id = p_school_id returning * into v_row;
  if not found then raise exception 'School not found'; end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.delete_school(p_school_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  delete from public.schools where id = p_school_id;
  if not found then raise exception 'School not found'; end if;
end;
$$;

create or replace function public.create_subject(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.subjects;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(p_payload ->> 'school_id', '') is null or nullif(trim(p_payload ->> 'name'), '') is null then raise exception 'School and subject name are required'; end if;
  insert into public.subjects (school_id, name, level)
  values ((p_payload ->> 'school_id')::uuid, trim(p_payload ->> 'name'), nullif(p_payload ->> 'level', '')) returning * into v_row;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.create_exam(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.exams;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(p_payload ->> 'subject_id', '') is null or nullif(p_payload ->> 'year', '') is null then raise exception 'Subject and year are required'; end if;
  insert into public.exams (title, description, subject_id, school_id, year, created_by, duration_minutes, show_results, is_published)
  select coalesce(nullif(trim(p_payload ->> 'title'), ''), s.name || ' QCM ' || (p_payload ->> 'year')),
    nullif(p_payload ->> 'description', ''), s.id, s.school_id, (p_payload ->> 'year')::integer,
    auth.uid(), nullif(p_payload ->> 'duration_minutes', '')::integer,
    coalesce(nullif(p_payload ->> 'show_results', ''), 'instant'), coalesce((p_payload ->> 'is_published')::boolean, false)
  from public.subjects s
  where s.id = (p_payload ->> 'subject_id')::uuid
  returning * into v_row;
  if not found then raise exception 'Subject not found'; end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.get_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
  from (
    select e.id, e.title, e.description, e.duration_minutes, e.show_results, e.is_published, e.year, e.created_at,
           s.name as subject_name, sc.name as school_name, sc.type, sc.icon
    from public.exams e left join public.subjects s on s.id = e.subject_id left join public.schools sc on sc.id = e.school_id
    where e.is_published or public.is_staff()
  ) x;
$$;

create or replace function public.get_student_analytics(p_student_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if p_student_id <> auth.uid() and not public.is_staff() then raise exception 'Access denied'; end if;
  return jsonb_build_object(
    'stats', (select jsonb_build_object('total', count(*), 'avgPct', coalesce(round(avg(percentage)), 0), 'best', coalesce(max(percentage), 0), 'lowest', coalesce(min(percentage), 0), 'passRate', coalesce(round(100.0 * count(*) filter (where percentage >= 50) / nullif(count(*), 0)), 0)) from public.results where student_id = p_student_id),
    'history', coalesce((select jsonb_agg(to_jsonb(x) order by x.submitted_at) from (select r.id, r.score, r.total, r.percentage, r.submitted_at, e.title as exam_title, e.year, sc.name as school_name, sc.type, sc.icon from public.results r join public.exams e on e.id = r.exam_id left join public.schools sc on sc.id = e.school_id where r.student_id = p_student_id) x), '[]'::jsonb),
    'bySchool', coalesce((select jsonb_agg(jsonb_build_object('name', x.school_name, 'icon', x.icon, 'count', x.count, 'avg', x.avg)) from (select coalesce(sc.name, 'Other') as school_name, max(sc.icon) as icon, count(*) as count, round(avg(r.percentage)) as avg from public.results r join public.exams e on e.id = r.exam_id left join public.schools sc on sc.id = e.school_id where r.student_id = p_student_id group by sc.name) x), '[]'::jsonb)
  );
end;
$$;

revoke all on function
  public.get_schools_with_exams(), public.get_school(uuid), public.create_school(jsonb), public.update_school(uuid,jsonb), public.delete_school(uuid),
  public.create_subject(jsonb), public.create_exam(jsonb), public.get_exams(), public.get_student_analytics(uuid)
from public, anon;
grant execute on function
  public.get_schools_with_exams(), public.get_school(uuid), public.create_school(jsonb), public.update_school(uuid,jsonb), public.delete_school(uuid),
  public.create_subject(jsonb), public.create_exam(jsonb), public.get_exams(), public.get_student_analytics(uuid)
to authenticated;
