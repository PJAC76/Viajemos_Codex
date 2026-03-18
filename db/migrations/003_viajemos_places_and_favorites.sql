create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type text not null,
  name text not null,
  address text not null default '',
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  website_url text,
  image_url text,
  notes text,
  rating numeric(2, 1),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_type_check check (type in ('hotel', 'restaurant', 'place')),
  constraint places_rating_check check (rating is null or (rating >= 0 and rating <= 5))
);

create table if not exists public.place_favorites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint place_favorites_unique_place_user unique (place_id, user_id)
);

create index if not exists idx_places_trip on public.places (trip_id);
create index if not exists idx_places_created_by on public.places (created_by);
create index if not exists idx_places_type on public.places (type);
create index if not exists idx_place_favorites_trip on public.place_favorites (trip_id);
create index if not exists idx_place_favorites_place on public.place_favorites (place_id);
create index if not exists idx_place_favorites_user on public.place_favorites (user_id);

alter table public.places enable row level security;
alter table public.place_favorites enable row level security;

drop policy if exists places_member_read on public.places;
create policy places_member_read
on public.places
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists places_member_insert on public.places;
create policy places_member_insert
on public.places
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and auth.uid() = created_by
);

drop policy if exists places_owner_or_admin_update on public.places;
create policy places_owner_or_admin_update
on public.places
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

drop policy if exists places_owner_or_admin_delete on public.places;
create policy places_owner_or_admin_delete
on public.places
for delete
to authenticated
using (
  public.is_trip_admin(trip_id)
  or auth.uid() = created_by
);

drop policy if exists place_favorites_member_read on public.place_favorites;
create policy place_favorites_member_read
on public.place_favorites
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists place_favorites_member_insert on public.place_favorites;
create policy place_favorites_member_insert
on public.place_favorites
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and auth.uid() = user_id
  and exists (
    select 1
    from public.places
    where id = place_id
      and trip_id = place_favorites.trip_id
  )
);

drop policy if exists place_favorites_owner_or_admin_delete on public.place_favorites;
create policy place_favorites_owner_or_admin_delete
on public.place_favorites
for delete
to authenticated
using (
  public.is_trip_admin(trip_id)
  or auth.uid() = user_id
);

drop trigger if exists trg_places_updated_at on public.places;
create trigger trg_places_updated_at
before update on public.places
for each row
execute function public.viajemos_set_updated_at();
