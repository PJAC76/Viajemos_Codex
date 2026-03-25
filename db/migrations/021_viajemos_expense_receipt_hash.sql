alter table public.expense_receipts
add column if not exists file_hash text;

create index if not exists idx_expense_receipts_trip_hash
on public.expense_receipts (trip_id, file_hash)
where file_hash is not null;
