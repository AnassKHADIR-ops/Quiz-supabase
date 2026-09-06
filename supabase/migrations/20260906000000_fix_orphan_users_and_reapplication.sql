-- Migration: Fix Orphan Users, Auto-Heal Profiles & Allow Re-application
-- 
-- Problem:
-- 1. When an administrator deleted a user with `delete_user_access`, it deleted the row
--    from `public.profiles`, but NOT from Supabase `auth.users`.
-- 2. When that student logged back in later, Supabase authenticated them successfully,
--    but because their row in `public.profiles` was missing, the React frontend fell back
--    to `status: 'pending'` in local client memory.
-- 3. In the database, however, no row existed in `public.profiles`, so the administrator's
--    dashboard (`get_users_list`) showed 0 pending requests and the student was invisible.
--
-- Fix:
-- 1. Auto-heal existing orphan accounts: Insert missing profiles for all users present in auth.users.
-- 2. Update `get_users_list()` to auto-sync any orphan auth users so no student can ever be invisible.
-- 3. Add `request_user_access()` so returning or revoked/rejected students can re-apply.
-- 4. Update `delete_user_access()` to delete from `auth.users` too, preventing orphan auth accounts.

-- 1. Immediate Auto-Heal: Insert missing profile records for any users in auth.users (like Mohammed)
insert into public.profiles (id, full_name, email, role, status, created_at, updated_at)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1), 'Étudiant'),
  u.email,
  'student',
  'pending',
  coalesce(u.created_at, now()),
  now()
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- 2. Allow authenticated users to request or re-apply for access
create or replace function public.request_user_access()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user auth.users;
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_user from auth.users where id = auth.uid();
  if not found then
    raise exception 'User not found in auth.users';
  end if;

  insert into public.profiles (id, full_name, email, role, status, created_at, updated_at)
  values (
    auth.uid(),
    coalesce(nullif(v_user.raw_user_meta_data->>'full_name', ''), split_part(v_user.email, '@', 1), 'Étudiant'),
    v_user.email,
    'student',
    'pending',
    now(),
    now()
  )
  on conflict (id) do update
  set status = case
        -- If already approved or staff, keep their approved status
        when public.profiles.status = 'approved' or public.profiles.role in ('teacher', 'admin') then public.profiles.status
        -- Otherwise (rejected, revoked, or pending), place them in pending for teacher review
        else 'pending'
      end,
      updated_at = now()
  returning * into v_profile;

  return to_jsonb(v_profile);
end;
$$;

-- 3. Update get_users_list() to auto-heal missing profiles on every admin list fetch
create or replace function public.get_users_list()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  -- Auto-heal: Ensure any user in auth.users has a row in public.profiles
  insert into public.profiles (id, full_name, email, role, status, created_at, updated_at)
  select
    u.id,
    coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1), 'Étudiant'),
    u.email,
    'student',
    'pending',
    coalesce(u.created_at, now()),
    now()
  from auth.users u
  where not exists (select 1 from public.profiles p where p.id = u.id)
  on conflict (id) do nothing;

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

-- 4. Update delete_user_access() to properly delete the user from auth.users as well
create or replace function public.delete_user_access(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  -- Delete associated results & answers
  delete from public.answers where result_id in (select id from public.results where student_id = p_user_id);
  delete from public.results where student_id = p_user_id;

  -- Delete from auth.users (cascades to public.profiles)
  delete from auth.users where id = p_user_id;
  delete from public.profiles where id = p_user_id;

  return true;
end;
$$;

-- 5. Grant execution permissions
grant execute on function public.request_user_access() to authenticated;
grant execute on function public.get_users_list() to authenticated;
grant execute on function public.delete_user_access(uuid) to authenticated;
