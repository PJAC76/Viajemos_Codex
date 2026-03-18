alter table public.trips
  add column if not exists settlement_status text not null default 'open',
  add column if not exists settlement_closed_at timestamptz,
  add column if not exists settlement_closed_by uuid references auth.users(id) on delete set null;

alter table public.trips
  drop constraint if exists trips_settlement_status_check;

alter table public.trips
  add constraint trips_settlement_status_check check (settlement_status in ('open', 'closed'));

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete restrict,
  to_user_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(10, 2) not null,
  currency text not null default 'EUR',
  status text not null default 'pending',
  reason text not null default 'Balance neto del viaje',
  settled_at timestamptz,
  settled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settlements_amount_check check (amount >= 0),
  constraint settlements_currency_check check (currency = 'EUR'),
  constraint settlements_status_check check (status in ('pending', 'settled')),
  constraint settlements_distinct_users_check check (from_user_id <> to_user_id)
);

create index if not exists idx_settlements_trip on public.settlements (trip_id);
create index if not exists idx_settlements_trip_status on public.settlements (trip_id, status);
create index if not exists idx_settlements_from_user on public.settlements (from_user_id);
create index if not exists idx_settlements_to_user on public.settlements (to_user_id);

create or replace function public.is_trip_settlement_open(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trips
    where id = target_trip_id
      and settlement_status = 'open'
  );
$$;

create or replace function public.sync_trip_settlements(target_trip_id uuid)
returns setof public.settlements
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  creditor_ids uuid[];
  creditor_balances numeric[];
  debtor_ids uuid[];
  debtor_balances numeric[];
  creditor_index integer := 1;
  debtor_index integer := 1;
  transfer_amount numeric(10, 2);
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not public.is_trip_member(target_trip_id) then
    raise exception 'TRIP_ACCESS_REQUIRED';
  end if;

  if exists (
    select 1
    from public.trips
    where id = target_trip_id
      and settlement_status = 'closed'
  ) then
    return query
    select *
    from public.settlements
    where trip_id = target_trip_id
    order by
      case when status = 'pending' then 0 else 1 end,
      amount desc,
      created_at asc;
    return;
  end if;

  create temporary table if not exists tmp_settlement_balances (
    user_id uuid primary key,
    balance numeric(10, 2) not null
  ) on commit drop;

  truncate table tmp_settlement_balances;

  insert into tmp_settlement_balances (user_id, balance)
  with expense_movements as (
    select
      e.paid_by as user_id,
      sum(e.amount)::numeric(10, 2) as delta
    from public.expenses e
    where e.trip_id = target_trip_id
    group by e.paid_by

    union all

    select
      es.user_id,
      sum(es.amount * -1)::numeric(10, 2) as delta
    from public.expense_splits es
    where es.trip_id = target_trip_id
    group by es.user_id
  ),
  settled_movements as (
    select
      s.from_user_id as user_id,
      sum(s.amount)::numeric(10, 2) as delta
    from public.settlements s
    where s.trip_id = target_trip_id
      and s.status = 'settled'
    group by s.from_user_id

    union all

    select
      s.to_user_id as user_id,
      sum(s.amount * -1)::numeric(10, 2) as delta
    from public.settlements s
    where s.trip_id = target_trip_id
      and s.status = 'settled'
    group by s.to_user_id
  ),
  combined as (
    select user_id, delta from expense_movements
    union all
    select user_id, delta from settled_movements
  )
  select
    user_id,
    round(sum(delta)::numeric, 2) as balance
  from combined
  group by user_id
  having abs(sum(delta)) > 0.01;

  delete from public.settlements
  where trip_id = target_trip_id
    and status = 'pending';

  select
    coalesce(array_agg(user_id order by balance desc, user_id), '{}'::uuid[]),
    coalesce(array_agg(balance order by balance desc, user_id), '{}'::numeric[])
  into creditor_ids, creditor_balances
  from tmp_settlement_balances
  where balance > 0.01;

  select
    coalesce(array_agg(user_id order by balance asc, user_id), '{}'::uuid[]),
    coalesce(array_agg(abs(balance) order by balance asc, user_id), '{}'::numeric[])
  into debtor_ids, debtor_balances
  from tmp_settlement_balances
  where balance < -0.01;

  while creditor_index <= coalesce(array_length(creditor_ids, 1), 0)
    and debtor_index <= coalesce(array_length(debtor_ids, 1), 0)
  loop
    transfer_amount := round(least(creditor_balances[creditor_index], debtor_balances[debtor_index])::numeric, 2);

    if transfer_amount > 0.01 then
      insert into public.settlements (
        trip_id,
        from_user_id,
        to_user_id,
        amount,
        currency,
        status,
        reason
      )
      values (
        target_trip_id,
        debtor_ids[debtor_index],
        creditor_ids[creditor_index],
        transfer_amount,
        'EUR',
        'pending',
        'Balance neto del viaje'
      );
    end if;

    creditor_balances[creditor_index] := creditor_balances[creditor_index] - transfer_amount;
    debtor_balances[debtor_index] := debtor_balances[debtor_index] - transfer_amount;

    if creditor_balances[creditor_index] <= 0.01 then
      creditor_index := creditor_index + 1;
    end if;

    if debtor_balances[debtor_index] <= 0.01 then
      debtor_index := debtor_index + 1;
    end if;
  end loop;

  return query
  select *
  from public.settlements
  where trip_id = target_trip_id
  order by
    case when status = 'pending' then 0 else 1 end,
    amount desc,
    created_at asc;
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

  return trip_row;
end;
$$;

create or replace function public.create_expense_with_splits(
  target_trip_id uuid,
  expense_concept text,
  expense_category_id text,
  expense_amount numeric,
  expense_paid_by uuid,
  expense_date date,
  expense_description text,
  split_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  next_expense_id uuid := gen_random_uuid();
  total_members integer;
  base_amount numeric(10, 2);
  remaining_amount numeric(10, 2);
  member_id uuid;
  member_index integer := 1;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if array_length(split_user_ids, 1) is null or array_length(split_user_ids, 1) = 0 then
    raise exception 'EXPENSE_SPLITS_REQUIRED';
  end if;

  if not public.is_trip_member(target_trip_id) then
    raise exception 'TRIP_ACCESS_REQUIRED';
  end if;

  if not public.is_trip_settlement_open(target_trip_id) then
    raise exception 'SETTLEMENTS_ALREADY_CLOSED';
  end if;

  if not exists (
    select 1
    from public.trip_members
    where trip_id = target_trip_id
      and user_id = expense_paid_by
      and status = 'active'
  ) then
    raise exception 'PAYER_NOT_ACTIVE';
  end if;

  if exists (
    select 1
    from unnest(split_user_ids) as selected_user_id
    where not exists (
      select 1
      from public.trip_members
      where trip_id = target_trip_id
        and user_id = selected_user_id
        and status = 'active'
    )
  ) then
    raise exception 'INVALID_SPLIT_MEMBER';
  end if;

  insert into public.expenses (
    id,
    trip_id,
    concept,
    category_id,
    amount,
    currency,
    paid_by,
    expense_date,
    description,
    created_by
  )
  values (
    next_expense_id,
    target_trip_id,
    trim(expense_concept),
    expense_category_id,
    expense_amount,
    'EUR',
    expense_paid_by,
    expense_date,
    nullif(trim(coalesce(expense_description, '')), ''),
    current_user_id
  );

  total_members := array_length(split_user_ids, 1);
  base_amount := round((expense_amount / total_members)::numeric, 2);
  remaining_amount := expense_amount - (base_amount * (total_members - 1));

  foreach member_id in array split_user_ids loop
    insert into public.expense_splits (
      trip_id,
      expense_id,
      user_id,
      amount,
      status
    )
    values (
      target_trip_id,
      next_expense_id,
      member_id,
      case
        when member_index = total_members then remaining_amount
        else base_amount
      end,
      'pending'
    );

    member_index := member_index + 1;
  end loop;

  return next_expense_id;
end;
$$;

create or replace function public.update_expense_with_splits(
  target_expense_id uuid,
  expense_concept text,
  expense_category_id text,
  expense_amount numeric,
  expense_paid_by uuid,
  expense_date date,
  expense_description text,
  split_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  expense_row public.expenses%rowtype;
  total_members integer;
  base_amount numeric(10, 2);
  remaining_amount numeric(10, 2);
  member_id uuid;
  member_index integer := 1;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if array_length(split_user_ids, 1) is null or array_length(split_user_ids, 1) = 0 then
    raise exception 'EXPENSE_SPLITS_REQUIRED';
  end if;

  select *
  into expense_row
  from public.expenses
  where id = target_expense_id
  limit 1
  for update;

  if not found then
    raise exception 'EXPENSE_NOT_FOUND';
  end if;

  if not public.is_trip_settlement_open(expense_row.trip_id) then
    raise exception 'SETTLEMENTS_ALREADY_CLOSED';
  end if;

  if not (public.is_trip_admin(expense_row.trip_id) or expense_row.created_by = current_user_id) then
    raise exception 'EXPENSE_EDIT_FORBIDDEN';
  end if;

  if not exists (
    select 1
    from public.trip_members
    where trip_id = expense_row.trip_id
      and user_id = expense_paid_by
      and status = 'active'
  ) then
    raise exception 'PAYER_NOT_ACTIVE';
  end if;

  if exists (
    select 1
    from unnest(split_user_ids) as selected_user_id
    where not exists (
      select 1
      from public.trip_members
      where trip_id = expense_row.trip_id
        and user_id = selected_user_id
        and status = 'active'
    )
  ) then
    raise exception 'INVALID_SPLIT_MEMBER';
  end if;

  update public.expenses
  set
    concept = trim(expense_concept),
    category_id = expense_category_id,
    amount = expense_amount,
    paid_by = expense_paid_by,
    expense_date = expense_date,
    description = nullif(trim(coalesce(expense_description, '')), '')
  where id = target_expense_id;

  delete from public.expense_splits
  where expense_id = target_expense_id;

  total_members := array_length(split_user_ids, 1);
  base_amount := round((expense_amount / total_members)::numeric, 2);
  remaining_amount := expense_amount - (base_amount * (total_members - 1));

  foreach member_id in array split_user_ids loop
    insert into public.expense_splits (
      trip_id,
      expense_id,
      user_id,
      amount,
      status
    )
    values (
      expense_row.trip_id,
      target_expense_id,
      member_id,
      case
        when member_index = total_members then remaining_amount
        else base_amount
      end,
      'pending'
    );

    member_index := member_index + 1;
  end loop;

  return target_expense_id;
end;
$$;

alter table public.settlements enable row level security;

drop policy if exists settlements_member_read on public.settlements;
create policy settlements_member_read
on public.settlements
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists expenses_member_insert on public.expenses;
create policy expenses_member_insert
on public.expenses
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and public.is_trip_settlement_open(trip_id)
  and auth.uid() = created_by
  and exists (
    select 1
    from public.trip_members
    where trip_id = expenses.trip_id
      and user_id = paid_by
      and status = 'active'
  )
);

drop policy if exists expenses_owner_or_admin_update on public.expenses;
create policy expenses_owner_or_admin_update
on public.expenses
for update
to authenticated
using (
  public.is_trip_settlement_open(trip_id)
  and (
    public.is_trip_admin(trip_id)
    or auth.uid() = created_by
  )
)
with check (
  public.is_trip_settlement_open(trip_id)
  and (
    public.is_trip_admin(trip_id)
    or auth.uid() = created_by
  )
  and exists (
    select 1
    from public.trip_members
    where trip_id = expenses.trip_id
      and user_id = paid_by
      and status = 'active'
  )
);

drop policy if exists expenses_owner_or_admin_delete on public.expenses;
create policy expenses_owner_or_admin_delete
on public.expenses
for delete
to authenticated
using (
  public.is_trip_settlement_open(trip_id)
  and (
    public.is_trip_admin(trip_id)
    or auth.uid() = created_by
  )
);

drop policy if exists expense_splits_owner_or_admin_insert on public.expense_splits;
create policy expense_splits_owner_or_admin_insert
on public.expense_splits
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and public.is_trip_settlement_open(trip_id)
  and exists (
    select 1
    from public.expenses
    where id = expense_splits.expense_id
      and trip_id = expense_splits.trip_id
      and (
        created_by = auth.uid()
        or public.is_trip_admin(expense_splits.trip_id)
      )
  )
);

drop policy if exists expense_splits_owner_or_admin_update on public.expense_splits;
create policy expense_splits_owner_or_admin_update
on public.expense_splits
for update
to authenticated
using (
  public.is_trip_settlement_open(trip_id)
  and exists (
    select 1
    from public.expenses
    where id = expense_splits.expense_id
      and trip_id = expense_splits.trip_id
      and (
        created_by = auth.uid()
        or public.is_trip_admin(expense_splits.trip_id)
      )
  )
)
with check (
  public.is_trip_settlement_open(trip_id)
  and exists (
    select 1
    from public.expenses
    where id = expense_splits.expense_id
      and trip_id = expense_splits.trip_id
      and (
        created_by = auth.uid()
        or public.is_trip_admin(expense_splits.trip_id)
      )
  )
);

drop policy if exists expense_splits_owner_or_admin_delete on public.expense_splits;
create policy expense_splits_owner_or_admin_delete
on public.expense_splits
for delete
to authenticated
using (
  public.is_trip_settlement_open(trip_id)
  and exists (
    select 1
    from public.expenses
    where id = expense_splits.expense_id
      and trip_id = expense_splits.trip_id
      and (
        created_by = auth.uid()
        or public.is_trip_admin(expense_splits.trip_id)
      )
  )
);

drop policy if exists expense_receipts_owner_or_admin_insert on public.expense_receipts;
create policy expense_receipts_owner_or_admin_insert
on public.expense_receipts
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and public.is_trip_settlement_open(trip_id)
  and uploaded_by = auth.uid()
  and exists (
    select 1
    from public.expenses
    where id = expense_receipts.expense_id
      and trip_id = expense_receipts.trip_id
      and (
        created_by = auth.uid()
        or public.is_trip_admin(expense_receipts.trip_id)
      )
  )
);

drop policy if exists expense_receipts_owner_or_admin_update on public.expense_receipts;
create policy expense_receipts_owner_or_admin_update
on public.expense_receipts
for update
to authenticated
using (
  public.is_trip_settlement_open(trip_id)
  and exists (
    select 1
    from public.expenses
    where id = expense_receipts.expense_id
      and trip_id = expense_receipts.trip_id
      and (
        created_by = auth.uid()
        or public.is_trip_admin(expense_receipts.trip_id)
      )
  )
)
with check (
  public.is_trip_settlement_open(trip_id)
  and exists (
    select 1
    from public.expenses
    where id = expense_receipts.expense_id
      and trip_id = expense_receipts.trip_id
      and (
        created_by = auth.uid()
        or public.is_trip_admin(expense_receipts.trip_id)
      )
  )
);

drop policy if exists expense_receipts_owner_or_admin_delete on public.expense_receipts;
create policy expense_receipts_owner_or_admin_delete
on public.expense_receipts
for delete
to authenticated
using (
  public.is_trip_settlement_open(trip_id)
  and exists (
    select 1
    from public.expenses
    where id = expense_receipts.expense_id
      and trip_id = expense_receipts.trip_id
      and (
        created_by = auth.uid()
        or public.is_trip_admin(expense_receipts.trip_id)
      )
  )
);

drop trigger if exists trg_settlements_updated_at on public.settlements;
create trigger trg_settlements_updated_at
before update on public.settlements
for each row
execute function public.viajemos_set_updated_at();
