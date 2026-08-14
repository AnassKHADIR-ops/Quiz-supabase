-- Migration: User Approval & Access Control System (Private Platform)
-- When a user registers, their account is created with status = 'pending'.
-- An administrator must approve their request before they can access any private content.
-- Administrators can view all requests, approve, reject, revoke, or restore access at any time.
-- All database RPC functions and RLS policies enforce access control server-side.

-- 1. Ensure status and timestamp columns on profiles
alter table public.profiles
  drop constraint if exists profiles_status_check,
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add column if not exists status text not null default 'pending',
  add column if not exists approved_at timestamptz,
  add column if not exists revoked_at timestamptz;

-- Add valid checks for status and role
alter table public.profiles
  add constraint profiles_status_check check (status in ('pending', 'approved', 'rejected', 'revoked')),
  add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));

-- Backfill: approve existing teacher accounts and give them approved_at timestamp
update public.profiles
set status = 'approved',
    approved_at = coalesce(approved_at, created_at)
where status = 'approved' or role in ('teacher', 'admin');

-- 2. Helper functions for authorization checks
create or replace function public.is_staff(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role in ('teacher', 'admin')
  );
$$;

create or replace function public.is_approved_user(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id
      and (status = 'approved' or role in ('teacher', 'admin'))
  );
$$;

-- 3. Trigger for new user signup: always creates profile with student role and pending status
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role, status, created_at, updated_at)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    'student',
    'pending',
    now(),
    now()
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- 4. Prevent regular users from altering their role, status, or timestamps
create or replace function public.prevent_profile_privilege_change()
returns trigger language plpgsql as $$
begin
  if (new.role <> old.role
      or new.status <> old.status
      or new.approved_at is distinct from old.approved_at
      or new.revoked_at is distinct from old.revoked_at)
     and current_user not in ('postgres', 'service_role', 'supabase_admin')
     and not public.is_staff()
  then
    raise exception 'Roles and access status can only be modified by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute procedure public.prevent_profile_privilege_change();

-- 5. RPC Functions for Administrator User Access Management

-- List all users with status, role, dates, and details
create or replace function public.get_users_list()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'email', p.email,
          'role', p.role,
          'status', p.status,
          'created_at', p.created_at,
          'approved_at', p.approved_at,
          'revoked_at', p.revoked_at,
          'updated_at', p.updated_at
        )
        order by
          case
            when p.status = 'pending' then 0
            when p.status = 'approved' then 1
            when p.status = 'revoked' then 2
            else 3
          end,
          p.created_at desc
      )
      from public.profiles p
    ),
    '[]'::jsonb
  );
end;
$$;

-- Approve a user registration request (or re-approve)
create or replace function public.approve_user(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user public.profiles;
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  update public.profiles
  set status = 'approved',
      approved_at = now(),
      revoked_at = null,
      updated_at = now()
  where id = p_user_id
  returning * into v_user;

  if not found then
    raise exception 'User not found';
  end if;

  return jsonb_build_object(
    'id', v_user.id,
    'full_name', v_user.full_name,
    'email', v_user.email,
    'role', v_user.role,
    'status', v_user.status,
    'approved_at', v_user.approved_at,
    'revoked_at', v_user.revoked_at
  );
end;
$$;

-- Reject a pending user request
create or replace function public.reject_user(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user public.profiles;
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot reject your own account';
  end if;

  update public.profiles
  set status = 'rejected',
      updated_at = now()
  where id = p_user_id
  returning * into v_user;

  if not found then
    raise exception 'User not found';
  end if;

  return jsonb_build_object(
    'id', v_user.id,
    'full_name', v_user.full_name,
    'email', v_user.email,
    'role', v_user.role,
    'status', v_user.status,
    'approved_at', v_user.approved_at,
    'revoked_at', v_user.revoked_at
  );
end;
$$;

-- Revoke access for an active user immediately
create or replace function public.revoke_user(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user public.profiles;
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot revoke your own administrator access';
  end if;

  update public.profiles
  set status = 'revoked',
      revoked_at = now(),
      updated_at = now()
  where id = p_user_id
  returning * into v_user;

  if not found then
    raise exception 'User not found';
  end if;

  return jsonb_build_object(
    'id', v_user.id,
    'full_name', v_user.full_name,
    'email', v_user.email,
    'role', v_user.role,
    'status', v_user.status,
    'approved_at', v_user.approved_at,
    'revoked_at', v_user.revoked_at
  );
end;
$$;

-- Restore access for a revoked / rejected user
create or replace function public.restore_user(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return public.approve_user(p_user_id);
end;
$$;

-- Permanently remove a user's profile and access
create or replace function public.delete_user_access(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  delete from public.profiles where id = p_user_id;
  if not found then
    raise exception 'User not found';
  end if;

  return true;
end;
$$;

-- 6. Enforce server-side access verification on all resource RPC functions

create or replace function public.get_schools_with_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select case
    when not public.is_approved_user() then '[]'::jsonb
    else coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', s.name, 'type', s.type, 'description', s.description, 'icon', s.icon,
      'subjects', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sub.id, 'name', sub.name, 'level', sub.level,
        'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'description', e.description, 'year', e.year, 'duration_minutes', e.duration_minutes, 'show_results', e.show_results) order by e.year desc nulls last) from public.exams e where e.subject_id = sub.id and (e.is_published or public.is_staff())), '[]'::jsonb)
      ) order by sub.name) from public.subjects sub where sub.school_id = s.id), '[]'::jsonb),
      'programmes', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'year', p.year, 'label', p.label, 'document_url', p.document_url) order by p.year desc, p.label) from public.school_programmes p where p.school_id = s.id), '[]'::jsonb)
    ) order by s.name), '[]'::jsonb)
  end
  from public.schools s;
$$;

create or replace function public.get_school(p_school_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_approved_user() then
    raise exception 'Votre compte est en attente d''approbation par l''administrateur';
  end if;

  return (
    select jsonb_build_object(
      'id', s.id, 'name', s.name, 'type', s.type, 'description', s.description, 'icon', s.icon,
      'subjects', coalesce((select jsonb_agg(jsonb_build_object(
        'id', sub.id, 'name', sub.name, 'level', sub.level,
        'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'year', e.year) order by e.year desc) from public.exams e where e.subject_id = sub.id and (e.is_published or public.is_staff())), '[]'::jsonb)
      ) order by sub.name) from public.subjects sub where sub.school_id = s.id), '[]'::jsonb),
      'programmes', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'year', p.year, 'label', p.label, 'document_url', p.document_url) order by p.year desc, p.label) from public.school_programmes p where p.school_id = s.id), '[]'::jsonb)
    )
    from public.schools s where s.id = p_school_id
  );
end;
$$;

create or replace function public.get_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select case
    when not public.is_approved_user() then '[]'::jsonb
    else coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
  end
  from (
    select e.id, e.title, e.description, e.duration_minutes, e.show_results, e.is_published, e.year, e.created_at,
           s.name as subject_name, sc.name as school_name, sc.type, sc.icon
    from public.exams e
    left join public.subjects s on s.id = e.subject_id
    left join public.schools sc on sc.id = e.school_id
    where e.is_published or public.is_staff()
  ) x;
$$;

create or replace function public.get_exam_for_view(p_exam_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_exam public.exams;
  v_can_see_keys boolean;
begin
  if not public.is_approved_user() then
    raise exception 'Votre compte est en attente d''approbation par l''administrateur';
  end if;

  select * into v_exam from public.exams where id = p_exam_id;
  if not found then
    raise exception 'Exam not found';
  end if;

  v_can_see_keys := public.is_staff();
  if not v_exam.is_published and not v_can_see_keys then
    raise exception 'Exam not available';
  end if;

  return jsonb_build_object(
    'id', v_exam.id,
    'title', v_exam.title,
    'description', v_exam.description,
    'duration_minutes', v_exam.duration_minutes,
    'show_results', v_exam.show_results,
    'is_published', v_exam.is_published,
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'exam_id', q.exam_id,
          'question_text', q.question_text,
          'question_type', q.question_type,
          'topic', q.topic,
          'position', q.position,
          'solution_text', case when v_can_see_keys then q.solution_text else null end,
          'resource_url', case when v_can_see_keys then q.resource_url else null end,
          'choices', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', c.id,
                'question_id', c.question_id,
                'choice_text', c.choice_text,
                'position', c.position,
                'is_correct', case when v_can_see_keys then c.is_correct else null end
              ) order by c.position, c.id
            )
            from public.choices c
            where c.question_id = q.id
          ), '[]'::jsonb)
        ) order by q.position, q.id
      )
      from public.questions q
      where q.exam_id = v_exam.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.submit_exam_attempt(p_exam_id uuid, p_started_at timestamptz, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_result_id uuid;
  v_total integer;
  v_score integer;
  v_answer jsonb;
  v_question_id uuid;
  v_selected uuid[];
  v_correct uuid[];
  v_seen_questions uuid[] := '{}';
  v_is_correct boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_approved_user() then
    raise exception 'Votre compte est en attente d''approbation par l''administrateur';
  end if;

  if not exists (select 1 from public.exams where id = p_exam_id and (is_published or public.is_staff())) then
    raise exception 'Exam not available';
  end if;

  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'answers must be an array';
  end if;

  select count(*) into v_total from public.questions where exam_id = p_exam_id;
  v_score := 0;

  insert into public.results (exam_id, student_id, score, total, percentage, started_at)
  values (p_exam_id, auth.uid(), 0, v_total, 0, p_started_at)
  returning id into v_result_id;

  for v_answer in select value from jsonb_array_elements(p_answers) loop
    v_question_id := (v_answer ->> 'question_id')::uuid;
    if not exists (select 1 from public.questions where id = v_question_id and exam_id = p_exam_id) then
      raise exception 'Invalid question';
    end if;
    if v_question_id = any(v_seen_questions) then
      raise exception 'Each question may only be answered once';
    end if;
    v_seen_questions := array_append(v_seen_questions, v_question_id);

    select coalesce(array_agg(value::uuid), '{}'::uuid[]) into v_selected
    from jsonb_array_elements_text(coalesce(v_answer -> 'selected_choice_ids', '[]'::jsonb));

    if exists (select 1 from unnest(v_selected) selected_id where not exists (select 1 from public.choices where id = selected_id and question_id = v_question_id)) then
      raise exception 'Invalid choice';
    end if;

    select coalesce(array_agg(id order by id), '{}'::uuid[]) into v_correct
    from public.choices
    where question_id = v_question_id and is_correct;

    v_is_correct := cardinality(v_selected) = cardinality(v_correct) and v_selected <@ v_correct and v_correct <@ v_selected;
    if v_is_correct then
      v_score := v_score + 1;
    end if;

    insert into public.answers (result_id, question_id, selected_choice_ids, is_correct, time_spent_seconds)
    values (v_result_id, v_question_id, v_selected, v_is_correct, nullif(v_answer ->> 'time_spent_seconds', '')::integer);
  end loop;

  update public.results
  set score = v_score,
      percentage = case when v_total = 0 then 0 else round(v_score::numeric / v_total * 100) end
  where id = v_result_id;

  return (select to_jsonb(r) from public.results r where r.id = v_result_id);
end;
$$;

create or replace function public.get_my_results()
returns jsonb language sql stable security definer set search_path = public as $$
  select case
    when not public.is_approved_user() then '[]'::jsonb
    else coalesce(jsonb_agg(to_jsonb(x) order by x.submitted_at desc), '[]'::jsonb)
  end
  from (
    select r.*, e.title as exam_title
    from public.results r
    join public.exams e on e.id = r.exam_id
    where r.student_id = auth.uid()
  ) x;
$$;

create or replace function public.get_result_details(p_result_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_result public.results;
begin
  if not public.is_approved_user() then
    raise exception 'Votre compte est en attente d''approbation par l''administrateur';
  end if;

  select * into v_result from public.results where id = p_result_id;
  if not found then
    raise exception 'Result not found';
  end if;

  if v_result.student_id <> auth.uid() and not public.is_staff() then
    raise exception 'Access denied';
  end if;

  return jsonb_build_object(
    'id', v_result.id,
    'exam_id', v_result.exam_id,
    'student_id', v_result.student_id,
    'score', v_result.score,
    'total', v_result.total,
    'percentage', v_result.percentage,
    'started_at', v_result.started_at,
    'submitted_at', v_result.submitted_at,
    'exam_title', (select title from public.exams where id = v_result.exam_id),
    'student_name', (select full_name from public.profiles where id = v_result.student_id),
    'student_email', (select email from public.profiles where id = v_result.student_id),
    'answers', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'question_id', a.question_id,
          'selected_choice_ids', a.selected_choice_ids,
          'is_correct', a.is_correct,
          'time_spent_seconds', a.time_spent_seconds,
          'question_text', q.question_text,
          'solution_text', q.solution_text,
          'resource_url', q.resource_url,
          'topic', q.topic,
          'choices', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', c.id,
                'question_id', c.question_id,
                'choice_text', c.choice_text,
                'is_correct', c.is_correct,
                'position', c.position
              ) order by c.position, c.id
            )
            from public.choices c
            where c.question_id = q.id
          ), '[]'::jsonb)
        ) order by q.position, q.id
      )
      from public.answers a
      join public.questions q on q.id = a.question_id
      where a.result_id = v_result.id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.get_student_analytics(p_student_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_approved_user() then
    raise exception 'Votre compte est en attente d''approbation par l''administrateur';
  end if;

  if p_student_id <> auth.uid() and not public.is_staff() then
    raise exception 'Access denied';
  end if;

  return jsonb_build_object(
    'stats', (
      select jsonb_build_object(
        'total', count(*),
        'avgPct', coalesce(round(avg(percentage)), 0),
        'best', coalesce(max(percentage), 0),
        'lowest', coalesce(min(percentage), 0),
        'passRate', coalesce(round(100.0 * count(*) filter (where percentage >= 50) / nullif(count(*), 0)), 0)
      )
      from public.results
      where student_id = p_student_id
    ),
    'history', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.submitted_at)
      from (
        select r.id, r.score, r.total, r.percentage, r.submitted_at,
               e.title as exam_title, e.year, sc.name as school_name, sc.type, sc.icon
        from public.results r
        join public.exams e on e.id = r.exam_id
        left join public.schools sc on sc.id = e.school_id
        where r.student_id = p_student_id
      ) x
    ), '[]'::jsonb),
    'bySchool', coalesce((
      select jsonb_agg(jsonb_build_object('name', x.school_name, 'icon', x.icon, 'count', x.count, 'avg', x.avg))
      from (
        select coalesce(sc.name, 'Other') as school_name, max(sc.icon) as icon, count(*) as count, round(avg(r.percentage)) as avg
        from public.results r
        join public.exams e on e.id = r.exam_id
        left join public.schools sc on sc.id = e.school_id
        where r.student_id = p_student_id
        group by sc.name
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- 7. Update Row-Level Security Policies across tables
drop policy if exists "schools readable" on public.schools;
create policy "schools readable" on public.schools
  for select to authenticated using (public.is_approved_user());

drop policy if exists "catalog readable" on public.subjects;
create policy "catalog readable" on public.subjects
  for select to authenticated using (public.is_approved_user());

drop policy if exists "programmes readable" on public.school_programmes;
create policy "programmes readable" on public.school_programmes
  for select to authenticated using (public.is_approved_user());

drop policy if exists "published or teacher exams readable" on public.exams;
create policy "published or teacher exams readable" on public.exams
  for select to authenticated using ((is_published and public.is_approved_user()) or public.is_staff());

drop policy if exists "students see own results teacher sees all" on public.results;
create policy "students see own results teacher sees all" on public.results
  for select to authenticated using ((student_id = auth.uid() and public.is_approved_user()) or public.is_staff());

drop policy if exists "answers follow result access" on public.answers;
create policy "answers follow result access" on public.answers
  for select to authenticated using (
    exists (
      select 1 from public.results r
      where r.id = result_id
        and ((r.student_id = auth.uid() and public.is_approved_user()) or public.is_staff())
    )
  );

-- 8. Grant execution privileges on all functions
revoke all on function public.get_users_list() from public, anon;
revoke all on function public.approve_user(uuid) from public, anon;
revoke all on function public.reject_user(uuid) from public, anon;
revoke all on function public.revoke_user(uuid) from public, anon;
revoke all on function public.restore_user(uuid) from public, anon;
revoke all on function public.delete_user_access(uuid) from public, anon;

grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.is_approved_user(uuid) to authenticated;
grant execute on function public.get_users_list() to authenticated;
grant execute on function public.approve_user(uuid) to authenticated;
grant execute on function public.reject_user(uuid) to authenticated;
grant execute on function public.revoke_user(uuid) to authenticated;
grant execute on function public.restore_user(uuid) to authenticated;
grant execute on function public.delete_user_access(uuid) to authenticated;
