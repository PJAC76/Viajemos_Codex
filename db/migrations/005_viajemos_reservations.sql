create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  kind text not null,
  title text not null,
  confirmation_code text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  status text not null default 'pending',
  party_size integer not null default 1,
  room_or_table_count integer,
  amount numeric(10, 2),
  currency text not null default 'EUR',
  cancellation_policy text,
  phone text,
  email text,
  booking_url text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_kind_check check (kind in ('hotel', 'restaurant', 'activity')),
  constraint reservations_status_check check (status in ('pending', 'confirmed', 'cancelled')),
  constraint reservations_currency_check check (currency = 'EUR'),
  constraint reservations_party_size_check check (party_size >= 1),
  constraint reservations_room_or_table_count_check check (room_or_table_count is null or room_or_table_count >= 1),
  constraint reservations_amount_check check (amount is null or amount >= 0),
  constraint reservations_end_after_start_check check (end_at is null or end_at >= start_at)
);

create index if not exists idx_reservations_trip on public.reservations (trip_id);
create index if not exists idx_reservations_place on public.reservations (place_id);
create index if not exists idx_reservations_start on public.reservations (start_at);
create index if not exists idx_reservations_created_by on public.reservations (created_by);

alter table public.reservations enable row level security;

drop policy if exists reservations_member_read on public.reservations;
create policy reservations_member_read
on public.reservations
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists reservations_admin_insert on public.reservations;
create policy reservations_admin_insert
on public.reservations
for insert
to authenticated
with check (
  public.is_trip_admin(trip_id)
  and auth.uid() = created_by
);

drop policy if exists reservations_admin_update on public.reservations;
create policy reservations_admin_update
on public.reservations
for update
to authenticated
using (public.is_trip_admin(trip_id))
with check (public.is_trip_admin(trip_id));

drop policy if exists reservations_admin_delete on public.reservations;
create policy reservations_admin_delete
on public.reservations
for delete
to authenticated
using (public.is_trip_admin(trip_id));

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
before update on public.reservations
for each row
execute function public.viajemos_set_updated_at();
