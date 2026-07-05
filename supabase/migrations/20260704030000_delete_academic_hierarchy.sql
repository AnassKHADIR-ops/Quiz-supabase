-- Allow teachers to delete universities, branches and subjects from the management UI.
-- Existing foreign keys already define the cascade behaviour:
--   branches.university_id  -> on delete cascade (branches follow their university)
--   subjects.branch_id      -> on delete cascade (subjects follow their branch)
--   exams.subject_id        -> on delete set null (exams survive, just lose the subject link)
--   exams.university_id     -> on delete set null (exams survive, just lose the university link)

create or replace function public.delete_university(p_university_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  delete from public.universities where id = p_university_id;
  if not found then raise exception 'University not found'; end if;
end;
$$;

create or replace function public.delete_branch(p_branch_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  delete from public.branches where id = p_branch_id;
  if not found then raise exception 'Branch not found'; end if;
end;
$$;

create or replace function public.delete_subject(p_subject_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Teacher access required'; end if;
  delete from public.subjects where id = p_subject_id;
  if not found then raise exception 'Subject not found'; end if;
end;
$$;

revoke all on function public.delete_university(uuid), public.delete_branch(uuid), public.delete_subject(uuid) from public, anon;
grant execute on function public.delete_university(uuid), public.delete_branch(uuid), public.delete_subject(uuid) to authenticated;
