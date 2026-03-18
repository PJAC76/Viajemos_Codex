create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null default 'system',
  title text not null,
  body text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_kind_check check (kind in ('invitation', 'expense', 'message', 'itinerary', 'settlement', 'system'))
);

create index if not exists idx_notifications_user_created_at on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_user_is_read on public.notifications (user_id, is_read);
create index if not exists idx_notifications_trip on public.notifications (trip_id);

alter table public.notifications enable row level security;

drop policy if exists notifications_owner_read on public.notifications;
create policy notifications_owner_read
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notifications_owner_delete on public.notifications;
create policy notifications_owner_delete
on public.notifications
for delete
to authenticated
using (user_id = auth.uid());

drop trigger if exists trg_notifications_updated_at on public.notifications;
create trigger trg_notifications_updated_at
before update on public.notifications
for each row
execute function public.viajemos_set_updated_at();

insert into realtime.channels (pattern, description, enabled)
values ('user-notifications:%', 'Feed privado de notificaciones por usuario', true)
on conflict (pattern) do update
set
  description = excluded.description,
  enabled = excluded.enabled;

create or replace function public.create_notification(
  target_user_id uuid,
  target_trip_id uuid,
  target_actor_id uuid,
  notification_kind text,
  notification_title text,
  notification_body text,
  notification_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_notification_id uuid := gen_random_uuid();
begin
  insert into public.notifications (
    id,
    user_id,
    trip_id,
    actor_id,
    kind,
    title,
    body,
    metadata
  )
  values (
    next_notification_id,
    target_user_id,
    target_trip_id,
    target_actor_id,
    notification_kind,
    notification_title,
    notification_body,
    coalesce(notification_metadata, '{}'::jsonb)
  );

  return next_notification_id;
end;
$$;

create or replace function public.notify_notification_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.publish(
    'user-notifications:' || new.user_id::text,
    'notification_created',
    jsonb_build_object(
      'id', new.id,
      'user_id', new.user_id,
      'trip_id', new.trip_id,
      'actor_id', new.actor_id,
      'kind', new.kind,
      'title', new.title,
      'body', new.body,
      'is_read', new.is_read,
      'read_at', new.read_at,
      'metadata', new.metadata,
      'created_at', new.created_at,
      'updated_at', new.updated_at
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notifications_realtime_insert on public.notifications;
create trigger trg_notifications_realtime_insert
after insert on public.notifications
for each row
execute function public.notify_notification_created();

create or replace function public.notify_invitation_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invited_user_id uuid;
  trip_title text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select id
  into invited_user_id
  from auth.users
  where lower(email) = lower(new.email)
  limit 1;

  if invited_user_id is null then
    return new;
  end if;

  select title
  into trip_title
  from public.trips
  where id = new.trip_id
  limit 1;

  perform public.create_notification(
    invited_user_id,
    new.trip_id,
    new.invited_by,
    'invitation',
    'Nueva invitacion de viaje',
    coalesce(trip_title, 'Un viaje privado') || ' te esta esperando.',
    jsonb_build_object('invitation_id', new.id, 'status', new.status)
  );

  return new;
end;
$$;

drop trigger if exists trg_trip_invitations_notify_insert on public.trip_invitations;
create trigger trg_trip_invitations_notify_insert
after insert on public.trip_invitations
for each row
execute function public.notify_invitation_created();

create or replace function public.notify_invitation_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trip_title text;
  accepted_member_name text;
begin
  if old.status = new.status or new.status <> 'accepted' then
    return new;
  end if;

  select title
  into trip_title
  from public.trips
  where id = new.trip_id
  limit 1;

  select display_name
  into accepted_member_name
  from public.profiles
  where user_id = (
    select tm.user_id
    from public.trip_members tm
    join auth.users au on au.id = tm.user_id
    where tm.trip_id = new.trip_id
      and lower(au.email) = lower(new.email)
    order by tm.joined_at desc
    limit 1
  );

  perform public.create_notification(
    new.invited_by,
    new.trip_id,
    null,
    'invitation',
    'Invitacion aceptada',
    coalesce(accepted_member_name, new.email) || ' ya forma parte de ' || coalesce(trip_title, 'tu viaje') || '.',
    jsonb_build_object('invitation_id', new.id, 'status', new.status)
  );

  return new;
end;
$$;

drop trigger if exists trg_trip_invitations_notify_accept on public.trip_invitations;
create trigger trg_trip_invitations_notify_accept
after update on public.trip_invitations
for each row
execute function public.notify_invitation_accepted();

create or replace function public.notify_expense_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trip_title text;
begin
  select title
  into trip_title
  from public.trips
  where id = new.trip_id
  limit 1;

  insert into public.notifications (user_id, trip_id, actor_id, kind, title, body, metadata)
  select
    tm.user_id,
    new.trip_id,
    new.created_by,
    'expense',
    'Nuevo gasto registrado',
    trim(new.concept) || ' por ' || to_char(new.amount, 'FM999999990.00') || ' EUR en ' || coalesce(trip_title, 'tu viaje') || '.',
    jsonb_build_object('expense_id', new.id)
  from public.trip_members tm
  where tm.trip_id = new.trip_id
    and tm.status = 'active'
    and tm.user_id <> new.created_by;

  return new;
end;
$$;

drop trigger if exists trg_expenses_notify_insert on public.expenses;
create trigger trg_expenses_notify_insert
after insert on public.expenses
for each row
execute function public.notify_expense_created();

create or replace function public.notify_message_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, trip_id, actor_id, kind, title, body, metadata)
  select
    tm.user_id,
    new.trip_id,
    new.author_id,
    'message',
    'Nuevo mensaje del viaje',
    left(trim(new.body), 180),
    jsonb_build_object('message_id', new.id)
  from public.trip_members tm
  where tm.trip_id = new.trip_id
    and tm.status = 'active'
    and tm.user_id <> new.author_id;

  return new;
end;
$$;

drop trigger if exists trg_messages_notify_insert on public.messages;
create trigger trg_messages_notify_insert
after insert on public.messages
for each row
execute function public.notify_message_created();

create or replace function public.notify_itinerary_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_title text;
  event_trip_id uuid;
  event_actor_id uuid;
begin
  event_title := case
    when tg_op = 'INSERT' then 'Nuevo plan en el itinerario'
    else 'Itinerario actualizado'
  end;

  event_trip_id := new.trip_id;
  event_actor_id := new.created_by;

  insert into public.notifications (user_id, trip_id, actor_id, kind, title, body, metadata)
  select
    tm.user_id,
    event_trip_id,
    event_actor_id,
    'itinerary',
    event_title,
    left(trim(new.title), 180),
    jsonb_build_object('itinerary_item_id', new.id, 'operation', tg_op)
  from public.trip_members tm
  where tm.trip_id = event_trip_id
    and tm.status = 'active'
    and tm.user_id <> event_actor_id;

  return new;
end;
$$;

drop trigger if exists trg_itinerary_items_notify_insert on public.itinerary_items;
create trigger trg_itinerary_items_notify_insert
after insert on public.itinerary_items
for each row
execute function public.notify_itinerary_changed();

drop trigger if exists trg_itinerary_items_notify_update on public.itinerary_items;
create trigger trg_itinerary_items_notify_update
after update on public.itinerary_items
for each row
when (
  old.title is distinct from new.title
  or old.start_time is distinct from new.start_time
  or old.end_time is distinct from new.end_time
  or old.address is distinct from new.address
  or old.notes is distinct from new.notes
)
execute function public.notify_itinerary_changed();

create or replace function public.mark_notification_as_read(target_notification_id uuid)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  notification_row public.notifications%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  update public.notifications
  set
    is_read = true,
    read_at = coalesce(read_at, now()),
    updated_at = now()
  where id = target_notification_id
    and user_id = current_user_id
  returning *
  into notification_row;

  if not found then
    raise exception 'NOTIFICATION_NOT_FOUND';
  end if;

  return notification_row;
end;
$$;

create or replace function public.mark_all_notifications_as_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  updated_count integer := 0;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  update public.notifications
  set
    is_read = true,
    read_at = coalesce(read_at, now()),
    updated_at = now()
  where user_id = current_user_id
    and is_read = false;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.mark_settlement_as_settled(target_settlement_id uuid)
returns public.settlements
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  settlement_row public.settlements%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into settlement_row
  from public.settlements
  where id = target_settlement_id
  limit 1
  for update;

  if not found then
    raise exception 'SETTLEMENT_NOT_FOUND';
  end if;

  if settlement_row.status <> 'pending' then
    raise exception 'SETTLEMENT_ALREADY_RESOLVED';
  end if;

  if not (
    public.is_trip_admin(settlement_row.trip_id)
    or current_user_id = settlement_row.from_user_id
    or current_user_id = settlement_row.to_user_id
  ) then
    raise exception 'SETTLEMENT_SETTLE_FORBIDDEN';
  end if;

  if not public.is_trip_settlement_open(settlement_row.trip_id) then
    raise exception 'SETTLEMENTS_ALREADY_CLOSED';
  end if;

  update public.settlements
  set
    status = 'settled',
    settled_at = now(),
    settled_by = current_user_id,
    updated_at = now()
  where id = target_settlement_id
  returning *
  into settlement_row;

  perform public.create_notification(
    settlement_row.from_user_id,
    settlement_row.trip_id,
    current_user_id,
    'settlement',
    'Deuda saldada',
    'Se ha marcado como compensado un pago de ' || to_char(settlement_row.amount, 'FM999999990.00') || ' EUR.',
    jsonb_build_object('settlement_id', settlement_row.id, 'status', settlement_row.status)
  );

  if settlement_row.to_user_id <> settlement_row.from_user_id then
    perform public.create_notification(
      settlement_row.to_user_id,
      settlement_row.trip_id,
      current_user_id,
      'settlement',
      'Pago recibido',
      'Se ha registrado un pago de ' || to_char(settlement_row.amount, 'FM999999990.00') || ' EUR en la liquidacion.',
      jsonb_build_object('settlement_id', settlement_row.id, 'status', settlement_row.status)
    );
  end if;

  perform public.sync_trip_settlements(settlement_row.trip_id);

  return settlement_row;
end;
$$;

create or replace function public.close_trip_settlements(target_trip_id uuid)
returns public.trips
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  trip_row public.trips%rowtype;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not public.is_trip_admin(target_trip_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  perform public.sync_trip_settlements(target_trip_id);

  if exists (
    select 1
    from public.settlements
    where trip_id = target_trip_id
      and status = 'pending'
      and amount > 0.01
  ) then
    raise exception 'SETTLEMENTS_PENDING';
  end if;

  update public.trips
  set
    settlement_status = 'closed',
    settlement_closed_at = now(),
    settlement_closed_by = current_user_id,
    updated_at = now()
  where id = target_trip_id
  returning *
  into trip_row;

  insert into public.notifications (user_id, trip_id, actor_id, kind, title, body, metadata)
  select
    tm.user_id,
    target_trip_id,
    current_user_id,
    'settlement',
    'Liquidacion cerrada',
    'La liquidacion final del viaje ya se ha cerrado.',
    jsonb_build_object('trip_id', target_trip_id, 'status', 'closed')
  from public.trip_members tm
  where tm.trip_id = target_trip_id
    and tm.status = 'active'
    and tm.user_id <> current_user_id;

  return trip_row;
end;
$$;
