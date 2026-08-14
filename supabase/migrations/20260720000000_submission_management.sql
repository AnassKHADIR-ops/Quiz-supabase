-- Migration: Submission management & bulk deletion for teachers / admins
create or replace function public.delete_exam_results(p_exam_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  if not public.is_staff() then
    raise exception 'Teacher/Admin access required';
  end if;

  delete from public.results
  where exam_id = p_exam_id;
  
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.delete_bulk_results(p_result_ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  if not public.is_staff() then
    raise exception 'Teacher/Admin access required';
  end if;

  delete from public.results
  where id = any(p_result_ids);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.delete_exam_results(uuid) to authenticated;
grant execute on function public.delete_bulk_results(uuid[]) to authenticated;
