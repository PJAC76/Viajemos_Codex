create or replace function public.reorder_itinerary_items(target_day_id uuid, ordered_item_ids uuid[])
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  item_id uuid;
  next_position integer := 1;
  day_trip_id uuid;
begin
  select trip_id
  into day_trip_id
  from public.itinerary_days
  where id = target_day_id
  limit 1;

  if day_trip_id is null then
    raise exception 'ITINERARY_DAY_NOT_FOUND';
  end if;

  if not public.is_trip_admin(day_trip_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  update public.itinerary_items
  set
    order_index = order_index + 1000,
    updated_at = now()
  where day_id = target_day_id;

  foreach item_id in array ordered_item_ids loop
    update public.itinerary_items
    set
      order_index = next_position,
      updated_at = now()
    where id = item_id
      and day_id = target_day_id;

    next_position := next_position + 1;
  end loop;

  return true;
end;
$$;
