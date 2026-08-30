-- Migration: Allow public & unapproved users to view published exams/quizzes
-- Fixes error P0001 "Votre compte est en attente d'approbation par l'administrateur" on public viewing

-- 1. get_exam_for_view: allow public viewing of published exams, answer keys remain protected
create or replace function public.get_exam_for_view(p_exam_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_exam public.exams;
  v_can_see_keys boolean;
begin
  select * into v_exam from public.exams where id = p_exam_id;
  if not found then
    raise exception 'Exam not found';
  end if;

  v_can_see_keys := public.is_staff();
  
  -- Published exams can be viewed by anyone (anon, pending, approved students).
  -- Draft exams can only be viewed by staff (teachers/admins).
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

-- 2. get_exams: return published exams without blocking public visitors
create or replace function public.get_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
  from (
    select e.id, e.title, e.description, e.duration_minutes, e.show_results, e.is_published, e.year, e.created_at,
           s.name as subject_name, sc.name as school_name, sc.type, sc.icon
    from public.exams e
    left join public.subjects s on s.id = e.subject_id
    left join public.schools sc on sc.id = e.school_id
    where e.is_published or public.is_staff()
  ) x;
$$;

-- 3. get_schools_with_exams: return schools and published exams without blocking public visitors
create or replace function public.get_schools_with_exams()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'name', s.name, 'type', s.type, 'description', s.description, 'icon', s.icon,
    'subjects', coalesce((select jsonb_agg(jsonb_build_object(
      'id', sub.id, 'name', sub.name, 'level', sub.level,
      'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'description', e.description, 'year', e.year, 'duration_minutes', e.duration_minutes, 'show_results', e.show_results) order by e.year desc nulls last) from public.exams e where e.subject_id = sub.id and (e.is_published or public.is_staff())), '[]'::jsonb)
    ) order by sub.name) from public.subjects sub where sub.school_id = s.id), '[]'::jsonb),
    'programmes', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'year', p.year, 'label', p.label, 'document_url', p.document_url) order by p.year desc, p.label) from public.school_programmes p where p.school_id = s.id), '[]'::jsonb)
  ) order by s.name), '[]'::jsonb)
  from public.schools s;
$$;

-- 4. Ensure permissions
grant execute on function public.get_exam_for_view(uuid) to anon, authenticated, service_role;
grant execute on function public.get_exams() to anon, authenticated, service_role;
grant execute on function public.get_schools_with_exams() to anon, authenticated, service_role;
