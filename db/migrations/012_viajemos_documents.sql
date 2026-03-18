create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  expense_id uuid references public.expenses(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  title text not null,
  description text,
  document_type text not null default 'file',
  bucket_name text not null default 'attachments-private',
  storage_key text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  file_url text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_type_check check (document_type in ('pdf', 'image', 'file'))
);

create index if not exists idx_documents_trip on public.documents (trip_id);
create index if not exists idx_documents_expense on public.documents (expense_id);
create index if not exists idx_documents_reservation on public.documents (reservation_id);
create index if not exists idx_documents_created_by on public.documents (created_by);

alter table public.documents enable row level security;

drop policy if exists documents_member_read on public.documents;
create policy documents_member_read
on public.documents
for select
to authenticated
using (public.is_trip_member(trip_id));

drop policy if exists documents_member_insert on public.documents;
create policy documents_member_insert
on public.documents
for insert
to authenticated
with check (
  public.is_trip_member(trip_id)
  and created_by = auth.uid()
  and (
    expense_id is null
    or exists (
      select 1
      from public.expenses
      where id = documents.expense_id
        and trip_id = documents.trip_id
    )
  )
  and (
    reservation_id is null
    or exists (
      select 1
      from public.reservations
      where id = documents.reservation_id
        and trip_id = documents.trip_id
    )
  )
);

drop policy if exists documents_owner_or_admin_update on public.documents;
create policy documents_owner_or_admin_update
on public.documents
for update
to authenticated
using (
  public.is_trip_admin(trip_id)
  or created_by = auth.uid()
)
with check (
  (
    public.is_trip_admin(trip_id)
    or created_by = auth.uid()
  )
  and (
    expense_id is null
    or exists (
      select 1
      from public.expenses
      where id = documents.expense_id
        and trip_id = documents.trip_id
    )
  )
  and (
    reservation_id is null
    or exists (
      select 1
      from public.reservations
      where id = documents.reservation_id
        and trip_id = documents.trip_id
    )
  )
);

drop policy if exists documents_owner_or_admin_delete on public.documents;
create policy documents_owner_or_admin_delete
on public.documents
for delete
to authenticated
using (
  public.is_trip_admin(trip_id)
  or created_by = auth.uid()
);

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
before update on public.documents
for each row
execute function public.viajemos_set_updated_at();
