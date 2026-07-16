-- Let teachers drag-and-drop reorder questions inside the QCM editor.
--
-- add_question previously always inserted new questions at position 0, so
-- every question in an exam ended up tied at position 0 and the display
-- order was actually decided by id (effectively random, not creation order).
-- Fixed here to append at the end of the exam instead, so a manual
-- reorder isn't silently undone the next time a teacher adds a question.
create or replace function public.add_question(p_exam_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_question public.questions; v_choice jsonb; v_position integer := 0; v_choices jsonb; v_next_position integer;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if nullif(trim(p_payload ->> 'question_text'), '') is null then raise exception 'question_text is required'; end if;
  v_choices := p_payload -> 'choices';
  if jsonb_typeof(v_choices) <> 'array' or jsonb_array_length(v_choices) < 2 then raise exception 'at least 2 choices are required'; end if;
  select coalesce(max(position) + 1, 0) into v_next_position from public.questions where exam_id = p_exam_id;
  insert into public.questions (exam_id, question_text, question_type, topic, solution_text, resource_url, position)
  values (
    p_exam_id, trim(p_payload ->> 'question_text'), coalesce(nullif(p_payload ->> 'question_type', ''), 'single'),
    nullif(p_payload ->> 'topic', ''), nullif(p_payload ->> 'solution_text', ''), nullif(p_payload ->> 'resource_url', ''),
    coalesce(nullif(p_payload ->> 'position', '')::integer, v_next_position)
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

-- One-time backfill: existing questions in an exam are all tied at position 0
-- (the old add_question default), so today's order is really just an id tie
-- break. Assign stable sequential positions from that same current order
-- before reordering becomes meaningful.
with ranked as (
  select id, row_number() over (partition by exam_id order by position, created_at, id) - 1 as rn
  from public.questions
)
update public.questions q set position = ranked.rn
from ranked
where ranked.id = q.id and q.position <> ranked.rn;

-- p_question_ids must be the full, exact set of question ids for the exam,
-- in the desired display order; position is assigned from that order.
create or replace function public.reorder_questions(p_exam_id uuid, p_question_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  if not exists (select 1 from public.exams where id = p_exam_id) then raise exception 'Exam not found'; end if;
  if (select count(*) from public.questions where exam_id = p_exam_id) <> coalesce(array_length(p_question_ids, 1), 0)
     or exists (select 1 from public.questions where exam_id = p_exam_id and id <> all(p_question_ids))
  then
    raise exception 'question_ids must list every question of this exam exactly once';
  end if;
  update public.questions q
  set position = t.rn - 1
  from unnest(p_question_ids) with ordinality as t(id, rn)
  where q.id = t.id and q.exam_id = p_exam_id;
end;
$$;

revoke all on function public.reorder_questions(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_questions(uuid, uuid[]) to authenticated;
