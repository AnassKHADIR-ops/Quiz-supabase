-- Extend get_result_details with exam title + student identity so teachers
-- can open any student's submission from a standalone page (not just right
-- after the student's own submission) and know whose result they're viewing.
create or replace function public.get_result_details(p_result_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_result public.results;
begin
  select * into v_result from public.results where id = p_result_id;
  if not found then raise exception 'Result not found'; end if;
  if v_result.student_id <> auth.uid() and not public.is_staff() then raise exception 'Access denied'; end if;
  return jsonb_build_object('id', v_result.id, 'exam_id', v_result.exam_id, 'student_id', v_result.student_id, 'score', v_result.score, 'total', v_result.total, 'percentage', v_result.percentage, 'started_at', v_result.started_at, 'submitted_at', v_result.submitted_at,
    'exam_title', (select title from public.exams where id = v_result.exam_id),
    'student_name', (select full_name from public.profiles where id = v_result.student_id),
    'student_email', (select email from public.profiles where id = v_result.student_id),
    'answers', coalesce((select jsonb_agg(jsonb_build_object('question_id', a.question_id, 'selected_choice_ids', a.selected_choice_ids, 'is_correct', a.is_correct, 'time_spent_seconds', a.time_spent_seconds, 'question_text', q.question_text, 'solution_text', q.solution_text, 'resource_url', q.resource_url, 'topic', q.topic,
      'choices', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'question_id', c.question_id, 'choice_text', c.choice_text, 'is_correct', c.is_correct, 'position', c.position) order by c.position, c.id) from public.choices c where c.question_id = q.id), '[]'::jsonb)
    ) order by q.position, q.id) from public.answers a join public.questions q on q.id = a.question_id where a.result_id = v_result.id), '[]'::jsonb));
end;
$$;
