create table if not exists public.route_snapshots (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_id uuid not null unique references public.itinerary_days(id) on delete cascade,
  total_distance_km numeric(10, 2) not null default 0,
  total_duration_minutes integer not null default 0,
  travel_mode text not null default 'driving',
  segments jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint route_snapshots_travel_mode_check check (travel_mode in ('driving', 'walking', 'transit'))
);

create index if not exists idx_route_snapshots_trip on public.route_snapshots (trip_id);
create index if not exists idx_route_snapshots_day on public.route_snapshots (day_id);

alter table public.route_snapshots enable row level security;

drop policy if exists route_snapshots_member_read on public.route_snapshots;
create policy route_snapshots_member_read
on public.route_snapshots
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists route_snapshots_member_insert on public.route_snapshots;
create policy route_snapshots_member_insert
on public.route_snapshots
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and created_by = auth.uid()
);

drop policy if exists route_snapshots_member_update on public.route_snapshots;
create policy route_snapshots_member_update
on public.route_snapshots
for update
to authenticated
using (public.is_trip_member(trip_id))
with check (public.is_trip_member(trip_id));

drop policy if exists route_snapshots_member_delete on public.route_snapshots;
create policy route_snapshots_member_delete
on public.route_snapshots
for delete
to authenticated
using (public.is_trip_member(trip_id));

drop trigger if exists trg_route_snapshots_updated_at on public.route_snapshots;
create trigger trg_route_snapshots_updated_at
before update on public.route_snapshots
for each row
execute function public.viajemos_set_updated_at();
