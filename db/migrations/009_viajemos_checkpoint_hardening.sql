create or replace function public.create_trip_with_admin(
  trip_title text,
  trip_destination text,
  trip_description text,
  trip_cover_image text,
  trip_start_date date,
  trip_end_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  next_trip_id uuid := gen_random_uuid();
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  insert into public.trips (
    id,
    title,
    destination,
    description,
    cover_image,
    start_date,
    end_date,
    currency,
    status,
    created_by
  )
  values (
    next_trip_id,
    trim(trip_title),
    trim(trip_destination),
    coalesce(trim(trip_description), ''),
    nullif(trim(coalesce(trip_cover_image, '')), ''),
    trip_start_date,
    trip_end_date,
    'EUR',
    'active',
    current_user_id
  );

  insert into public.trip_members (
    trip_id,
    user_id,
    role,
    status
  )
  values (
    next_trip_id,
    current_user_id,
    'admin',
    'active'
  );

  return next_trip_id;
end;
$$;

drop policy if exists places_owner_or_admin_update on public.places;
create policy places_admin_update
on public.places
for update
to authenticated
using (public.is_trip_admin(trip_id))
with check (public.is_trip_admin(trip_id));

drop policy if exists places_owner_or_admin_delete on public.places;
create policy places_admin_delete
on public.places
for delete
to authenticated
using (public.is_trip_admin(trip_id));
