create table if not exists public.expense_categories (
  id text primary key,
  label text not null,
  icon text not null,
  position integer not null default 1
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  concept text not null,
  category_id text not null references public.expense_categories(id) on delete restrict,
  amount numeric(10, 2) not null,
  currency text not null default 'EUR',
  paid_by uuid not null references auth.users(id) on delete restrict,
  expense_date date not null,
  description text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_amount_check check (amount >= 0),
  constraint expenses_currency_check check (currency = 'EUR')
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(10, 2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_splits_amount_check check (amount >= 0),
  constraint expense_splits_status_check check (status in ('pending', 'settled')),
  constraint expense_splits_unique_user unique (expense_id, user_id)
);

create table if not exists public.expense_receipts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  expense_id uuid not null unique references public.expenses(id) on delete cascade,
  bucket_name text not null default 'attachments-private',
  storage_key text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  file_url text,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_trip on public.expenses (trip_id);
create index if not exists idx_expenses_paid_by on public.expenses (paid_by);
create index if not exists idx_expenses_date on public.expenses (expense_date);
create index if not exists idx_expense_splits_trip on public.expense_splits (trip_id);
create index if not exists idx_expense_splits_expense on public.expense_splits (expense_id);
create index if not exists idx_expense_receipts_trip on public.expense_receipts (trip_id);
create index if not exists idx_expense_receipts_expense on public.expense_receipts (expense_id);

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

alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.expense_receipts enable row level security;

drop policy if exists expense_categories_read on public.expense_categories;
create policy expense_categories_read
on public.expense_categories
for select
to authenticated
using (true);

drop policy if exists expenses_member_read on public.expenses;
create policy expenses_member_read
on public.expenses
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
  public.is_trip_admin(trip_id)
  or auth.uid() = created_by
)
with check (
  (
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
  public.is_trip_admin(trip_id)
  or auth.uid() = created_by
);

drop policy if exists expense_splits_member_read on public.expense_splits;
create policy expense_splits_member_read
on public.expense_splits
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists expense_splits_owner_or_admin_insert on public.expense_splits;
create policy expense_splits_owner_or_admin_insert
on public.expense_splits
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
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
  exists (
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
  exists (
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
  exists (
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

drop policy if exists expense_receipts_member_read on public.expense_receipts;
create policy expense_receipts_member_read
on public.expense_receipts
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists expense_receipts_owner_or_admin_insert on public.expense_receipts;
create policy expense_receipts_owner_or_admin_insert
on public.expense_receipts
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
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
  exists (
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
  exists (
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
  exists (
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

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
before update on public.expenses
for each row
execute function public.viajemos_set_updated_at();

drop trigger if exists trg_expense_splits_updated_at on public.expense_splits;
create trigger trg_expense_splits_updated_at
before update on public.expense_splits
for each row
execute function public.viajemos_set_updated_at();

insert into public.expense_categories (id, label, icon, position)
values
  ('cat-stay', 'Alojamiento', 'hotel', 1),
  ('cat-food', 'Comida', 'restaurant', 2),
  ('cat-transport', 'Transporte', 'train', 3),
  ('cat-activity', 'Actividades', 'local_activity', 4),
  ('cat-shopping', 'Compras', 'shopping_bag', 5),
  ('cat-other', 'Otros', 'receipt_long', 6)
on conflict (id) do update
set
  label = excluded.label,
  icon = excluded.icon,
  position = excluded.position;
