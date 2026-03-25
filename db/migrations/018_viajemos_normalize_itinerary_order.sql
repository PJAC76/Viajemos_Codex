with ranked_items as (
  select
    id,
    row_number() over (partition by day_id order by order_index asc, created_at asc, id asc) as next_order
  from public.itinerary_items
)
update public.itinerary_items as items
set
  order_index = ranked_items.next_order,
  updated_at = now()
from ranked_items
where items.id = ranked_items.id
  and items.order_index <> ranked_items.next_order;
