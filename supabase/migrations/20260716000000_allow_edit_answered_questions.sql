-- Allow teachers to edit a question's text/choices/correct answer even after
-- students have already answered it. Deleting a question that already has
-- student answers stays blocked (delete_question, unchanged) since that would
-- permanently strip the question out of already-submitted results.
--
-- Note: a student's stored score (results.score/percentage) and per-answer
-- is_correct flag are locked in at submission time and are NOT recomputed
-- here. Only the live "Correction détaillée" review screen (get_result_details)
-- reads the choices' current is_correct, so editing a question after students
-- have answered it can make their review screen show today's correct answer
-- rather than the one that was live when they submitted.
create or replace function public.update_question(p_question_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_question public.questions; v_choice jsonb; v_position integer := 0; v_choices jsonb;
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  select * into v_question from public.questions where id = p_question_id;
  if not found then raise exception 'Question not found'; end if;
  update public.questions set question_text = case when p_payload ? 'question_text' then trim(p_payload ->> 'question_text') else question_text end,
    question_type = case when p_payload ? 'question_type' then p_payload ->> 'question_type' else question_type end,
    topic = case when p_payload ? 'topic' then nullif(p_payload ->> 'topic', '') else topic end,
    solution_text = case when p_payload ? 'solution_text' then nullif(p_payload ->> 'solution_text', '') else solution_text end,
    resource_url = case when p_payload ? 'resource_url' then nullif(p_payload ->> 'resource_url', '') else resource_url end
  where id = p_question_id returning * into v_question;
  if p_payload ? 'choices' then
    v_choices := p_payload -> 'choices';
    if jsonb_typeof(v_choices) <> 'array' or jsonb_array_length(v_choices) < 2 then raise exception 'at least 2 choices are required'; end if;
    delete from public.choices where question_id = p_question_id;
    for v_choice in select value from jsonb_array_elements(v_choices) loop
      if nullif(trim(v_choice ->> 'choice_text'), '') is null then raise exception 'choice_text is required'; end if;
      insert into public.choices (question_id, choice_text, is_correct, position)
      values (p_question_id, trim(v_choice ->> 'choice_text'), coalesce((v_choice ->> 'is_correct')::boolean, false), v_position);
      v_position := v_position + 1;
    end loop;
  end if;
  return jsonb_build_object('id', v_question.id, 'question_text', v_question.question_text, 'solution_text', v_question.solution_text,
    'choices', (select jsonb_agg(to_jsonb(c) order by c.position) from public.choices c where c.question_id = v_question.id));
end;
$$;

revoke all on function public.update_question(uuid,jsonb) from public, anon;
grant execute on function public.update_question(uuid,jsonb) to authenticated;
