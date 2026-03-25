create or replace function public.update_expense_with_splits(
  target_expense_id uuid,
  next_expense_concept text,
  next_expense_category_id text,
  next_expense_amount numeric,
  next_expense_paid_by uuid,
  next_expense_date date,
  next_expense_description text,
  next_split_user_ids uuid[]
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

  if array_length(next_split_user_ids, 1) is null or array_length(next_split_user_ids, 1) = 0 then
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
      and user_id = next_expense_paid_by
      and status = 'active'
  ) then
    raise exception 'PAYER_NOT_ACTIVE';
  end if;

  if exists (
    select 1
    from unnest(next_split_user_ids) as selected_user_id
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
    concept = trim(next_expense_concept),
    category_id = next_expense_category_id,
    amount = next_expense_amount,
    paid_by = next_expense_paid_by,
    expense_date = next_expense_date,
    description = nullif(trim(coalesce(next_expense_description, '')), '')
  where id = target_expense_id;

  delete from public.expense_splits
  where expense_id = target_expense_id;

  total_members := array_length(next_split_user_ids, 1);
  base_amount := round((next_expense_amount / total_members)::numeric, 2);
  remaining_amount := next_expense_amount - (base_amount * (total_members - 1));

  foreach member_id in array next_split_user_ids loop
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
