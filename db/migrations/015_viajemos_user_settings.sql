create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  start_screen text not null default 'trips',
  preferred_trip_id uuid references public.trips(id) on delete set null,
  default_map_mode text not null default 'driving',
  compact_mode boolean not null default false,
  email_notifications boolean not null default true,
  expense_notifications boolean not null default true,
  itinerary_notifications boolean not null default true,
  message_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_start_screen_check check (start_screen in ('trips', 'explore', 'notifications')),
  constraint user_settings_default_map_mode_check check (default_map_mode in ('driving', 'walking', 'transit'))
);

create index if not exists idx_user_settings_preferred_trip_id on public.user_settings (preferred_trip_id);

alter table public.user_settings enable row level security;

drop policy if exists user_settings_owner_read on public.user_settings;
create policy user_settings_owner_read
on public.user_settings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_settings_owner_insert on public.user_settings;
create policy user_settings_owner_insert
on public.user_settings
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    preferred_trip_id is null
    or public.is_trip_member(preferred_trip_id)
    or public.is_global_admin()
  )
);

drop policy if exists user_settings_owner_update on public.user_settings;
create policy user_settings_owner_update
on public.user_settings
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    preferred_trip_id is null
    or public.is_trip_member(preferred_trip_id)
    or public.is_global_admin()
  )
);

drop policy if exists user_settings_owner_delete on public.user_settings;
create policy user_settings_owner_delete
on public.user_settings
for delete
to authenticated
using (user_id = auth.uid());

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.viajemos_set_updated_at();
