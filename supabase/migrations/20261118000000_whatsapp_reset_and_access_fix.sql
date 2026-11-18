-- ============================================================================
-- Migration: Access Recovery (Orphan & Returning Students) + Secure WhatsApp
--            Password Reset System
-- Project:   Quiz-supabase (quiz.anasskhadir.com)
-- Date:      2026-11-18
-- ============================================================================
-- Idempotent & self-contained (includes all fixes from 20260906000000 as well).
-- Can be applied via `supabase db push` OR pasted directly into the
-- Supabase Dashboard -> SQL Editor -> Run.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Ensure `phone` column exists on public.profiles
alter table public.profiles
  add column if not exists phone text;

-- 2. Dedicated table for WhatsApp-verified 6-digit password reset requests
--    RLS is enabled with ZERO public policies: no unauthenticated or student
--    client can ever SELECT the 6-digit code directly. Only SECURITY DEFINER
--    RPCs can read/write this table.
create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  code text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pwd_reset_email_idx
  on public.password_reset_requests (lower(email), created_at desc);

create index if not exists pwd_reset_user_idx
  on public.password_reset_requests (user_id, created_at desc);

alter table public.password_reset_requests enable row level security;

-- 3. Immediate Auto-Heal: Restore public.profiles for ALL orphan auth.users
--    (e.g., students whose profile was previously deleted while their auth.users
--    account remained, making them invisible to the professor dashboard).
insert into public.profiles (id, full_name, email, phone, role, status, created_at, updated_at)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1), 'Étudiant'),
  u.email,
  nullif(trim(u.raw_user_meta_data ->> 'phone'), ''),
  'student',
  'pending',
  coalesce(u.created_at, now()),
  now()
from auth.users u
where u.email is not null
  and not exists (select 1 from public.profiles p where p.id = u.id)
  and not exists (select 1 from public.profiles p where lower(p.email) = lower(u.email))
on conflict (id) do nothing;

-- 4. Update handle_new_user() trigger to also persist optional WhatsApp phone
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, status, created_at, updated_at)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Étudiant'),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    'student',
    'pending',
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = coalesce(excluded.phone, public.profiles.phone),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Allow authenticated users (orphan, revoked, or rejected) to request/re-apply for access
create or replace function public.request_user_access()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
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

  insert into public.profiles (id, full_name, email, phone, role, status, created_at, updated_at)
  values (
    auth.uid(),
    coalesce(nullif(trim(v_user.raw_user_meta_data ->> 'full_name'), ''), split_part(v_user.email, '@', 1), 'Étudiant'),
    v_user.email,
    nullif(trim(v_user.raw_user_meta_data ->> 'phone'), ''),
    'student',
    'pending',
    coalesce(v_user.created_at, now()),
    now()
  )
  on conflict (id) do update
  set status = case
        when public.profiles.status = 'approved' or public.profiles.role in ('teacher', 'admin')
          then public.profiles.status
        else 'pending'
      end,
      revoked_at = case
        when public.profiles.status = 'approved' or public.profiles.role in ('teacher', 'admin')
          then public.profiles.revoked_at
        else null
      end,
      updated_at = now()
  returning * into v_profile;

  return to_jsonb(v_profile);
end;
$$;

-- 6. Enhanced get_users_list():
--    - Auto-heals any orphan auth.users on every load so NO student is ever invisible
--    - Joins active WhatsApp password reset requests (code only exposed to staff!)
--    - Orders pending accounts & active reset requests first
create or replace function public.get_users_list()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  -- Auto-heal any user in auth.users missing a profile row
  insert into public.profiles (id, full_name, email, phone, role, status, created_at, updated_at)
  select
    u.id,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1), 'Étudiant'),
    u.email,
    nullif(trim(u.raw_user_meta_data ->> 'phone'), ''),
    'student',
    'pending',
    coalesce(u.created_at, now()),
    now()
  from auth.users u
  where u.email is not null
    and not exists (select 1 from public.profiles p where p.id = u.id)
    and not exists (select 1 from public.profiles p where lower(p.email) = lower(u.email))
  on conflict (id) do nothing;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'email', p.email,
          'phone', coalesce(p.phone, r.phone),
          'role', p.role,
          'status', p.status,
          'created_at', p.created_at,
          'approved_at', p.approved_at,
          'revoked_at', p.revoked_at,
          'updated_at', p.updated_at,
          'reset_code', r.code,
          'reset_expires_at', r.expires_at,
          'reset_created_at', r.created_at
        )
        order by
          case when r.code is not null then 0 else 1 end,
          case
            when p.status = 'pending' then 0
            when p.status = 'approved' then 1
            when p.status = 'revoked' then 2
            else 3
          end,
          p.created_at desc
      )
      from public.profiles p
      left join lateral (
        select pr.code, pr.expires_at, pr.created_at, pr.phone
        from public.password_reset_requests pr
        where pr.user_id = p.id
          and pr.used_at is null
          and pr.expires_at > now()
          and pr.attempts < 5
        order by pr.created_at desc
        limit 1
      ) r on true
    ),
    '[]'::jsonb
  );
end;
$$;

-- 7. Quick Approve by Email (Staff only):
--    Allows Pr. Khadir to paste any student email received on WhatsApp and approve
--    them in 1 click — works for pending, revoked, rejected, OR orphan auth users!
create or replace function public.quick_approve_by_email(p_email text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_clean_email text;
  v_auth_user auth.users;
  v_profile public.profiles;
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  v_clean_email := lower(trim(coalesce(p_email, '')));
  if v_clean_email = '' then
    raise exception 'Veuillez saisir une adresse e-mail valide.';
  end if;

  -- First check auth.users (source of truth for registered accounts)
  select * into v_auth_user
  from auth.users
  where lower(email) = v_clean_email
  order by created_at desc
  limit 1;

  if not found then
    -- Fallback check in profiles
    select * into v_profile
    from public.profiles
    where lower(email) = v_clean_email
    limit 1;

    if not found then
      raise exception 'Aucun compte trouvé avec l''adresse "%". L''étudiant doit d''abord créer un compte sur la plateforme.', v_clean_email;
    end if;

    update public.profiles
    set status = 'approved',
        approved_at = now(),
        revoked_at = null,
        updated_at = now()
    where id = v_profile.id
    returning * into v_profile;

    return to_jsonb(v_profile);
  end if;

  -- Ensure email is confirmed so the student can log in without email-link friction
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = v_auth_user.id;

  -- Upsert profile as approved
  insert into public.profiles (id, full_name, email, phone, role, status, approved_at, revoked_at, created_at, updated_at)
  values (
    v_auth_user.id,
    coalesce(nullif(trim(v_auth_user.raw_user_meta_data ->> 'full_name'), ''), split_part(v_auth_user.email, '@', 1), 'Étudiant'),
    v_auth_user.email,
    nullif(trim(v_auth_user.raw_user_meta_data ->> 'phone'), ''),
    'student',
    'approved',
    now(),
    null,
    coalesce(v_auth_user.created_at, now()),
    now()
  )
  on conflict (id) do update
  set status = 'approved',
      approved_at = now(),
      revoked_at = null,
      updated_at = now()
  returning * into v_profile;

  return to_jsonb(v_profile);
end;
$$;

-- 8. Secure WhatsApp Password Reset — Step 1 (Public / Student):
--    Generates a cryptographically random 6-digit code stored server-side ONLY.
--    NEVER returns the secret code to the caller: only Pr. Khadir sees the code
--    in his admin dashboard and sends it to the student after verifying their
--    identity on WhatsApp.
create or replace function public.request_password_reset(
  p_email text,
  p_phone text default null
)
returns jsonb language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_clean_email text;
  v_clean_phone text;
  v_auth_user auth.users;
  v_profile public.profiles;
  v_existing public.password_reset_requests;
  v_bytes bytea;
  v_rand bigint;
  v_code text;
  v_expires timestamptz;
  v_name text;
begin
  v_clean_email := lower(trim(coalesce(p_email, '')));
  v_clean_phone := nullif(trim(coalesce(p_phone, '')), '');

  if v_clean_email = '' then
    raise exception 'Veuillez renseigner votre adresse e-mail.';
  end if;

  select * into v_auth_user
  from auth.users
  where lower(email) = v_clean_email
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Aucun compte trouvé avec l''adresse "%". Vérifiez votre e-mail ou créez un compte.', v_clean_email;
  end if;

  -- Auto-heal profile if missing so the student is guaranteed visible in Pr. Khadir's dashboard
  insert into public.profiles (id, full_name, email, phone, role, status, created_at, updated_at)
  values (
    v_auth_user.id,
    coalesce(nullif(trim(v_auth_user.raw_user_meta_data ->> 'full_name'), ''), split_part(v_auth_user.email, '@', 1), 'Étudiant'),
    v_auth_user.email,
    coalesce(v_clean_phone, nullif(trim(v_auth_user.raw_user_meta_data ->> 'phone'), '')),
    'student',
    'pending',
    coalesce(v_auth_user.created_at, now()),
    now()
  )
  on conflict (id) do update
  set phone = coalesce(v_clean_phone, public.profiles.phone),
      updated_at = now()
  returning * into v_profile;

  -- Protect teacher/admin accounts from public reset flow
  if v_profile.role in ('teacher', 'admin') then
    raise exception 'La réinitialisation par code WhatsApp est réservée aux comptes étudiants.';
  end if;

  v_name := coalesce(v_profile.full_name, split_part(v_auth_user.email, '@', 1), 'Étudiant');

  -- Rate-limit: reuse an active code created less than 60 seconds ago
  select * into v_existing
  from public.password_reset_requests
  where user_id = v_auth_user.id
    and used_at is null
    and expires_at > now()
    and attempts < 5
    and created_at > now() - interval '60 seconds'
  order by created_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'success', true,
      'email', v_auth_user.email,
      'full_name', v_name,
      'expires_at', v_existing.expires_at,
      'reused', true
    );
  end if;

  -- Invalidate any older pending codes for this student
  update public.password_reset_requests
  set used_at = now()
  where user_id = v_auth_user.id
    and used_at is null;

  -- Cryptographically uniform 6-digit code (100000..999999)
  v_bytes := gen_random_bytes(4);
  v_rand := (
    (get_byte(v_bytes, 0)::bigint << 24)
    + (get_byte(v_bytes, 1)::bigint << 16)
    + (get_byte(v_bytes, 2)::bigint << 8)
    + get_byte(v_bytes, 3)::bigint
  );
  v_code := lpad((100000 + (v_rand % 900000))::text, 6, '0');
  v_expires := now() + interval '30 minutes';

  insert into public.password_reset_requests (
    user_id, email, full_name, phone, code, expires_at
  )
  values (
    v_auth_user.id, v_auth_user.email, v_name, coalesce(v_clean_phone, v_profile.phone), v_code, v_expires
  );

  -- IMPORTANT: Never expose v_code here! Only Pr. Khadir sees it in his dashboard.
  return jsonb_build_object(
    'success', true,
    'email', v_auth_user.email,
    'full_name', v_name,
    'expires_at', v_expires
  );
end;
$$;

-- 9. Secure WhatsApp Password Reset — Step 2 (Public / Student):
--    Verifies the 6-digit code sent by Pr. Khadir on WhatsApp (max 5 attempts,
--    30-min expiry, single-use) and updates auth.users.encrypted_password via bcrypt.
create or replace function public.confirm_password_reset(
  p_email text,
  p_code text,
  p_new_password text
)
returns jsonb language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_clean_email text;
  v_clean_code text;
  v_req public.password_reset_requests;
  v_is_staff_target boolean;
  v_remaining integer;
begin
  v_clean_email := lower(trim(coalesce(p_email, '')));
  v_clean_code := regexp_replace(coalesce(p_code, ''), '\s+', '', 'g');

  if v_clean_email = '' then
    raise exception 'Veuillez saisir votre adresse e-mail.';
  end if;

  if length(v_clean_code) <> 6 then
    raise exception 'Le code de validation doit contenir exactement 6 chiffres.';
  end if;

  if length(coalesce(p_new_password, '')) < 6 then
    raise exception 'Le nouveau mot de passe doit comporter au moins 6 caractères.';
  end if;

  select * into v_req
  from public.password_reset_requests
  where lower(email) = v_clean_email
    and used_at is null
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Aucune demande de réinitialisation active pour cet e-mail. Veuillez d''abord demander un code.';
  end if;

  if v_req.expires_at <= now() then
    update public.password_reset_requests set used_at = now() where id = v_req.id;
    raise exception 'Ce code de validation a expiré (validité 30 min). Veuillez envoyer une nouvelle demande.';
  end if;

  if v_req.attempts >= 5 then
    update public.password_reset_requests set used_at = now() where id = v_req.id;
    raise exception 'Nombre maximum de tentatives atteint. Veuillez générer une nouvelle demande de code.';
  end if;

  if v_req.code <> v_clean_code then
    update public.password_reset_requests
    set attempts = attempts + 1
    where id = v_req.id;

    v_remaining := 5 - (v_req.attempts + 1);
    if v_remaining <= 0 then
      update public.password_reset_requests set used_at = now() where id = v_req.id;
      raise exception 'Code incorrect. Limite de tentatives atteinte — veuillez demander un nouveau code.';
    end if;

    raise exception 'Code de validation incorrect. Il vous reste % tentative(s).', v_remaining;
  end if;

  -- Safety check: never allow resetting a teacher/admin account via public student reset
  select exists (
    select 1 from public.profiles
    where id = v_req.user_id and role in ('teacher', 'admin')
  ) into v_is_staff_target;

  if v_is_staff_target then
    raise exception 'Opération non autorisée pour ce compte.';
  end if;

  -- Update actual Supabase Auth bcrypt password
  update auth.users
  set encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = v_req.user_id;

  -- Consume code (single-use)
  update public.password_reset_requests
  set used_at = now()
  where user_id = v_req.user_id
    and used_at is null;

  return jsonb_build_object(
    'success', true,
    'email', v_req.email
  );
end;
$$;

-- 10. Admin helper: Generate a fresh 6-digit WhatsApp reset code for a student
create or replace function public.admin_generate_reset_code(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_profile public.profiles;
  v_bytes bytea;
  v_rand bigint;
  v_code text;
  v_expires timestamptz;
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  select * into v_profile from public.profiles where id = p_user_id;
  if not found then
    raise exception 'Utilisateur introuvable.';
  end if;

  if v_profile.role in ('teacher', 'admin') then
    raise exception 'Impossible de générer un code étudiant pour un compte administrateur.';
  end if;

  -- Invalidate old active codes
  update public.password_reset_requests
  set used_at = now()
  where user_id = p_user_id and used_at is null;

  v_bytes := gen_random_bytes(4);
  v_rand := (
    (get_byte(v_bytes, 0)::bigint << 24)
    + (get_byte(v_bytes, 1)::bigint << 16)
    + (get_byte(v_bytes, 2)::bigint << 8)
    + get_byte(v_bytes, 3)::bigint
  );
  v_code := lpad((100000 + (v_rand % 900000))::text, 6, '0');
  v_expires := now() + interval '30 minutes';

  insert into public.password_reset_requests (
    user_id, email, full_name, phone, code, expires_at
  )
  values (
    v_profile.id, v_profile.email, v_profile.full_name, v_profile.phone, v_code, v_expires
  );

  return jsonb_build_object(
    'code', v_code,
    'expires_at', v_expires,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'phone', v_profile.phone
  );
end;
$$;

-- 11. Admin helper: Directly set a new password for a student (to share on WhatsApp/Gmail)
create or replace function public.admin_set_user_password(
  p_user_id uuid,
  p_new_password text
)
returns jsonb language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_profile public.profiles;
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  if length(coalesce(p_new_password, '')) < 6 then
    raise exception 'Le mot de passe doit comporter au moins 6 caractères.';
  end if;

  select * into v_profile from public.profiles where id = p_user_id;
  if not found then
    raise exception 'Utilisateur introuvable.';
  end if;

  if v_profile.role in ('teacher', 'admin') and v_profile.id <> auth.uid() then
    raise exception 'Impossible de modifier le mot de passe d''un autre compte professeur/admin.';
  end if;

  update auth.users
  set encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = p_user_id;

  -- Mark any pending reset requests as resolved
  update public.password_reset_requests
  set used_at = now()
  where user_id = p_user_id and used_at is null;

  return jsonb_build_object(
    'success', true,
    'email', v_profile.email,
    'full_name', v_profile.full_name
  );
end;
$$;

-- 12. Update delete_user_access() so it ALWAYS removes auth.users too (prevents orphans)
create or replace function public.delete_user_access(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_staff() then
    raise exception 'Administrator access required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  delete from public.password_reset_requests where user_id = p_user_id;
  delete from public.answers where result_id in (select id from public.results where student_id = p_user_id);
  delete from public.results where student_id = p_user_id;
  delete from auth.users where id = p_user_id;
  delete from public.profiles where id = p_user_id;

  return true;
end;
$$;

-- 13. Grant execute permissions cleanly
grant execute on function public.request_user_access() to authenticated;
grant execute on function public.get_users_list() to authenticated;
grant execute on function public.quick_approve_by_email(text) to authenticated;
grant execute on function public.delete_user_access(uuid) to authenticated;
grant execute on function public.request_password_reset(text, text) to anon, authenticated;
grant execute on function public.confirm_password_reset(text, text, text) to anon, authenticated;
grant execute on function public.admin_generate_reset_code(uuid) to authenticated;
grant execute on function public.admin_set_user_password(uuid, text) to authenticated;
