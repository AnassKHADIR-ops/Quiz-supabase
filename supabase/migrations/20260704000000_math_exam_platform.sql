-- Math Exams: Supabase replacement for Quiz-Backend.
-- Auth credentials live only in auth.users. All application data uses UUIDs.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level text,
  created_at timestamptz not null default now()
);

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  description text,
  icon text not null default '🎓',
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject_id uuid references public.subjects(id) on delete set null,
  university_id uuid references public.universities(id) on delete set null,
  year integer check (year is null or year between 1900 and 2100),
  created_by uuid references public.profiles(id) on delete set null,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  show_results text not null default 'instant' check (show_results in ('instant', 'delayed')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'single' check (question_type in ('single', 'multiple')),
  topic text,
  solution_text text,
  resource_url text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_text text not null,
  is_correct boolean not null default false,
  position integer not null default 0
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null default 0,
  total numeric not null default 0,
  percentage numeric not null default 0 check (percentage between 0 and 100),
  started_at timestamptz,
  submitted_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.results(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_choice_ids uuid[] not null default '{}',
  is_correct boolean not null default false,
  time_spent_seconds integer check (time_spent_seconds is null or time_spent_seconds >= 0)
);

create index if not exists exams_creator_idx on public.exams(created_by);
create index if not exists exams_published_idx on public.exams(is_published) where is_published;
create index if not exists questions_exam_idx on public.questions(exam_id, position);
create index if not exists choices_question_idx on public.choices(question_id, position);
create index if not exists results_student_idx on public.results(student_id, submitted_at desc);
create index if not exists results_exam_idx on public.results(exam_id, submitted_at desc);
create index if not exists answers_result_idx on public.answers(result_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Also create profiles for any Auth users that existed before this migration.
insert into public.profiles (id, full_name, email)
select id,
       coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), split_part(email, '@', 1)),
       email
from auth.users
on conflict (id) do update set email = excluded.email;

create or replace function public.prevent_profile_privilege_change()
returns trigger language plpgsql as $$
begin
  if new.role <> old.role and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Roles can only be changed by a database administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles for each row execute procedure public.prevent_profile_privilege_change();
drop trigger if exists exams_updated_at on public.exams;
create trigger exams_updated_at before update on public.exams for each row execute procedure public.set_updated_at();
drop trigger if exists questions_updated_at on public.questions;
create trigger questions_updated_at before update on public.questions for each row execute procedure public.set_updated_at();

create or replace function public.is_staff(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = p_user_id and role = 'teacher');
$$;

create or replace function public.owns_exam(p_exam_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.exams where id = p_exam_id and created_by = p_user_id);
$$;

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.universities enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.results enable row level security;
alter table public.answers enable row level security;

create policy "profiles readable by self or teacher" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "profiles update self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "catalog readable" on public.subjects for select to authenticated using (true);
create policy "staff manage subjects" on public.subjects for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "universities readable" on public.universities for select to authenticated using (true);
create policy "staff manage universities" on public.universities for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "published or teacher exams readable" on public.exams for select to authenticated using (is_published or public.is_staff());
create policy "staff create exams" on public.exams for insert to authenticated with check (public.is_staff() and created_by = auth.uid());
create policy "teacher manages exams" on public.exams for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "teacher deletes exams" on public.exams for delete to authenticated using (public.is_staff());
create policy "teacher manages questions" on public.questions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "teacher manages answer keys" on public.choices for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "students see own results teacher sees all" on public.results for select to authenticated using (student_id = auth.uid() or public.is_staff());
create policy "teacher deletes results" on public.results for delete to authenticated using (public.is_staff());
create policy "answers follow result access" on public.answers for select to authenticated using (exists (select 1 from public.results r where r.id = result_id and (r.student_id = auth.uid() or public.is_staff())));

-- Read APIs and grading run as definer functions. They explicitly authorize every call.
create or replace function public.get_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
  from (
    select e.id, e.title, e.description, e.duration_minutes, e.show_results, e.is_published, e.year, e.created_at,
           s.name as subject_name, u.name as university_name, u.category, u.icon
    from public.exams e left join public.subjects s on s.id = e.subject_id left join public.universities u on u.id = e.university_id
    where e.is_published or public.is_staff()
  ) x;
$$;

create or replace function public.get_universities_with_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', c.category, 'universities', c.universities) order by c.category), '[]'::jsonb)
  from (
    select u.category, jsonb_agg(jsonb_build_object(
      'id', u.id, 'name', u.name, 'description', u.description, 'icon', u.icon,
      'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'description', e.description, 'year', e.year, 'duration_minutes', e.duration_minutes, 'show_results', e.show_results) order by e.year desc nulls last, e.created_at desc) from public.exams e where e.university_id = u.id and e.is_published), '[]'::jsonb)
    ) order by u.name) as universities
    from public.universities u group by u.category
  ) c;
$$;

create or replace function public.get_university(p_university_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', u.id, 'name', u.name, 'category', u.category, 'description', u.description, 'icon', u.icon,
    'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'description', e.description, 'year', e.year, 'duration_minutes', e.duration_minutes, 'show_results', e.show_results) order by e.year desc nulls last) from public.exams e where e.university_id = u.id and e.is_published), '[]'::jsonb))
  from public.universities u where u.id = p_university_id;
$$;

create or replace function public.get_exam_for_view(p_exam_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_exam public.exams; v_can_see_keys boolean;
begin
  select * into v_exam from public.exams where id = p_exam_id;
  if not found then raise exception 'Exam not found'; end if;
  v_can_see_keys := public.is_staff();
  if not v_exam.is_published and not v_can_see_keys then raise exception 'Exam not available'; end if;
  return jsonb_build_object('id', v_exam.id, 'title', v_exam.title, 'description', v_exam.description, 'duration_minutes', v_exam.duration_minutes, 'show_results', v_exam.show_results, 'is_published', v_exam.is_published,
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'exam_id', q.exam_id, 'question_text', q.question_text, 'question_type', q.question_type, 'topic', q.topic, 'position', q.position,
      'solution_text', case when v_can_see_keys then q.solution_text else null end, 'resource_url', case when v_can_see_keys then q.resource_url else null end,
      'choices', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'question_id', c.question_id, 'choice_text', c.choice_text, 'position', c.position, 'is_correct', case when v_can_see_keys then c.is_correct else null end) order by c.position, c.id) from public.choices c where c.question_id = q.id), '[]'::jsonb)
    ) order by q.position, q.id) from public.questions q where q.exam_id = v_exam.id), '[]'::jsonb));
end;
$$;

-- Teacher authoring APIs: equivalents of POST/PATCH/DELETE /api/exams and
-- POST /api/exams/:id/questions. Payloads use the legacy field names.
create or replace function public.create_exam(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_exam public.exams;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(trim(p_payload ->> 'title'), '') is null then raise exception 'title is required'; end if;
  insert into public.exams (
    title, description, subject_id, university_id, year, created_by,
    duration_minutes, show_results, is_published
  ) values (
    trim(p_payload ->> 'title'), nullif(p_payload ->> 'description', ''),
    nullif(p_payload ->> 'subject_id', '')::uuid, nullif(p_payload ->> 'university_id', '')::uuid,
    nullif(p_payload ->> 'year', '')::integer, auth.uid(),
    nullif(p_payload ->> 'duration_minutes', '')::integer,
    coalesce(nullif(p_payload ->> 'show_results', ''), 'instant'), false
  ) returning * into v_exam;
  return to_jsonb(v_exam);
end;
$$;

create or replace function public.update_exam(p_exam_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_exam public.exams;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  update public.exams
  set title = case when p_payload ? 'title' then nullif(trim(p_payload ->> 'title'), '') else title end,
      description = case when p_payload ? 'description' then nullif(p_payload ->> 'description', '') else description end,
      subject_id = case when p_payload ? 'subject_id' then nullif(p_payload ->> 'subject_id', '')::uuid else subject_id end,
      university_id = case when p_payload ? 'university_id' then nullif(p_payload ->> 'university_id', '')::uuid else university_id end,
      year = case when p_payload ? 'year' then nullif(p_payload ->> 'year', '')::integer else year end,
      duration_minutes = case when p_payload ? 'duration_minutes' then nullif(p_payload ->> 'duration_minutes', '')::integer else duration_minutes end,
      show_results = case when p_payload ? 'show_results' then p_payload ->> 'show_results' else show_results end,
      is_published = case when p_payload ? 'is_published' then (p_payload ->> 'is_published')::boolean else is_published end
  where id = p_exam_id
  returning * into v_exam;
  if not found then raise exception 'Exam not found'; end if;
  return to_jsonb(v_exam);
end;
$$;

create or replace function public.delete_exam(p_exam_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  delete from public.exams where id = p_exam_id;
  if not found then raise exception 'Exam not found'; end if;
  return true;
end;
$$;

create or replace function public.add_question(p_exam_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_question public.questions; v_choice jsonb; v_position integer := 0; v_choices jsonb;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(trim(p_payload ->> 'question_text'), '') is null then raise exception 'question_text is required'; end if;
  v_choices := p_payload -> 'choices';
  if jsonb_typeof(v_choices) <> 'array' or jsonb_array_length(v_choices) < 2 then raise exception 'at least 2 choices are required'; end if;
  insert into public.questions (exam_id, question_text, question_type, topic, solution_text, resource_url, position)
  values (
    p_exam_id, trim(p_payload ->> 'question_text'), coalesce(nullif(p_payload ->> 'question_type', ''), 'single'),
    nullif(p_payload ->> 'topic', ''), nullif(p_payload ->> 'solution_text', ''), nullif(p_payload ->> 'resource_url', ''),
    coalesce(nullif(p_payload ->> 'position', '')::integer, 0)
  ) returning * into v_question;
  for v_choice in select value from jsonb_array_elements(v_choices) loop
    if nullif(trim(v_choice ->> 'choice_text'), '') is null then raise exception 'choice_text is required'; end if;
    insert into public.choices (question_id, choice_text, is_correct, position)
    values (v_question.id, trim(v_choice ->> 'choice_text'), coalesce((v_choice ->> 'is_correct')::boolean, false), v_position);
    v_position := v_position + 1;
  end loop;
  return jsonb_build_object(
    'id', v_question.id, 'exam_id', v_question.exam_id, 'question_text', v_question.question_text,
    'question_type', v_question.question_type, 'topic', v_question.topic, 'solution_text', v_question.solution_text,
    'resource_url', v_question.resource_url, 'position', v_question.position,
    'choices', (select jsonb_agg(to_jsonb(c) order by c.position) from public.choices c where c.question_id = v_question.id)
  );
end;
$$;

create or replace function public.submit_exam_attempt(p_exam_id uuid, p_started_at timestamptz, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result_id uuid; v_total integer; v_score integer; v_answer jsonb; v_question_id uuid; v_selected uuid[]; v_correct uuid[]; v_seen_questions uuid[] := '{}'; v_is_correct boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.exams where id = p_exam_id and is_published) then raise exception 'Exam not available'; end if;
  if jsonb_typeof(p_answers) <> 'array' then raise exception 'answers must be an array'; end if;
  select count(*) into v_total from public.questions where exam_id = p_exam_id;
  v_score := 0;
  insert into public.results (exam_id, student_id, score, total, percentage, started_at) values (p_exam_id, auth.uid(), 0, v_total, 0, p_started_at) returning id into v_result_id;
  for v_answer in select value from jsonb_array_elements(p_answers) loop
    v_question_id := (v_answer ->> 'question_id')::uuid;
    if not exists (select 1 from public.questions where id = v_question_id and exam_id = p_exam_id) then raise exception 'Invalid question'; end if;
    if v_question_id = any(v_seen_questions) then raise exception 'Each question may only be answered once'; end if;
    v_seen_questions := array_append(v_seen_questions, v_question_id);
    select coalesce(array_agg(value::uuid), '{}'::uuid[]) into v_selected from jsonb_array_elements_text(coalesce(v_answer -> 'selected_choice_ids', '[]'::jsonb));
    if exists (select 1 from unnest(v_selected) selected_id where not exists (select 1 from public.choices where id = selected_id and question_id = v_question_id)) then raise exception 'Invalid choice'; end if;
    select coalesce(array_agg(id order by id), '{}'::uuid[]) into v_correct from public.choices where question_id = v_question_id and is_correct;
    v_is_correct := cardinality(v_selected) = cardinality(v_correct) and v_selected <@ v_correct and v_correct <@ v_selected;
    if v_is_correct then v_score := v_score + 1; end if;
    insert into public.answers (result_id, question_id, selected_choice_ids, is_correct, time_spent_seconds) values (v_result_id, v_question_id, v_selected, v_is_correct, nullif(v_answer ->> 'time_spent_seconds', '')::integer);
  end loop;
  update public.results set score = v_score, percentage = case when v_total = 0 then 0 else round(v_score::numeric / v_total * 100) end where id = v_result_id;
  return (select to_jsonb(r) from public.results r where r.id = v_result_id);
end;
$$;

create or replace function public.get_my_results()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.submitted_at desc), '[]'::jsonb) from (select r.*, e.title as exam_title from public.results r join public.exams e on e.id = r.exam_id where r.student_id = auth.uid()) x;
$$;

create or replace function public.get_exam_results(p_exam_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_staff() then coalesce(jsonb_agg(to_jsonb(x) order by x.submitted_at desc), '[]'::jsonb) else '[]'::jsonb end
  from (select r.*, p.full_name as student_name, p.email as student_email from public.results r join public.profiles p on p.id = r.student_id where r.exam_id = p_exam_id) x;
$$;

create or replace function public.get_result_details(p_result_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_result public.results;
begin
  select * into v_result from public.results where id = p_result_id;
  if not found then raise exception 'Result not found'; end if;
  if v_result.student_id <> auth.uid() and not public.is_staff() then raise exception 'Access denied'; end if;
  return jsonb_build_object('id', v_result.id, 'exam_id', v_result.exam_id, 'student_id', v_result.student_id, 'score', v_result.score, 'total', v_result.total, 'percentage', v_result.percentage, 'started_at', v_result.started_at, 'submitted_at', v_result.submitted_at,
    'answers', coalesce((select jsonb_agg(jsonb_build_object('question_id', a.question_id, 'selected_choice_ids', a.selected_choice_ids, 'is_correct', a.is_correct, 'time_spent_seconds', a.time_spent_seconds, 'question_text', q.question_text, 'solution_text', q.solution_text, 'resource_url', q.resource_url, 'topic', q.topic,
      'choices', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'question_id', c.question_id, 'choice_text', c.choice_text, 'is_correct', c.is_correct, 'position', c.position) order by c.position, c.id) from public.choices c where c.question_id = q.id), '[]'::jsonb)
    ) order by q.position, q.id) from public.answers a join public.questions q on q.id = a.question_id where a.result_id = v_result.id), '[]'::jsonb));
end;
$$;

create or replace function public.delete_result(p_result_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  delete from public.results where id = p_result_id; return true;
end;
$$;

create or replace function public.get_student_analytics(p_student_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if p_student_id <> auth.uid() and not public.is_staff() then raise exception 'Access denied'; end if;
  return jsonb_build_object(
    'stats', (select jsonb_build_object('total', count(*), 'avgPct', coalesce(round(avg(percentage)), 0), 'best', coalesce(max(percentage), 0), 'lowest', coalesce(min(percentage), 0), 'passRate', coalesce(round(100.0 * count(*) filter (where percentage >= 50) / nullif(count(*), 0)), 0)) from public.results where student_id = p_student_id),
    'history', coalesce((select jsonb_agg(to_jsonb(x) order by x.submitted_at) from (select r.id, r.score, r.total, r.percentage, r.submitted_at, e.title as exam_title, e.year, u.name as university_name, u.category, u.icon from public.results r join public.exams e on e.id = r.exam_id left join public.universities u on u.id = e.university_id where r.student_id = p_student_id) x), '[]'::jsonb),
    'byUniversity', coalesce((select jsonb_agg(jsonb_build_object('name', x.university_name, 'icon', x.icon, 'count', x.count, 'avg', x.avg)) from (select coalesce(u.name, 'Other') as university_name, max(u.icon) as icon, count(*) as count, round(avg(r.percentage)) as avg from public.results r join public.exams e on e.id = r.exam_id left join public.universities u on u.id = e.university_id where r.student_id = p_student_id group by u.name) x), '[]'::jsonb)
  );
end;
$$;

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from public, anon;
grant select, insert, update, delete on public.profiles, public.subjects, public.universities, public.exams, public.questions, public.choices, public.results, public.answers to authenticated;
grant execute on function public.is_staff(uuid), public.owns_exam(uuid,uuid) to authenticated;
grant execute on function public.get_exams(), public.get_universities_with_exams(), public.get_university(uuid), public.get_exam_for_view(uuid), public.create_exam(jsonb), public.update_exam(uuid,jsonb), public.delete_exam(uuid), public.add_question(uuid,jsonb), public.submit_exam_attempt(uuid,timestamptz,jsonb), public.get_my_results(), public.get_exam_results(uuid), public.get_result_details(uuid), public.delete_result(uuid), public.get_student_analytics(uuid) to authenticated;
