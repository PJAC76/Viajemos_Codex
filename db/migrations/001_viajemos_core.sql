create or replace function public.viajemos_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create schema if not exists public;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  login_provider text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_login_provider_check check (login_provider in ('email', 'google', 'github', 'demo'))
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  destination text not null,
  description text not null default '',
  cover_image text,
  start_date date not null,
  end_date date not null,
  currency text not null default 'EUR',
  status text not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_currency_check check (currency = 'EUR'),
  constraint trips_status_check check (status in ('draft', 'active', 'closed')),
  constraint trips_dates_check check (end_date >= start_date)
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_members_role_check check (role in ('admin', 'member')),
  constraint trip_members_status_check check (status in ('active', 'invited', 'removed')),
  constraint trip_members_unique_trip_user unique (trip_id, user_id)
);

create table if not exists public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete restrict,
  share_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  constraint trip_invitations_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create index if not exists idx_profiles_display_name on public.profiles (display_name);
create index if not exists idx_trips_created_by on public.trips (created_by);
create index if not exists idx_trip_members_trip on public.trip_members (trip_id);
create index if not exists idx_trip_members_user on public.trip_members (user_id);
create index if not exists idx_trip_invitations_trip on public.trip_invitations (trip_id);
create index if not exists idx_trip_invitations_email on public.trip_invitations (email);

create or replace function public.is_trip_member(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
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
  select exists (
    select 1
    from public.trip_members
    where trip_id = target_trip_id
      and user_id = auth.uid()
      and status = 'active'
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invitations enable row level security;

drop policy if exists profiles_self_and_trip_members_read on public.profiles;
create policy profiles_self_and_trip_members_read
on public.profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.trip_members mine
    join public.trip_members theirs on theirs.trip_id = mine.trip_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and theirs.user_id = profiles.user_id
      and theirs.status = 'active'
  )
);

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists profiles_self_delete on public.profiles;
create policy profiles_self_delete
on public.profiles
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists trips_member_read on public.trips;
create policy trips_member_read
on public.trips
for select
to authenticated
using (public.is_trip_member(id));

drop policy if exists trips_creator_insert on public.trips;
create policy trips_creator_insert
on public.trips
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists trips_admin_update on public.trips;
create policy trips_admin_update
on public.trips
for update
to authenticated
using (public.is_trip_admin(id))
with check (public.is_trip_admin(id));

drop policy if exists trips_admin_delete on public.trips;
create policy trips_admin_delete
on public.trips
for delete
to authenticated
using (public.is_trip_admin(id));

drop policy if exists trip_members_member_read on public.trip_members;
create policy trip_members_member_read
on public.trip_members
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists trip_members_creator_bootstrap on public.trip_members;
create policy trip_members_creator_bootstrap
on public.trip_members
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    and role = 'admin'
    and status = 'active'
    and exists (
      select 1
      from public.trips
      where id = trip_id
        and created_by = auth.uid()
    )
  )
  or public.is_trip_admin(trip_id)
);

drop policy if exists trip_members_admin_update on public.trip_members;
create policy trip_members_admin_update
on public.trip_members
for update
to authenticated
using (public.is_trip_admin(trip_id))
with check (public.is_trip_admin(trip_id));

drop policy if exists trip_members_admin_delete on public.trip_members;
create policy trip_members_admin_delete
on public.trip_members
for delete
to authenticated
using (public.is_trip_admin(trip_id));

drop policy if exists trip_invitations_member_read on public.trip_invitations;
create policy trip_invitations_member_read
on public.trip_invitations
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists trip_invitations_admin_insert on public.trip_invitations;
create policy trip_invitations_admin_insert
on public.trip_invitations
for insert
to authenticated
with check (public.is_trip_admin(trip_id));

drop policy if exists trip_invitations_admin_update on public.trip_invitations;
create policy trip_invitations_admin_update
on public.trip_invitations
for update
to authenticated
using (public.is_trip_admin(trip_id))
with check (public.is_trip_admin(trip_id));

drop policy if exists trip_invitations_admin_delete on public.trip_invitations;
create policy trip_invitations_admin_delete
on public.trip_invitations
for delete
to authenticated
using (public.is_trip_admin(trip_id));

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.viajemos_set_updated_at();

drop trigger if exists trg_trips_updated_at on public.trips;
create trigger trg_trips_updated_at
before update on public.trips
for each row
execute function public.viajemos_set_updated_at();

drop trigger if exists trg_trip_members_updated_at on public.trip_members;
create trigger trg_trip_members_updated_at
before update on public.trip_members
for each row
execute function public.viajemos_set_updated_at();

drop trigger if exists trg_trip_invitations_updated_at on public.trip_invitations;
create trigger trg_trip_invitations_updated_at
before update on public.trip_invitations
for each row
execute function public.viajemos_set_updated_at();

insert into public.profiles (user_id, display_name, avatar_url, login_provider)
select
  u.id,
  coalesce(
    nullif(u.profile ->> 'name', ''),
    split_part(u.email, '@', 1)
  ),
  nullif(u.profile ->> 'avatar_url', ''),
  case
    when coalesce((u.metadata -> 'providers')::text, '') ilike '%google%' then 'google'
    when coalesce((u.metadata -> 'providers')::text, '') ilike '%github%' then 'github'
    else 'email'
  end
from auth.users u
on conflict (user_id) do nothing;
