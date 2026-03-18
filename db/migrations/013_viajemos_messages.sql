create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messages_body_check check (char_length(trim(body)) > 0)
);

create index if not exists idx_messages_trip_created_at on public.messages (trip_id, created_at desc);
create index if not exists idx_messages_author on public.messages (author_id);

alter table public.messages enable row level security;

drop policy if exists messages_member_read on public.messages;
create policy messages_member_read
on public.messages
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists messages_member_insert on public.messages;
create policy messages_member_insert
on public.messages
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and author_id = auth.uid()
);

drop policy if exists messages_owner_or_admin_update on public.messages;
create policy messages_owner_or_admin_update
on public.messages
for update
to authenticated
using (
  public.is_trip_admin(trip_id)
  or author_id = auth.uid()
)
with check (
  public.is_trip_admin(trip_id)
  or author_id = auth.uid()
);

drop policy if exists messages_owner_or_admin_delete on public.messages;
create policy messages_owner_or_admin_delete
on public.messages
for delete
to authenticated
using (
  public.is_trip_admin(trip_id)
  or author_id = auth.uid()
);

drop trigger if exists trg_messages_updated_at on public.messages;
create trigger trg_messages_updated_at
before update on public.messages
for each row
execute function public.viajemos_set_updated_at();

insert into realtime.channels (pattern, description, enabled)
values ('trip-chat:%', 'Chat de grupo por viaje para Viajemos', true)
on conflict (pattern) do update
set
  description = excluded.description,
  enabled = excluded.enabled;

create or replace function public.notify_trip_message_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.publish(
    'trip-chat:' || new.trip_id::text,
    'message_created',
    jsonb_build_object(
      'id', new.id,
      'trip_id', new.trip_id,
      'author_id', new.author_id,
      'body', new.body,
      'created_at', new.created_at,
      'updated_at', new.updated_at
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_messages_realtime_insert on public.messages;
create trigger trg_messages_realtime_insert
after insert on public.messages
for each row
execute function public.notify_trip_message_created();
