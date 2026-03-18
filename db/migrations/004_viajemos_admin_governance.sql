create or replace function public.is_global_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and is_project_admin = true
  );
$$;

create or replace function public.is_trip_member(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_global_admin()
    or exists (
      select 1
      from public.trip_members
      where trip_id = target_trip_id
        and user_id = auth.uid()
        and status = 'active'
    );
$$;

create or replace function public.is_trip_admin(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_global_admin()
    or exists (
      select 1
      from public.trip_members
      where trip_id = target_trip_id
        and user_id = auth.uid()
        and status = 'active'
        and role = 'admin'
    );
$$;

create or replace function public.get_trip_viewer_role(target_trip_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  membership_role text;
begin
  if public.is_global_admin() then
    return 'admin';
  end if;

  select role
  into membership_role
  from public.trip_members
  where trip_id = target_trip_id
    and user_id = auth.uid()
    and status = 'active'
  limit 1;

  return membership_role;
end;
$$;

create or replace function public.set_trip_member_role(target_member_id uuid, next_role text)
returns table (
  trip_id uuid,
  member_id uuid,
  user_id uuid,
  role text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_member public.trip_members%rowtype;
  active_admin_count integer;
begin
  if not public.is_global_admin() then
    raise exception 'GLOBAL_ADMIN_REQUIRED';
  end if;

  if next_role not in ('admin', 'member') then
    raise exception 'INVALID_MEMBER_ROLE';
  end if;

  select *
  into target_member
  from public.trip_members
  where id = target_member_id
  limit 1
  for update;

  if not found then
    raise exception 'MEMBER_NOT_FOUND';
  end if;

  if target_member.status <> 'active' then
    raise exception 'MEMBER_NOT_ACTIVE';
  end if;

  if target_member.role = 'admin' and next_role = 'member' then
    select count(*)
    into active_admin_count
    from public.trip_members
    where trip_id = target_member.trip_id
      and status = 'active'
      and role = 'admin';

    if active_admin_count <= 1 then
      raise exception 'LAST_ADMIN_REQUIRED';
    end if;
  end if;

  update public.trip_members
  set
    role = next_role,
    updated_at = now()
  where id = target_member_id
  returning public.trip_members.trip_id, public.trip_members.id, public.trip_members.user_id, public.trip_members.role, public.trip_members.status
  into trip_id, member_id, user_id, role, status;

  return next;
end;
$$;

create or replace function public.remove_trip_member(target_member_id uuid)
returns table (
  trip_id uuid,
  member_id uuid,
  user_id uuid,
  role text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_member public.trip_members%rowtype;
  active_admin_count integer;
begin
  select *
  into target_member
  from public.trip_members
  where id = target_member_id
  limit 1
  for update;

  if not found then
    raise exception 'MEMBER_NOT_FOUND';
  end if;

  if not (public.is_global_admin() or public.is_trip_admin(target_member.trip_id)) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if target_member.status <> 'active' then
    raise exception 'MEMBER_NOT_ACTIVE';
  end if;

  if target_member.role = 'admin' then
    select count(*)
    into active_admin_count
    from public.trip_members
    where trip_id = target_member.trip_id
      and status = 'active'
      and role = 'admin';

    if active_admin_count <= 1 then
      raise exception 'LAST_ADMIN_REQUIRED';
    end if;
  end if;

  update public.trip_members
  set
    status = 'removed',
    updated_at = now()
  where id = target_member_id
  returning public.trip_members.trip_id, public.trip_members.id, public.trip_members.user_id, public.trip_members.role, public.trip_members.status
  into trip_id, member_id, user_id, role, status;

  return next;
end;
$$;
