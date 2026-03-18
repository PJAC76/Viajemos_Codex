create table if not exists public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null,
  label text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itinerary_days_unique_trip_date unique (trip_id, date),
  constraint itinerary_days_position_check check (position >= 1)
);

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_id uuid not null references public.itinerary_days(id) on delete cascade,
  type text not null,
  title text not null,
  start_time time not null,
  end_time time,
  address text not null default '',
  notes text not null default '',
  place_id uuid references public.places(id) on delete set null,
  order_index integer not null,
  icon text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itinerary_items_type_check check (type in ('linked_place', 'manual')),
  constraint itinerary_items_order_check check (order_index >= 1),
  constraint itinerary_items_end_after_start_check check (end_time is null or end_time >= start_time)
);

create index if not exists idx_itinerary_days_trip on public.itinerary_days (trip_id);
create index if not exists idx_itinerary_days_date on public.itinerary_days (date);
create index if not exists idx_itinerary_items_trip on public.itinerary_items (trip_id);
create index if not exists idx_itinerary_items_day on public.itinerary_items (day_id);
create index if not exists idx_itinerary_items_created_by on public.itinerary_items (created_by);
create unique index if not exists idx_itinerary_items_day_order on public.itinerary_items (day_id, order_index);

alter table public.itinerary_days enable row level security;
alter table public.itinerary_items enable row level security;

drop policy if exists itinerary_days_member_read on public.itinerary_days;
create policy itinerary_days_member_read
on public.itinerary_days
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists itinerary_days_member_insert on public.itinerary_days;
create policy itinerary_days_member_insert
on public.itinerary_days
for insert
to authenticated
with check (public.is_trip_member(trip_id));

drop policy if exists itinerary_days_admin_update on public.itinerary_days;
create policy itinerary_days_admin_update
on public.itinerary_days
for update
to authenticated
using (public.is_trip_admin(trip_id))
with check (public.is_trip_admin(trip_id));

drop policy if exists itinerary_days_admin_delete on public.itinerary_days;
create policy itinerary_days_admin_delete
on public.itinerary_days
for delete
to authenticated
using (public.is_trip_admin(trip_id));

drop policy if exists itinerary_items_member_read on public.itinerary_items;
create policy itinerary_items_member_read
on public.itinerary_items
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists itinerary_items_member_insert on public.itinerary_items;
create policy itinerary_items_member_insert
on public.itinerary_items
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and auth.uid() = created_by
  and exists (
    select 1
    from public.itinerary_days
    where id = day_id
      and trip_id = itinerary_items.trip_id
  )
);

drop policy if exists itinerary_items_owner_or_admin_update on public.itinerary_items;
create policy itinerary_items_owner_or_admin_update
on public.itinerary_items
for update
to authenticated
using (
  public.is_trip_admin(trip_id)
  or auth.uid() = created_by
)
with check (
  public.is_trip_admin(trip_id)
  or auth.uid() = created_by
);

drop policy if exists itinerary_items_owner_or_admin_delete on public.itinerary_items;
create policy itinerary_items_owner_or_admin_delete
on public.itinerary_items
for delete
to authenticated
using (
  public.is_trip_admin(trip_id)
  or auth.uid() = created_by
);

drop trigger if exists trg_itinerary_days_updated_at on public.itinerary_days;
create trigger trg_itinerary_days_updated_at
before update on public.itinerary_days
for each row
execute function public.viajemos_set_updated_at();

drop trigger if exists trg_itinerary_items_updated_at on public.itinerary_items;
create trigger trg_itinerary_items_updated_at
before update on public.itinerary_items
for each row
execute function public.viajemos_set_updated_at();
